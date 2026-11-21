const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const {
  lookupRestaurant, extractMetadata, matchCuisine, fetchPublicHtml, resolvePublicAddress, isPublicAddress,
} = require('./restaurantLookup');

const cuisines = ['Italian', 'Pizza', 'Americana', 'Carribean', 'French'];
const html = `<html><head>
  <meta content="Fallback &amp; description" name="description">
  <script type="application/ld+json">{"@graph":[{"@type":"Restaurant",
  "description":" A lovely Italian restaurant. ",
  "servesCuisine":"Italian cuisine","url":"https://restaurant.example/"}]}</script>
</head></html>`;

test('extracts restaurant structured metadata, entities, and description fallbacks', () => {
  const metadata = extractMetadata(html);
  assert.equal(metadata.blurb, 'A lovely Italian restaurant.');
  assert.deepEqual(metadata.cuisines, ['Italian cuisine']);
  assert.equal(metadata.website, 'https://restaurant.example/');
  assert.equal(extractMetadata('<meta property="og:description" content="Pizza &amp; pasta">').blurb, 'Pizza & pasta');
  assert.equal(extractMetadata(`<meta name="description" content="${'x'.repeat(700)}">`).blurb.length, 600);
  assert.equal(extractMetadata('<script type="application/ld+json">{bad}</script>').warnings.length, 1);
  assert.equal(extractMetadata('<p>Full page text is not copied as a blurb.</p>').blurb, '');
});

test('matches canonical cuisines, aliases, new labels, and ambiguous evidence conservatively', () => {
  assert.equal(matchCuisine(['ITalian Cuisine'], cuisines).cuisine, 'Italian');
  assert.equal(matchCuisine(['New American'], cuisines).cuisine, 'Americana');
  assert.equal(matchCuisine(['Caribbean'], cuisines).cuisine, 'Carribean');
  const unknown = matchCuisine(['Ethiopian'], cuisines);
  assert.equal(unknown.cuisine, 'Ethiopian');
  assert.equal(unknown.matched, false);
  assert.ok(unknown.warnings[0].includes('new one'));
  assert.equal(matchCuisine(['Italian', 'Pizza'], cuisines).cuisine, '');
  assert.equal(matchCuisine(['Italian', 'Ethiopian'], cuisines).cuisine, '');
  assert.equal(matchCuisine([], cuisines, 'Our Italian restaurant').cuisine, 'Italian');
  assert.equal(matchCuisine([], cuisines, 'Pizza and Italian food').cuisine, '');
  assert.equal(matchCuisine([], cuisines, 'Italianate design').cuisine, '');
});

test('finds a labeled Google Maps website link then reads site metadata without APIs or file writes', async () => {
  const pages = [];
  const result = await lookupRestaurant({ url: '', googleMapsLink: 'https://www.google.com/maps/place/Test' }, cuisines, async (url) => {
    pages.push(url);
    return {
      url,
      html: pages.length === 1
        ? '<a aria-label="Website" href="https://www.google.com/url?q=https%3A%2F%2Frestaurant.example%2F">Visit</a>'
        : html,
    };
  });
  assert.deepEqual(pages, ['https://www.google.com/maps/place/Test', 'https://restaurant.example/']);
  assert.equal(result.url, 'https://restaurant.example/');
  assert.equal(result.blurb, 'A lovely Italian restaurant.');
  assert.equal(result.cuisine, 'Italian');
  assert.equal(result.cuisineMatched, true);
  assert.deepEqual(result.warnings, []);
});

test('prefers an entered website; returns explicit partial-result warnings for blocked or empty pages', async () => {
  const entered = await lookupRestaurant({ url: 'https://restaurant.example', googleMapsLink: 'https://www.google.com/maps/place/Test' }, cuisines, async (url) => {
    assert.equal(url, 'https://restaurant.example/');
    return { url, html };
  });
  assert.equal(entered.cuisine, 'Italian');
  const blocked = await lookupRestaurant({ url: 'https://restaurant.example', googleMapsLink: '' }, cuisines, async () => {
    throw new Error('The website returned HTTP 403.');
  });
  assert.ok(blocked.warnings.some((warning) => warning.includes('not allowing automated')));
  assert.equal(blocked.blurb, '');
  assert.equal(blocked.warnings.length, 1);
  const empty = await lookupRestaurant({ url: '', googleMapsLink: 'https://www.google.com/maps/place/Test' }, cuisines,
    async (url) => ({ url, html: '<html>JavaScript required</html>' }));
  assert.ok(empty.warnings.some((warning) => warning.includes('Paste the restaurant website')));
  const newCuisine = await lookupRestaurant({ url: 'https://restaurant.example', googleMapsLink: '' }, cuisines,
    async (url) => ({ url, html: html.replace('Italian cuisine', 'Ethiopian') }));
  assert.equal(newCuisine.cuisine, 'Ethiopian');
  assert.equal(newCuisine.cuisineMatched, false);
});

test('reports blocked Google Maps DNS with actionable guidance, not misleading metadata warnings', async () => {
  let requests = 0;
  const result = await lookupRestaurant({
    url: '',
    googleMapsLink: 'https://www.google.com/maps/place/Baldinucci+Pizza+Romana/@30.4010115,-97.7226029,17z',
  }, cuisines, (url) => fetchPublicHtml(url, {
    resolve: async () => [{ address: '192.0.0.88', family: 4 }],
    request: () => { requests += 1; throw new Error('Must not fetch a reserved address'); },
  }));
  assert.equal(requests, 0);
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0], /network or VPN/);
  assert.match(result.warnings[0], /Paste the restaurant website into Website URL/);
  assert.equal(result.blurb, '');
  assert.equal(result.cuisine, '');
});

test('rejects malformed lookup inputs and unsupported URLs', async () => {
  for (const input of [null, [], {}, { url: '', googleMapsLink: '' }, { url: 'file:///etc/passwd', googleMapsLink: '' }]) {
    await assert.rejects(lookupRestaurant(input, cuisines), { status: 400 });
  }
  const result = await lookupRestaurant({ url: '', googleMapsLink: 'https://example.com/not-maps' }, cuisines, () => {
    throw new Error('Must not fetch this URL');
  });
  assert.ok(result.warnings.some((warning) => warning.includes('supported Google Maps link')));
});

test('blocks private, loopback, mapped IPv4, reserved addresses, and mixed DNS answers', async () => {
  for (const address of [
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '192.0.0.88', '0.0.0.0', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1',
  ]) {
    assert.equal(isPublicAddress(address), false, address);
    await assert.rejects(resolvePublicAddress(address), /local, private, or reserved/);
  }
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2001:4860:4860::8888'), true);
  await assert.rejects(resolvePublicAddress('example.com', async () => [
    { address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 },
  ]), /local, private, or reserved/);
});

function transport(pages, calls) {
  return (url, options, callback) => {
    calls.push({ url: url.href, options });
    const req = new EventEmitter();
    req.end = () => {
      const page = pages.shift();
      const response = Readable.from([Buffer.from(page.html || '')]);
      response.statusCode = page.status || 200;
      response.headers = { 'content-type': 'text/html', ...page.headers };
      callback(response);
    };
    return req;
  };
}

const publicDns = async () => [{ address: '8.8.8.8', family: 4 }];

test('pins validated DNS, follows public redirects, and blocks private redirect destinations', async () => {
  const calls = [];
  const page = await fetchPublicHtml('https://example.com', {
    resolve: publicDns,
    request: transport([{ status: 302, headers: { location: 'https://other.example/' } }, { html }], calls),
  });
  assert.equal(page.url, 'https://other.example/');
  assert.equal(page.html, html);
  calls[0].options.lookup('example.com', {}, (error, address, family) => {
    assert.equal(error, null);
    assert.equal(address, '8.8.8.8');
    assert.equal(family, 4);
  });
  const blockedCalls = [];
  await assert.rejects(fetchPublicHtml('https://example.com', {
    resolve: publicDns,
    request: transport([{ status: 302, headers: { location: 'http://127.0.0.1/' } }], blockedCalls),
  }), /local, private, or reserved/);
  assert.equal(blockedCalls.length, 1);
});

test('rejects HTTP errors, non-HTML responses, oversized pages, and excessive redirects', async () => {
  for (const [pages, pattern] of [
    [[{ status: 403 }], /HTTP 403/],
    [[{ headers: { 'content-type': 'application/json' } }], /HTML page/],
    [[{ html: 'x'.repeat(2 * 1024 * 1024 + 1) }], /2 MB/],
    [Array.from({ length: 5 }, () => ({ status: 302, headers: { location: 'https://example.com/next' } })), /too many times/],
  ]) {
    await assert.rejects(fetchPublicHtml('https://example.com', {
      resolve: publicDns, request: transport(pages, []),
    }), pattern);
  }
  for (const url of ['http://localhost/', 'https://user:secret@example.com/', 'http://example.com:3000/', 'file:///tmp/test']) {
    await assert.rejects(fetchPublicHtml(url));
  }
});

test('bounds a stalled DNS lookup with a timeout', async () => {
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(fetchPublicHtml('https://example.com', {
      resolve: () => new Promise(() => {}),
      timeoutMs: 20,
    }), /timed out/);
  } finally {
    clearTimeout(keepAlive);
  }
});
