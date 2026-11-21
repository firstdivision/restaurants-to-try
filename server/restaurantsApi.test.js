const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { mkdtemp, readFile, writeFile, readdir, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRestaurantMiddleware } = require('./restaurantsApi');

const entry = {
  name: 'Test restaurant',
  url: 'https://example.com',
  blurb: 'A test entry.',
  lat: 30.3,
  lon: -97.7,
  googleMapsLink: '',
  cuisine: 'Test cuisine',
};

async function fixture(t, contents = '[]\n', lookup) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'restaurant-api-test-'));
  const dataPath = path.join(directory, 'restaurants.json');
  await writeFile(dataPath, contents);
  const server = http.createServer(createRestaurantMiddleware(dataPath, lookup));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true });
  });
  const url = `http://127.0.0.1:${server.address().port}/`;
  return {
    dataPath,
    directory,
    url,
    post: (body, headers = {}) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  };
}

function requestStatus(url, headers) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { headers }, (response) => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
    request.end();
  });
}

test('reads without writing; appends and persists a validated entry preserving existing data', async (t) => {
  const original = { ...entry, name: 'Existing restaurant' };
  const f = await fixture(t, JSON.stringify([original]));
  assert.deepEqual(await (await fetch(f.url)).json(), { restaurants: [original] });
  assert.equal(await readFile(f.dataPath, 'utf8'), JSON.stringify([original]));
  const response = await f.post({ ...entry, name: '  Test restaurant  ', extra: 'not persisted' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { restaurant: entry, total: 2 });
  assert.deepEqual(JSON.parse(await readFile(f.dataPath, 'utf8')), [original, entry]);
  assert.deepEqual(await readdir(f.directory), ['restaurants.json']);
});

test('rejects invalid input without changing the file', async (t) => {
  const f = await fixture(t);
  for (const invalid of [
    null, [], {}, { ...entry, name: ' ' }, { ...entry, blurb: '' },
    { ...entry, cuisine: '' }, { ...entry, lat: '30' }, { ...entry, lat: 91 },
    { ...entry, lon: -181 }, { ...entry, url: 'javascript:alert(1)' },
    { ...entry, googleMapsLink: 'not a URL' },
  ]) {
    const response = await f.post(invalid);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
  const malformed = await fetch(f.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(malformed.status, 400);
  const oversized = await f.post({ ...entry, blurb: 'x'.repeat(65 * 1024) });
  assert.equal(oversized.status, 413);
  assert.equal(await readFile(f.dataPath, 'utf8'), '[]\n');
});

test('rejects duplicates and serializes concurrent appends', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.post(entry)).status, 201);
  assert.equal((await f.post({ ...entry, name: entry.name.toUpperCase() })).status, 409);
  const responses = await Promise.all([
    f.post({ ...entry, name: 'Second', googleMapsLink: 'https://maps.google.com/?q=1,2' }),
    f.post({ ...entry, name: 'Third' }),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [201, 201]);
  assert.equal((await f.post({ ...entry, name: 'Fourth', googleMapsLink: 'https://maps.google.com/?q=1,2' })).status, 409);
  assert.equal(JSON.parse(await readFile(f.dataPath, 'utf8')).length, 3);
});

test('permits same-origin local requests and rejects other origins, hosts, methods, and content types', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.post(entry, { Origin: new URL(f.url).origin })).status, 201);
  assert.equal((await f.post(entry, { Origin: 'https://example.com' })).status, 403);
  assert.equal(await requestStatus(f.url, { Host: 'example.com' }), 403);
  assert.equal(await requestStatus(f.url, { 'Sec-Fetch-Site': 'cross-site' }), 403);
  assert.equal((await f.post(entry, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetch(f.url, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${f.url}unknown`)).status, 404);
});

test('reports corrupt datasets without overwriting them', async (t) => {
  const f = await fixture(t, '{bad json');
  assert.equal((await fetch(f.url)).status, 500);
  assert.equal((await f.post(entry)).status, 500);
  assert.equal(await readFile(f.dataPath, 'utf8'), '{bad json');
  await writeFile(f.dataPath, '[]');
  assert.equal((await f.post(entry)).status, 201);
});

test('the real dataset can be loaded by the local editor', async (t) => {
  const contents = await readFile(path.join(__dirname, '../src/data/restaurants.json'), 'utf8');
  const f = await fixture(t, contents);
  assert.equal((await fetch(f.url)).status, 200);
});

test('lookup endpoint uses existing cuisines without writing data and enforces local request checks', async (t) => {
  const f = await fixture(t, JSON.stringify([entry]), async (input, cuisines) => {
    assert.equal(input.url, 'https://example.com');
    assert.deepEqual(cuisines, ['Test cuisine']);
    return { url: input.url, blurb: 'Suggested description', cuisine: cuisines[0], cuisineMatched: true, sources: [], warnings: [] };
  });
  const before = await readFile(f.dataPath, 'utf8');
  const response = await fetch(`${f.url}lookup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', googleMapsLink: '' }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).blurb, 'Suggested description');
  assert.equal(await readFile(f.dataPath, 'utf8'), before);
  assert.equal((await fetch(`${f.url}lookup`)).status, 405);
  assert.equal(await requestStatus(`${f.url}lookup`, { Origin: 'https://example.com' }), 403);
});
