# Restaurants to Try

An Austin restaurant shortlist with map, list, and restaurant-entry builder views.

## Run the local editor

```bash
npm install
npm start
```

Open <http://localhost:3000/restaurants-to-try#/builder>.
If the dev server was already running when the local editor was added, restart it.

1. Paste a Google Maps place URL and click **Parse Maps URL**, or enter the coordinates manually.
2. Click **Look up details** to attempt to find the website, blurb, and cuisine from
   public page metadata. Apply individual suggestions with **Use website**,
   **Use blurb**, and **Use cuisine**. Nothing overwrites your edits automatically.
   If no website is found, paste the website URL and retry.
3. Fill in or correct the name, blurb, and cuisine. Website and Google Maps links are optional;
   supplied links must be valid HTTP(S) URLs.
4. Click **Review and save** to inspect the exact JSON entry.
5. Click **Confirm and save** to append it to [src/data/restaurants.json](./src/data/restaurants.json).
   **Back to editing** closes the preview without writing anything.

The editor preserves existing entries, rejects duplicate names (case-insensitive) or
identical Google Maps links, and requires latitude in [-90, 90] and longitude in
[-180, 180]. A successful save clears the form and displays confirmation. The
development server recompiles the dataset so the map and list include the new entry.
Changes are real local file edits and remain after restarting; they are not committed
automatically. Review the file diff in Git as usual.

### Metadata lookup limitations

Lookup uses ordinary public HTML requests, not a paid API or an API key. It reads
restaurant JSON-LD (`description`, `servesCuisine`, `url`) and description/Open Graph
metadata, not full page prose or reviews. Descriptions are limited to 600 characters.
When no website is entered, lookup first searches a small OpenStreetMap map extract
within 500 metres of the parsed coordinates for an exact normalized restaurant name
(ignoring case, punctuation, accents, and `&` versus `and`). A unique match can supply
`website`/`contact:website` and `cuisine` tags. Missing or ambiguous matches produce
warnings instead of guessing. Node and way locations are supported; relations without
a reliable center are not used. Successful map requests are cached for ten minutes
(up to 50 searches). This is a best-effort source, not a complete restaurant directory.

OSM website and cuisine suggestions link to the source object and display
[OpenStreetMap attribution and ODbL licensing](https://www.openstreetmap.org/copyright).
Review licensing before redistributing an OSM-derived dataset.

If OSM cannot supply a website, lookup tries exposed Google Maps website links or
restaurant structured data. Generic Google Maps descriptions are never used as blurbs.
Google Maps often requires JavaScript, consent, or blocks requests, so automatic
website discovery is best-effort. Website URLs can always be entered manually.
No CAPTCHA, login, or access restriction is bypassed.

If lookup reports that DNS returned a reserved address for Google Maps, the local
network resolver is mapping Google to a non-public address. The scraper deliberately
does not connect to that address. This is a network lookup failure, not evidence that
the restaurant has no description or cuisine. Paste the restaurant website into
**Website URL** and click **Look up details** again; that skips Google Maps.
For Baldinucci, use <https://www.baldinucci.pizza/> and select `Italian` if you prefer
it over the inferred `Pizza` suggestion.

Cuisine suggestions are matched case-insensitively to existing labels, including common
aliases such as American -> Americana. If structured cuisine is unavailable, page
metadata can provide a tentative suggestion with a warning. Multiple/ambiguous cuisines
require manual selection. Unmatched cuisines are allowed, but warnings appear both in
the form and save confirmation before creating a new label. Manual capitalization
such as `ITalian` reuses the existing `Italian` label. Suggestions can be incorrect:
for example, a pizza restaurant may suggest `Pizza` when you prefer `Italian`.

Requests have time, page-size (2 MB for websites, 8 MB for OSM extracts), and redirect limits. Only public HTTP(S) destinations
on standard ports are allowed; local/private/reserved addresses are blocked, including
redirects to those addresses. Lookup does not write the dataset.
Requires Node.js 20 or newer for the local server.
Lookup warnings explain missing data, unavailable services, and VPN/network issues
without showing raw network errors. Technical failure details are logged in the local
server terminal. A change of website domain on redirect is flagged for review.

The file API is mounted only by the development server and accepts only same-origin
localhost requests. The development server binds to localhost. No separate backend,
credentials, deployment, or manual JSON pasting is needed. Production builds retain
the copy-only builder and contain no file-writing endpoint.

## Validation

```bash
npm run test:local-api
npm run build
```
