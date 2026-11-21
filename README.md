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
2. Fill in the name, blurb, and cuisine. Website and Google Maps links are optional;
   supplied links must be valid HTTP(S) URLs.
3. Click **Review and save** to inspect the exact JSON entry.
4. Click **Confirm and save** to append it to [src/data/restaurants.json](./src/data/restaurants.json).
   **Back to editing** closes the preview without writing anything.

The editor preserves existing entries, rejects duplicate names (case-insensitive) or
identical Google Maps links, and requires latitude in [-90, 90] and longitude in
[-180, 180]. A successful save clears the form and displays confirmation. The
development server recompiles the dataset so the map and list include the new entry.
Changes are real local file edits and remain after restarting; they are not committed
automatically. Review the file diff in Git as usual.

The file API is mounted only by the development server and accepts only same-origin
localhost requests. The development server binds to localhost. No separate backend,
credentials, deployment, or manual JSON pasting is needed. Production builds retain
the copy-only builder and contain no file-writing endpoint.

## Validation

```bash
npm run test:local-api
npm run build
```
