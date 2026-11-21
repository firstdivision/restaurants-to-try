const cheerio = require('cheerio');

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function normalizedName(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseMap(xml, name, lat, lon) {
  const $ = cheerio.load(xml, { xmlMode: true });
  if (!$('osm').length) throw new Error('OpenStreetMap returned an unreadable map.');
  const nodes = new Map();
  $('node').each((_, element) => {
    nodes.set($(element).attr('id'), {
      lat: Number($(element).attr('lat')), lon: Number($(element).attr('lon')),
    });
  });
  const matches = [];
  $('node, way, relation').each((_, element) => {
    const tags = {};
    $(element).children('tag').each((_, tag) => {
      tags[$(tag).attr('k')] = $(tag).attr('v');
    });
    if (!['restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'food_court'].includes(tags.amenity) ||
        ![tags.name, tags['name:en'], tags.official_name, tags.alt_name]
          .filter(Boolean).some((value) => value.split(';').some((alias) => normalizedName(alias) === normalizedName(name)))) return;
    let points;
    if (element.tagName === 'node') points = [nodes.get($(element).attr('id'))];
    else if (element.tagName === 'way') {
      points = $(element).children('nd').toArray().map((node) => nodes.get($(node).attr('ref'))).filter(Boolean);
    } else {
      // Relations may extend outside the extract and have no trustworthy center.
      return;
    }
    if (!points.length) return;
    const center = {
      lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
      lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length,
    };
    const distance = Math.hypot((center.lat - lat) * 111320,
      (center.lon - lon) * 111320 * Math.cos(lat * Math.PI / 180));
    if (!Number.isFinite(distance) || distance > 500) return;
    matches.push({
      name: tags.name,
      website: tags.website || tags['contact:website'] || '',
      cuisines: (tags.cuisine || '').split(';').map((value) => value.replace(/_/g, ' ').trim()).filter(Boolean),
      source: `https://www.openstreetmap.org/${element.tagName}/${$(element).attr('id')}`,
    });
  });
  if (matches.length > 1) {
    return { match: null, warnings: ['OpenStreetMap has more than one nearby match for this name. Enter the restaurant website so we do not choose the wrong location.'] };
  }
  if (!matches.length) {
    return { match: null, warnings: ['We could not find this restaurant nearby in OpenStreetMap. It may not have been added yet.'] };
  }
  return { match: matches[0], warnings: [] };
}

async function lookupOsm(name, lat, lon, fetchMap) {
  const key = `${normalizedName(name)}:${lat}:${lon}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.result;
  const latDelta = 500 / 111320;
  const lonDelta = Math.min(0.02, 500 / (111320 * Math.cos(lat * Math.PI / 180)));
  const bbox = [
    Math.max(-180, lon - lonDelta), Math.max(-90, lat - latDelta),
    Math.min(180, lon + lonDelta), Math.min(90, lat + latDelta),
  ].join(',');
  const page = await fetchMap(`https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`);
  const result = parseMap(page.html, name, lat, lon);
  if (cache.size >= 50) cache.delete(cache.keys().next().value);
  cache.set(key, { time: Date.now(), result });
  return result;
}

module.exports = { lookupOsm, parseMap };
