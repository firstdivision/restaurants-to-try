import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import ResponsiveAppBar from './AppBar';
import restaurants from './data/restaurants.json';
import { Restaurant } from './data/restaurantUtils';

const localEditing = process.env.NODE_ENV === 'development';
const restaurantApi = '/restaurants-to-try/api/restaurants';

function editorErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return 'We could not reach the local editor. Make sure npm start is running, then try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

async function readApiResponse(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Local save API is unavailable. Restart npm start to enable it.');
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object') {
    throw new Error('Local API returned an invalid response.');
  }
  if (!response.ok) {
    throw new Error('error' in result && typeof result.error === 'string'
      ? result.error : `Restaurant request failed (${response.status}).`);
  }
  return result;
}

function isRestaurant(value: unknown): value is Restaurant {
  return !!value && typeof value === 'object'
    && 'name' in value && typeof value.name === 'string'
    && 'url' in value && typeof value.url === 'string'
    && 'blurb' in value && typeof value.blurb === 'string'
    && 'googleMapsLink' in value && typeof value.googleMapsLink === 'string'
    && 'cuisine' in value && typeof value.cuisine === 'string'
    && 'lat' in value && typeof value.lat === 'number'
    && 'lon' in value && typeof value.lon === 'number';
}

type RestaurantDraft = {
  name: string;
  url: string;
  blurb: string;
  lat: string;
  lon: string;
  googleMapsLink: string;
  cuisine: string;
};

type ParsedGoogleMapsLocation = {
  name: string;
  lat: string;
  lon: string;
};

type LookupDetails = {
  url: string;
  blurb: string;
  cuisine: string;
  cuisineMatched: boolean;
  sources: string[];
  warnings: string[];
};

function isLookupDetails(value: object): value is LookupDetails {
  return 'url' in value && typeof value.url === 'string'
    && 'blurb' in value && typeof value.blurb === 'string'
    && 'cuisine' in value && typeof value.cuisine === 'string'
    && 'cuisineMatched' in value && typeof value.cuisineMatched === 'boolean'
    && 'sources' in value && Array.isArray(value.sources) && value.sources.every((source) => typeof source === 'string')
    && 'warnings' in value && Array.isArray(value.warnings) && value.warnings.every((warning) => typeof warning === 'string');
}

const initialDraft: RestaurantDraft = {
  name: '',
  url: '',
  blurb: '',
  lat: '',
  lon: '',
  googleMapsLink: '',
  cuisine: '',
};

function extractCoordinates(url: string) {
  const preciseMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

  if (preciseMatch) {
    return {
      lat: preciseMatch[1],
      lon: preciseMatch[2],
    };
  }

  const viewportMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|$)/);

  if (viewportMatch) {
    return {
      lat: viewportMatch[1],
      lon: viewportMatch[2],
    };
  }

  const queryMatch = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);

  if (queryMatch) {
    return {
      lat: queryMatch[1],
      lon: queryMatch[2],
    };
  }

  return null;
}

function parseGoogleMapsLink(url: string): ParsedGoogleMapsLocation | null {
  try {
    const parsedUrl = new URL(url);
    const coordinates = extractCoordinates(url);

    if (!coordinates) {
      return null;
    }

    const placeMatch = parsedUrl.pathname.match(/\/place\/([^/]+)/);
    const rawName = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim() : '';

    return {
      name: rawName,
      lat: coordinates.lat,
      lon: coordinates.lon,
    };
  } catch {
    return null;
  }
}

export default function JsonBuilder() {
  const [draft, setDraft] = React.useState<RestaurantDraft>(initialDraft);
  const [copied, setCopied] = React.useState(false);
  const [googleMapsParseError, setGoogleMapsParseError] = React.useState('');
  const [localRestaurants, setLocalRestaurants] = React.useState<Restaurant[]>(restaurants);
  const [apiReady, setApiReady] = React.useState(false);
  const [pendingEntry, setPendingEntry] = React.useState<Restaurant | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const [saveSuccess, setSaveSuccess] = React.useState('');
  const [lookupDetails, setLookupDetails] = React.useState<LookupDetails | null>(null);
  const [lookupError, setLookupError] = React.useState('');
  const [lookingUp, setLookingUp] = React.useState(false);
  const lookupController = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => lookupController.current?.abort(), []);

  const clearLookup = () => {
    lookupController.current?.abort();
    lookupController.current = null;
    setLookingUp(false);
    setLookupDetails(null);
    setLookupError('');
  };

  const lookUpDetails = async () => {
    clearLookup();
    const controller = new AbortController();
    lookupController.current = controller;
    setLookingUp(true);
    try {
      const location = parseGoogleMapsLink(draft.googleMapsLink.trim());
      const lat = draft.lat.trim() ? Number(draft.lat) : location ? Number(location.lat) : null;
      const lon = draft.lon.trim() ? Number(draft.lon) : location ? Number(location.lon) : null;
      const result = await readApiResponse(await fetch(`${restaurantApi}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: draft.url, googleMapsLink: draft.googleMapsLink,
          name: draft.name.trim() || location?.name || '', lat, lon,
        }),
        signal: controller.signal,
      }));
      if (!isLookupDetails(result)) throw new Error('The lookup returned information we could not read. Please try again.');
      if (!controller.signal.aborted) setLookupDetails(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLookupError(editorErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) setLookingUp(false);
    }
  };

  React.useEffect(() => {
    if (!localEditing) return;
    const controller = new AbortController();
    fetch(restaurantApi, { signal: controller.signal })
      .then(readApiResponse)
      .then((result) => {
        if (!('restaurants' in result) || !Array.isArray(result.restaurants) || !result.restaurants.every(isRestaurant)) {
          throw new Error('Local API returned an invalid restaurant dataset.');
        }
        setLocalRestaurants(result.restaurants);
        setApiReady(true);
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setSaveError(editorErrorMessage(error));
      });
    return () => controller.abort();
  }, []);

  const cuisineOptions = React.useMemo(() => {
    const uniqueCuisines = new Set(
      localRestaurants
        .map((restaurant) => restaurant.cuisine.trim())
        .filter((cuisine) => cuisine !== ''),
    );

    return Array.from(uniqueCuisines).sort((a, b) => a.localeCompare(b));
  }, [localRestaurants]);

  const existingCuisine = cuisineOptions.find((cuisine) => cuisine.toLowerCase() === draft.cuisine.trim().toLowerCase());
  const isNewCuisine = draft.cuisine.trim() !== '' && !existingCuisine;

  const updateField = (field: keyof RestaurantDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setCopied(false);
    setSaveSuccess('');
    if (['url', 'googleMapsLink', 'name', 'lat', 'lon'].includes(field)) clearLookup();
    if (field === 'googleMapsLink') {
      setGoogleMapsParseError('');
    }
  };

  const hasLatitude = draft.lat.trim() !== '';
  const hasLongitude = draft.lon.trim() !== '';
  const latValue = hasLatitude ? Number(draft.lat) : Number.NaN;
  const lonValue = hasLongitude ? Number(draft.lon) : Number.NaN;
  const hasValidCoordinates = hasLatitude && hasLongitude && Number.isFinite(latValue) && Number.isFinite(lonValue)
    && Math.abs(latValue) <= 90 && Math.abs(lonValue) <= 180;
  const hasRequiredText = draft.name.trim() !== '' && draft.blurb.trim() !== '' && draft.cuisine.trim() !== '';

  const generatedObject = hasValidCoordinates
    ? {
        name: draft.name.trim(),
        url: draft.url.trim(),
        blurb: draft.blurb.trim(),
        lat: latValue,
        lon: lonValue,
        googleMapsLink: draft.googleMapsLink.trim(),
        cuisine: existingCuisine || draft.cuisine.trim(),
      }
    : null;

  const generatedJson = generatedObject ? JSON.stringify(generatedObject, null, 4) : '';

  const parsePastedGoogleMapsLink = () => {
    const parsedLocation = parseGoogleMapsLink(draft.googleMapsLink.trim());

    if (!parsedLocation) {
      setGoogleMapsParseError('Could not extract a place name and coordinates from that Google Maps URL.');
      return;
    }

    setDraft((current) => ({
      ...current,
      name: parsedLocation.name || current.name,
      lat: parsedLocation.lat,
      lon: parsedLocation.lon,
      googleMapsLink: current.googleMapsLink.trim(),
    }));
    setCopied(false);
    setGoogleMapsParseError('');
  };

  const copyToClipboard = async () => {
    if (!generatedJson) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
    } catch {
      setSaveError('Could not copy JSON. Select and copy the preview manually.');
    }
  };

  const saveRestaurant = async () => {
    if (!pendingEntry || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const result = await readApiResponse(await fetch(restaurantApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingEntry),
      }));
      if (!('total' in result) || typeof result.total !== 'number' || !Number.isInteger(result.total) || result.total < 1) {
        throw new Error('Local API returned an invalid save confirmation. Check restaurants.json before trying again.');
      }
      setLocalRestaurants((current) => [...current, pendingEntry]);
      setSaveSuccess(`Saved "${pendingEntry.name}" to restaurants.json (${result.total} restaurants).`);
      setPendingEntry(null);
      setDraft(initialDraft);
      setCopied(false);
      clearLookup();
    } catch (error) {
      setSaveError(editorErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    clearLookup();
    setDraft(initialDraft);
    setCopied(false);
    setGoogleMapsParseError('');
    setSaveSuccess('');
  };

  const updateCuisine = (nextCuisine: string) => {
    setDraft((current) => ({ ...current, cuisine: nextCuisine }));
    setCopied(false);
    setSaveSuccess('');
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveAppBar />
      <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, display: 'grid', gap: 2.5, alignContent: 'start' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(255,250,246,0.94), rgba(236,245,248,0.86))',
            border: '1px solid rgba(126, 85, 48, 0.14)',
          }}
        >
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(280px, 0.65fr)' } }}>
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">
                Add new places cleanly
              </Typography>
              <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2.4rem', md: '3.5rem' }, lineHeight: 0.98 }}>
                Restaurant JSON Builder
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                Start from a Google Maps URL, fill the missing details, and review your restaurant entry before saving.
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.68)', border: '1px solid rgba(126, 85, 48, 0.12)' }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                  <TravelExploreRoundedIcon color="primary" />
                  <Typography variant="subtitle1">Source of truth</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Parse a Google Maps place URL first so the location data comes in consistently.
                </Typography>
              </Paper>
              <Paper elevation={0} sx={{ p: 2.25, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.68)', border: '1px solid rgba(126, 85, 48, 0.12)' }}>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                  <ContentCopyRoundedIcon color="primary" />
                  <Typography variant="subtitle1">Output</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {localEditing
                    ? 'Review the generated JSON, then confirm to append the entry to your local restaurants.json.'
                    : 'Copy the generated JSON and paste it into the restaurants array when you are ready.'}
                </Typography>
              </Paper>
            </Stack>
          </Box>
        </Paper>

        <Alert severity="info" sx={{ maxWidth: 1080 }}>
          {localEditing
            ? 'Local editor: nothing is written until you review the entry and click Confirm and save. Existing entries are preserved.'
            : 'File saving is only available with npm start locally. You can still generate and copy JSON here.'}
        </Alert>

        <Stack spacing={2} sx={{ maxWidth: 1080 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 6, backgroundColor: 'rgba(255,250,246,0.72)' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Start With Google Maps</Typography>
              <Typography variant="body2" color="text.secondary">
                Paste a Google Maps place URL, parse it, and use that as the initial source of truth for name and coordinates.
                Then look up website metadata for suggestions, or fill in the remaining details manually.
              </Typography>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr auto auto' }, alignItems: 'start' }}>
                <TextField
                  label="Google Maps Link"
                  value={draft.googleMapsLink}
                  onChange={updateField('googleMapsLink')}
                  fullWidth
                  helperText="Paste a Google Maps place URL here, then parse it to fill the initial data."
                />
                <Button variant="contained" onClick={parsePastedGoogleMapsLink} disabled={!draft.googleMapsLink.trim()} sx={{ minWidth: 180 }}>
                  Parse Maps URL
                </Button>
                {draft.googleMapsLink.trim() ? (
                  <Button
                    variant="outlined"
                    href={draft.googleMapsLink.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ minWidth: 180 }}
                  >
                    Open Link
                  </Button>
                ) : (
                  <Button variant="outlined" disabled sx={{ minWidth: 180 }}>
                    Open Link
                  </Button>
                )}
              </Box>

              {googleMapsParseError && <Alert severity="warning">{googleMapsParseError}</Alert>}
            </Stack>
          </Paper>

          {localEditing && (
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 6, backgroundColor: 'rgba(255,250,246,0.72)' }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1">Look up restaurant details</Typography>
                <Typography variant="body2" color="text.secondary">
                  Uses OpenStreetMap and public website information, with no API key or paid service. If the website field is empty,
                  looks for a nearby restaurant with the same name, then tries Google Maps.
                  Sites that require JavaScript or block scraping may not work.
                  Suggestions never overwrite your edits automatically.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={lookUpDetails}
                  disabled={!apiReady || lookingUp || saving || (!draft.url.trim() && !draft.googleMapsLink.trim())}
                  sx={{ alignSelf: 'start' }}
                >
                  {lookingUp ? 'Looking up...' : 'Look up details'}
                </Button>
                {lookupError && <Alert severity="error">{lookupError}</Alert>}
                {lookupDetails && (
                  <Stack spacing={2}>
                    <Typography variant="body2">Suggestions only: verify the source and apply the fields you want.</Typography>
                    {(['url', 'blurb', 'cuisine'] as const).map((field) => lookupDetails[field] && (
                      <Stack key={field} spacing={1}>
                        <Typography variant="subtitle2">
                          {field === 'url' ? 'Suggested website' : field === 'blurb' ? 'Suggested blurb' : 'Suggested cuisine'}
                        </Typography>
                        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{lookupDetails[field]}</Typography>
                        <Button
                          variant="outlined"
                          sx={{ alignSelf: 'start' }}
                          onClick={() => {
                            setDraft((current) => ({ ...current, [field]: lookupDetails[field] }));
                            setCopied(false);
                            setSaveSuccess('');
                          }}
                        >
                          Use {field === 'url' ? 'website' : field}
                        </Button>
                      </Stack>
                    ))}
                    {lookupDetails.sources.map((source) => (
                      <Typography key={source} variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                        Source: <a href={source} target="_blank" rel="noopener noreferrer">{source}</a>
                      </Typography>
                    ))}
                    {lookupDetails.sources.some((source) => source.startsWith('https://www.openstreetmap.org/')) && (
                      <Typography variant="caption">
                        Map data: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors (ODbL)</a>.
                      </Typography>
                    )}
                    {lookupDetails.warnings.map((warning, index) => <Alert key={index} severity="warning">{warning}</Alert>)}
                  </Stack>
                )}
              </Stack>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 6, backgroundColor: 'rgba(255,250,246,0.72)' }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Fill in the details</Typography>
              <TextField label="Name" value={draft.name} onChange={updateField('name')} fullWidth required />
              <TextField label="Website URL" value={draft.url} onChange={updateField('url')} fullWidth />
              <TextField
                label="Blurb"
                value={draft.blurb}
                onChange={updateField('blurb')}
                fullWidth
                required
                multiline
                minRows={3}
              />

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField label="Latitude" value={draft.lat} onChange={updateField('lat')} fullWidth required />
                <TextField label="Longitude" value={draft.lon} onChange={updateField('lon')} fullWidth required />
              </Box>

              <Autocomplete
                freeSolo
                options={cuisineOptions}
                value={draft.cuisine}
                onChange={(_, value) => updateCuisine(typeof value === 'string' ? value : '')}
                onInputChange={(_, inputValue, reason) => {
                  if (reason === 'input' || reason === 'clear') updateCuisine(inputValue);
                }}
                renderInput={(params) => <TextField {...params} label="Cuisine" fullWidth required helperText="Choose an existing cuisine or type a new one." />}
              />
              {isNewCuisine && (
                <Alert severity="warning">"{draft.cuisine.trim()}" is not an existing cuisine. Saving this entry will create a new cuisine.</Alert>
              )}
            </Stack>
          </Paper>

          {!hasValidCoordinates && (draft.lat !== '' || draft.lon !== '') && (
            <Alert severity="warning">Latitude must be between -90 and 90; longitude must be between -180 and 180.</Alert>
          )}

          {generatedJson && (
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 6, backgroundColor: 'rgba(255,250,246,0.72)' }}>
              <TextField
                label="Generated JSON Object"
                value={generatedJson}
                multiline
                minRows={12}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            </Paper>
          )}

          <Stack direction="row" spacing={2}>
            {localEditing && (
              <Button
                variant="contained"
                disabled={!apiReady || !generatedObject || !hasRequiredText || saving}
                onClick={() => {
                  setSaveError('');
                  setSaveSuccess('');
                  setPendingEntry(generatedObject);
                }}
              >
                Review and save
              </Button>
            )}
            <Button variant="contained" onClick={copyToClipboard} disabled={!generatedJson || !hasRequiredText}>
              Copy JSON
            </Button>
            <Button variant="outlined" onClick={resetForm}>
              Clear
            </Button>
          </Stack>

          {copied && <Alert severity="success">Copied. Paste into restaurants.json and add a comma if needed.</Alert>}
          {saveError && <Alert severity="error">{saveError}</Alert>}
          {saveSuccess && <Alert severity="success">{saveSuccess}</Alert>}
        </Stack>
      </Box>
      <Dialog open={pendingEntry !== null} onClose={() => { if (!saving) setPendingEntry(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Review restaurant entry</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>This exact entry will be appended to your local restaurants.json. Nothing has been saved yet.</Typography>
            {pendingEntry && !cuisineOptions.includes(pendingEntry.cuisine) && (
              <Alert severity="warning">This entry will create a new cuisine: "{pendingEntry.cuisine}".</Alert>
            )}
            <TextField
              label="Entry to save"
              value={pendingEntry ? JSON.stringify(pendingEntry, null, 4) : ''}
              multiline
              minRows={12}
              fullWidth
              InputProps={{ readOnly: true }}
            />
            {saveError && <Alert severity="error">{saveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setPendingEntry(null)}>Back to editing</Button>
          <Button variant="contained" disabled={saving} onClick={saveRestaurant}>
            {saving ? 'Saving...' : 'Confirm and save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
