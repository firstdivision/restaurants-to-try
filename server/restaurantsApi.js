const { readFile, writeFile, rename, unlink } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { lookupRestaurant } = require('./restaurantLookup');

const textFields = ['name', 'url', 'blurb', 'googleMapsLink', 'cuisine'];

function validateRestaurant(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'An entry must be a restaurant object.';
  }
  if (textFields.some((field) => typeof value[field] !== 'string')) {
    return 'Restaurant text fields must be strings.';
  }
  if (['name', 'blurb', 'cuisine'].some((field) => !value[field].trim())) {
    return 'Name, blurb, and cuisine are required.';
  }
  if (!Number.isFinite(value.lat) || Math.abs(value.lat) > 90 ||
      !Number.isFinite(value.lon) || Math.abs(value.lon) > 180) {
    return 'Latitude must be between -90 and 90; longitude must be between -180 and 180.';
  }
  for (const field of ['url', 'googleMapsLink']) {
    if (!value[field].trim()) continue;
    try {
      const url = new URL(value[field]);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'Links must use http or https.';
      }
    } catch {
      return 'Links must be valid URLs.';
    }
  }
  return null;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > 64 * 1024) {
        reject(Object.assign(new Error('Entry exceeds the 64 KB limit.'), { status: 413 }));
      } else {
        body += chunk;
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function createRestaurantMiddleware(dataPath = path.join(__dirname, '../src/data/restaurants.json'), lookup = lookupRestaurant) {
  let writes = Promise.resolve();

  async function loadRestaurants() {
    const data = JSON.parse(await readFile(dataPath, 'utf8'));
    if (!Array.isArray(data) || data.some((entry) => validateRestaurant(entry))) {
      throw new Error('The restaurant dataset is invalid; no changes were made.');
    }
    return data;
  }

  async function appendRestaurant(restaurant) {
    const data = await loadRestaurants();
    if (data.some((entry) =>
      entry.name.trim().toLowerCase() === restaurant.name.toLowerCase() ||
      (restaurant.googleMapsLink && entry.googleMapsLink.trim() === restaurant.googleMapsLink))) {
      throw Object.assign(new Error('A restaurant with this name or Google Maps link already exists.'), { status: 409 });
    }
    const temporaryPath = `${dataPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify([...data, restaurant], null, 4)}\n`, { flag: 'wx' });
      await rename(temporaryPath, dataPath);
    } catch (error) {
      try {
        await unlink(temporaryPath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') console.error('Could not clean up restaurant temporary file:', cleanupError);
      }
      throw error;
    }
    return { restaurant, total: data.length + 1 };
  }

  return async function restaurantsApi(req, res) {
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    };
    const host = req.headers.host || '';
    const origin = req.headers.origin;
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) ||
        (origin && origin !== `http://${host}`) ||
        (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site']))) {
      send(403, { error: 'The restaurant editor only accepts same-origin localhost requests.' });
      return;
    }
    const isLookup = req.url === '/lookup';
    if (req.url !== '/' && req.url !== '' && !isLookup) {
      send(404, { error: 'Unknown restaurant API route.' });
      return;
    }
    try {
      if (req.method === 'GET' && !isLookup) {
        send(200, { restaurants: await loadRestaurants() });
        return;
      }
      if (req.method !== 'POST') {
        res.setHeader('Allow', isLookup ? 'POST' : 'GET, POST');
        send(405, { error: isLookup ? 'Use POST to look up restaurant details.' : 'Use GET to read or POST to add a restaurant.' });
        return;
      }
      if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        send(415, { error: 'Content-Type must be application/json.' });
        return;
      }
      const value = await readJson(req);
      if (isLookup) {
        const data = await loadRestaurants();
        send(200, await lookup(value, [...new Set(data.map((entry) => entry.cuisine))]));
        return;
      }
      const validationError = validateRestaurant(value);
      if (validationError) {
        send(400, { error: validationError });
        return;
      }
      const restaurant = Object.fromEntries([
        ...textFields.map((field) => [field, value[field].trim()]),
        ['lat', value.lat],
        ['lon', value.lon],
      ]);
      const result = writes.then(() => appendRestaurant(restaurant));
      // Recover the queue after failures; the original result is still reported to this request.
      writes = result.catch(() => {});
      send(201, await result);
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error('Restaurant API failed:', error);
      send(status, { error: status === 500 ? 'Could not read or save restaurants.json. Check the local server terminal for details.' : error.message });
    }
  };
}

module.exports = { createRestaurantMiddleware };
