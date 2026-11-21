const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMap, lookupOsm } = require('./osmLookup');
const { lookupRestaurant, friendlyLookupError } = require('./restaurantLookup');

const xml = `<osm><node id="1" lat="30.304" lon="-97.729">
<tag k="name" v="Hyde Park Bar &amp; Grill"/><tag k="amenity" v="restaurant"/>
<tag k="cuisine" v="american"/><tag k="contact:website" v="hpbng.com"/></node></osm>`;

test('matches nearby restaurant names, normalizes ampersands, and reads website and cuisine', () => {
  const result = parseMap(xml, 'Hyde Park Bar and Grill', 30.304, -97.729);
  assert.equal(result.match.website, 'hpbng.com');
  assert.deepEqual(result.match.cuisines, ['american']);
  assert.equal(result.match.source, 'https://www.openstreetmap.org/node/1');
  assert.equal(parseMap(xml, 'Different place', 30.304, -97.729).match, null);
  assert.equal(parseMap(xml, 'Hyde Park Bar and Grill', 31, -97).match, null);
});

test('does not choose ambiguous matches and reads way centers', () => {
  const duplicate = xml.replace('</osm>', xml.slice(5).replace('id="1"', 'id="2"'));
  assert.equal(parseMap(duplicate, 'Hyde Park Bar and Grill', 30.304, -97.729).match, null);
  const way = `<osm><node id="1" lat="30.304" lon="-97.729"/><way id="2"><nd ref="1"/>
  <tag k="name" v="Test"/><tag k="amenity" v="restaurant"/><tag k="cuisine" v="italian;pizza"/></way></osm>`;
  assert.deepEqual(parseMap(way, 'Test', 30.304, -97.729).match.cuisines, ['italian', 'pizza']);
  assert.throws(() => parseMap('<html>Error</html>', 'Test', 30, -97), /unreadable/);
});

test('uses a bounded map request and caches repeat lookups', async () => {
  let requests = 0;
  const fetchMap = async (url) => {
    requests += 1;
    assert.equal(new URL(url).hostname, 'api.openstreetmap.org');
    const bbox = new URL(url).searchParams.get('bbox').split(',').map(Number);
    assert.ok(bbox[2] - bbox[0] < 0.02);
    return { html: xml };
  };
  await lookupOsm('Hyde Park Bar and Grill', 30.304, -97.729, fetchMap);
  await lookupOsm('Hyde Park Bar and Grill', 30.304, -97.729, fetchMap);
  assert.equal(requests, 1);
});

test('uses OSM website and cuisine before Maps and fetches the website description', async () => {
  const result = await lookupRestaurant({
    url: '', googleMapsLink: 'https://www.google.com/maps/place/Test',
    name: 'Test', lat: 30, lon: -97,
  }, ['Americana'], async (url) => {
    assert.equal(url, 'https://hpbng.com/');
    return { url, html: '<meta name="description" content="Restaurant description">' };
  }, async () => ({ match: { website: 'hpbng.com', cuisines: ['american'], source: 'https://www.openstreetmap.org/node/1' }, warnings: [] }));
  assert.equal(result.cuisine, 'Americana');
  assert.equal(result.blurb, 'Restaurant description');
  assert.equal(result.sources.length, 2);
});

test('OSM failures remain friendly and Maps boilerplate is never suggested as a blurb', async () => {
  const result = await lookupRestaurant({
    url: '', googleMapsLink: 'https://www.google.com/maps/place/Test',
    name: 'Test', lat: 30, lon: -97,
  }, ['Italian'], async (url) => ({
    url, html: '<meta name="description" content="Find local businesses, view maps and get driving directions in Google Maps.">',
  }), async () => { throw new Error('Website lookup timed out.'); });
  assert.equal(result.blurb, '');
  assert.ok(result.warnings.some((warning) => warning.includes('took too long')));
  assert.equal(friendlyLookupError(new Error('DNS returned reserved network addresses')), 'Your network or VPN is sending this website to a restricted address, so we cannot safely open it. Check your VPN or network settings.');
  assert.match(friendlyLookupError(new Error('The website returned HTTP 403.')), /not allowing automated/);
});

test('keeps OSM cuisine when the restaurant website is blocked', async () => {
  const result = await lookupRestaurant({
    url: '', googleMapsLink: 'https://www.google.com/maps/place/Test', name: 'Test', lat: 30, lon: -97,
  }, ['Italian'], async () => { throw new Error('The website returned HTTP 403.'); },
  async () => ({ match: { website: 'https://example.com', cuisines: ['italian'], source: 'https://www.openstreetmap.org/node/2' }, warnings: [] }));
  assert.equal(result.cuisine, 'Italian');
  assert.equal(result.blurb, '');
  assert.ok(result.warnings.some((warning) => warning.includes('not allowing automated')));
});
