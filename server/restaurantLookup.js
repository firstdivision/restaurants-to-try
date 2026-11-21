const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns/promises');
const net = require('node:net');
const cheerio = require('cheerio');
const ipaddr = require('ipaddr.js');
const { lookupOsm } = require('./osmLookup');

const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const aliases = {
  american: 'americana',
  'new american': 'americana',
  caribbean: 'carribean',
  argentine: 'argentinian',
  hamburger: 'burgers',
  hamburgers: 'burgers',
  burger: 'burgers',
  desserts: 'dessert',
};

function publicUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80', '443'].includes(url.port))) {
    throw new Error('Lookup URLs must be public HTTP(S) pages on standard ports, without credentials.');
  }
  return url;
}

function isPublicAddress(address) {
  if (!ipaddr.isValid(address)) return false;
  const parsed = ipaddr.process(address);
  return parsed.range() === 'unicast';
}

async function resolvePublicAddress(hostname, resolve = dns.lookup) {
  const host = hostname.replace(/^\[|\]$/g, '');
  const records = net.isIP(host)
    ? [{ address: host, family: net.isIP(host) }]
    : await resolve(host, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error(`DNS returned no addresses for ${host}.`);
  }
  const blocked = records.filter((record) => !isPublicAddress(record.address));
  if (blocked.length) {
    throw new Error(`DNS for ${host} returned local, private, or reserved network addresses (${blocked.map((record) => record.address).join(', ')}). Lookup blocked this destination for network safety.`);
  }
  return records[0];
}

async function fetchPublicHtml(value, { resolve = dns.lookup, request, timeoutMs = 12000, xml = false } = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  const maxBytes = xml ? 8 * 1024 * 1024 : MAX_PAGE_BYTES;
  let url = publicUrl(value);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const record = await new Promise((resolveAddress, reject) => {
      const onAbort = () => reject(new Error('Website lookup timed out.'));
      signal.addEventListener('abort', onAbort, { once: true });
      resolvePublicAddress(url.hostname, resolve).then(resolveAddress, reject)
        .finally(() => signal.removeEventListener('abort', onAbort));
      if (signal.aborted) onAbort();
    });
    signal.throwIfAborted();
    // Pin the validated DNS address so a second lookup cannot redirect into the local network.
    const response = await new Promise((resolveResponse, reject) => {
      const transport = request || (url.protocol === 'https:' ? https.request : http.request);
      const req = transport(url, {
        signal,
        headers: {
          'User-Agent': 'RestaurantsToTry-LocalEditor/1.0',
          Accept: xml ? 'application/xml,text/xml' : 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'identity',
        },
        lookup: (_host, options, callback) => {
          if (options.all) callback(null, [record]);
          else callback(null, record.address, record.family);
        },
      }, resolveResponse);
      req.on('error', reject);
      req.end();
    });
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      response.resume();
      if (!response.headers.location) throw new Error('The website returned a redirect without a destination.');
      url = publicUrl(new URL(response.headers.location, url).href);
      continue;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      response.resume();
      throw new Error(`The website returned HTTP ${response.statusCode}.`);
    }
    const contentType = xml ? /^(application\/xml|text\/xml)\b/i : /^(text\/html|application\/xhtml\+xml)\b/i;
    if (!contentType.test(response.headers['content-type'] || '') ||
        !['identity', undefined].includes(response.headers['content-encoding'])) {
      response.resume();
      throw new Error('The website did not return an uncompressed HTML page.');
    }
    let size = 0;
    const chunks = [];
    for await (const chunk of response) {
      size += chunk.length;
      if (size > maxBytes) {
        response.destroy();
        throw new Error(xml ? 'The map exceeds the 8 MB lookup limit.' : 'The website exceeds the 2 MB lookup limit.');
      }
      chunks.push(chunk);
    }
    return { url: url.href, html: Buffer.concat(chunks).toString('utf8') };
  }
  throw new Error('The website redirected too many times.');
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function extractMetadata(html) {
  const $ = cheerio.load(html);
  const warnings = [];
  const businesses = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some((type) => /^(Restaurant|FoodEstablishment|CafeOrCoffeeShop|BarOrPub|Bakery|LocalBusiness)$/.test(type))) {
      businesses.push(value);
    }
    Object.values(value).forEach(visit);
  }
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      visit(JSON.parse($(element).text()));
    } catch {
      warnings.push('Some information on this page could not be read. Please double-check the suggestions.');
    }
  });
  const meta = (name) => cleanText($(`meta[name="${name}"], meta[property="${name}"]`).first().attr('content'));
  const description = businesses.map((business) => cleanText(business.description)).find(Boolean)
    || meta('description') || meta('og:description') || meta('twitter:description');
  const rawCuisines = businesses.flatMap((business) =>
    Array.isArray(business.servesCuisine) ? business.servesCuisine : [business.servesCuisine]);
  const cuisines = [...new Set(rawCuisines.flatMap((value) => cleanText(value).split(/[,;/|]/)).filter(Boolean))];
  return {
    $,
    website: businesses.map((business) => cleanText(business.url)).find(Boolean) || '',
    blurb: description.slice(0, 600),
    cuisines,
    evidence: [description, meta('keywords'), meta('og:title'), $('title').first().text()].join(' '),
    warnings,
  };
}

function normalizeCuisine(value) {
  return value.toLowerCase().replace(/\bcuisine\b|\bfood\b|\brestaurant\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchCuisine(candidates, existing, evidence = '') {
  const labels = new Map(existing.map((label) => [normalizeCuisine(label), label]));
  const canonical = (value) => {
    const key = normalizeCuisine(value);
    return labels.get(key) || labels.get(aliases[key]);
  };
  const matched = [...new Set(candidates.map(canonical).filter(Boolean))];
  const unmatched = candidates.filter((candidate) => !canonical(candidate));
  if (matched.length === 1 && !unmatched.length) return { cuisine: matched[0], matched: true, warnings: [] };
  if (candidates.length === 1 && !matched.length) {
    return { cuisine: cleanText(candidates[0]), matched: false, warnings: ['The suggested cuisine does not match an existing cuisine. Using it will create a new one.'] };
  }
  if (candidates.length) {
    return { cuisine: '', matched: false, warnings: [`We found several cuisines (${candidates.join(', ')}). Please choose the one you want to use.`] };
  }
  const text = ` ${normalizeCuisine(evidence)} `;
  const detected = [...new Set([...labels.keys(), ...Object.keys(aliases)]
    .filter((key) => !['unknown', 'various', 'fine dining'].includes(key) && text.includes(` ${key} `))
    .map(canonical).filter(Boolean))];
  if (detected.length === 1) {
    return { cuisine: detected[0], matched: true, warnings: ['This cuisine is a guess based on the website description. Please check it before using it.'] };
  }
  return { cuisine: '', matched: false, warnings: ['We could not confidently identify a cuisine. Please choose one yourself.'] };
}

function isGoogleMapsUrl(value) {
  const url = publicUrl(value);
  return ((url.hostname === 'google.com' || url.hostname === 'www.google.com' || url.hostname === 'maps.google.com')
    && (url.pathname.startsWith('/maps') || url.hostname === 'maps.google.com'))
    || (url.hostname === 'maps.app.goo.gl') || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/'));
}

function findWebsite(metadata, baseUrl) {
  const candidates = metadata.website ? [metadata.website] : [];
  metadata.$('a[href]').each((_index, element) => {
    const link = metadata.$(element);
    if (/website|web site/i.test(`${link.attr('aria-label') || ''} ${link.text()}`) ||
        link.attr('data-item-id') === 'authority') {
      candidates.push(link.attr('href'));
    }
  });
  for (const candidate of candidates) {
    try {
      let url = new URL(candidate, baseUrl);
      if (['google.com', 'www.google.com'].includes(url.hostname) && url.pathname === '/url') {
        url = new URL(url.searchParams.get('q') || url.searchParams.get('url'));
      }
      publicUrl(url.href);
      if (!/(^|\.)(google\.com|goo\.gl)$/.test(url.hostname)) return url.href;
    } catch {
      // Ignore malformed individual website links; the caller warns if none can be used.
    }
  }
  return '';
}

function friendlyLookupError(error) {
  const message = error.message || '';
  const code = error.code || error.cause?.code;
  if (/private|reserved network|network safety/.test(message)) {
    return 'Your network or VPN is sending this website to a restricted address, so we cannot safely open it. Check your VPN or network settings.';
  }
  if (/timeout|timed out|aborted/i.test(message) || ['ETIMEDOUT', 'ABORT_ERR'].includes(code)) {
    return 'The service took too long to respond. Please try again later.';
  }
  if (/HTTP (403|406|429)/.test(message)) return 'The service is not allowing automated lookups right now. Please try again later or enter the details yourself.';
  if (/HTTP 404/.test(message)) return 'This page could not be found. Check the website address.';
  if (/HTTP 5\d\d/.test(message)) return 'The service is temporarily unavailable. Please try again later.';
  if (/supported Google Maps URL/.test(message)) return 'This does not look like a supported Google Maps link. Use a Google Maps place link or enter the restaurant website.';
  if (/lookup limit/.test(message)) return 'There is too much information on this page to read automatically. Please enter the missing details yourself.';
  if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code)) {
    return 'We could not connect to the service. Check your internet connection or VPN and try again.';
  }
  return 'We could not read this page automatically. You can open the website and enter the details yourself.';
}

async function lookupRestaurant(input, existingCuisines, fetchPage = fetchPublicHtml, findOsm = (name, lat, lon) =>
  lookupOsm(name, lat, lon, (url) => fetchPublicHtml(url, { xml: true }))) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      typeof input.url !== 'string' || typeof input.googleMapsLink !== 'string' ||
      (!input.url.trim() && !input.googleMapsLink.trim())) {
    throw Object.assign(new Error('Provide a website URL or a Google Maps URL for lookup.'), { status: 400 });
  }
  const warnings = [];
  const sources = [];
  let website = input.url.trim();
  if (website) {
    try {
      website = publicUrl(website).href;
    } catch (error) {
      throw Object.assign(new Error('Enter a full website address starting with https:// or http://, without a username, password, or custom port.'), { status: 400 });
    }
  }
  let osmMatch;
  const coordinatesValid = Number.isFinite(input.lat) && Math.abs(input.lat) <= 90
    && Number.isFinite(input.lon) && Math.abs(input.lon) <= 180;
  if (!website && typeof input.name === 'string' && input.name.trim() && coordinatesValid) {
    try {
      const result = await findOsm(input.name.trim(), input.lat, input.lon);
      osmMatch = result.match;
      warnings.push(...result.warnings);
      if (osmMatch) {
        sources.push(osmMatch.source);
        if (osmMatch.website) {
          try {
            const candidate = /^https?:\/\//i.test(osmMatch.website) ? osmMatch.website : `https://${osmMatch.website}`;
            website = publicUrl(candidate).href;
          } catch {
            warnings.push('OpenStreetMap lists a website address we could not use. Please enter the official website yourself.');
          }
        } else warnings.push('OpenStreetMap has this restaurant, but does not list a website.');
      }
    } catch (error) {
      console.error('OpenStreetMap lookup failed:', error);
      warnings.push(`OpenStreetMap: ${friendlyLookupError(error)} We will still try Google Maps.`);
    }
  }
  let mapsMetadata;
  if (!website && input.googleMapsLink.trim()) {
    try {
      if (!isGoogleMapsUrl(input.googleMapsLink.trim())) throw new Error('Use a supported Google Maps URL, or enter the restaurant website directly.');
      const page = await fetchPage(input.googleMapsLink.trim());
      if (!isGoogleMapsUrl(page.url)) throw new Error('Google Maps redirected to a consent or unsupported page.');
      mapsMetadata = extractMetadata(page.html);
      website = findWebsite(mapsMetadata, page.url);
      sources.push(page.url);
      warnings.push(...mapsMetadata.warnings);
      if (!website) warnings.push('We could not find a website link on Google Maps. Paste the restaurant website into Website URL and try again.');
    } catch (error) {
      console.error('Google Maps lookup failed:', error);
      warnings.push(`Google Maps: ${friendlyLookupError(error)} Paste the restaurant website into Website URL and click Look up details again.`);
    }
  }
  // Google Maps' description is usually about Maps itself, not the restaurant.
  let metadata;
  if (website) {
    try {
      const page = await fetchPage(website);
      metadata = extractMetadata(page.html);
      if (new URL(page.url).hostname !== new URL(website).hostname) {
        warnings.push('The website redirected to a different domain. Please check that it still belongs to this restaurant.');
      }
      website = page.url;
      sources.push(page.url);
      warnings.push(...metadata.warnings);
    } catch (error) {
      console.error('Website lookup failed:', error);
      warnings.push(`Restaurant website: ${friendlyLookupError(error)}`);
    }
  }
  if (!metadata && !osmMatch?.cuisines.length) {
    return { url: website, blurb: '', cuisine: '', cuisineMatched: false, sources, warnings };
  }
  const blurb = metadata?.blurb || '';
  const cuisine = matchCuisine(osmMatch?.cuisines.length ? osmMatch.cuisines : metadata?.cuisines || [], existingCuisines, metadata?.evidence || '');
  if (metadata && !blurb) warnings.push('The website does not include a short description we can use. Please write your own blurb.');
  if (osmMatch?.cuisines.length) warnings.push('The cuisine comes from OpenStreetMap. Please check that it is still accurate.');
  warnings.push(...cuisine.warnings);
  return { url: website, blurb, cuisine: cuisine.cuisine, cuisineMatched: cuisine.matched, sources, warnings };
}

module.exports = {
  lookupRestaurant, extractMetadata, matchCuisine, fetchPublicHtml, resolvePublicAddress, isPublicAddress, friendlyLookupError,
};
