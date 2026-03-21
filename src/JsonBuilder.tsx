import React from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ResponsiveAppBar from './AppBar';
import restaurants from './data/restaurants.json';

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
  const cuisineOptions = React.useMemo(() => {
    const uniqueCuisines = new Set(
      restaurants
        .map((restaurant) => restaurant.cuisine.trim())
        .filter((cuisine) => cuisine !== ''),
    );

    return Array.from(uniqueCuisines).sort((a, b) => a.localeCompare(b));
  }, []);

  const updateField = (field: keyof RestaurantDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setCopied(false);
    if (field === 'googleMapsLink') {
      setGoogleMapsParseError('');
    }
  };

  const hasLatitude = draft.lat.trim() !== '';
  const hasLongitude = draft.lon.trim() !== '';
  const latValue = hasLatitude ? Number(draft.lat) : Number.NaN;
  const lonValue = hasLongitude ? Number(draft.lon) : Number.NaN;
  const hasValidCoordinates = hasLatitude && hasLongitude && Number.isFinite(latValue) && Number.isFinite(lonValue);
  const hasRequiredText = draft.name.trim() !== '' && draft.blurb.trim() !== '' && draft.cuisine.trim() !== '';

  const generatedObject = hasValidCoordinates
    ? {
        name: draft.name,
        url: draft.url,
        blurb: draft.blurb,
        lat: latValue,
        lon: lonValue,
        googleMapsLink: draft.googleMapsLink.trim(),
        cuisine: draft.cuisine,
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

    await navigator.clipboard.writeText(generatedJson);
    setCopied(true);
  };

  const resetForm = () => {
    setDraft(initialDraft);
    setCopied(false);
    setGoogleMapsParseError('');
  };

  const updateCuisine = (nextCuisine: string) => {
    setDraft((current) => ({ ...current, cuisine: nextCuisine }));
    setCopied(false);
  };

  return (
    <Container maxWidth={false}>
      <ResponsiveAppBar />
      <Box sx={{ my: 4, px: 2 }}>
        <Typography variant="h6" component="h1" sx={{ mb: 2 }}>
          New Restaurant JSON Builder
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          Fill out the fields below. Copy the generated JSON object and paste it into restaurants.json inside the array.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, maxWidth: 960 }}>
          This page does not add anything to the data automatically. It only helps you gather information and generate JSON that you can
          paste into restaurants.json.
        </Alert>

        <Stack spacing={2} sx={{ maxWidth: 960 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Start With Google Maps</Typography>
              <Typography variant="body2" color="text.secondary">
                Paste a Google Maps place URL, parse it, and use that as the initial source of truth for name and coordinates.
                After that, fill in the website, blurb, and cuisine manually.
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
            onInputChange={(_, inputValue) => updateCuisine(inputValue)}
            renderInput={(params) => <TextField {...params} label="Cuisine" fullWidth required helperText="Choose an existing cuisine or type a new one." />}
          />

          {!hasValidCoordinates && (draft.lat !== '' || draft.lon !== '') && (
            <Alert severity="warning">Latitude and longitude must be valid numbers.</Alert>
          )}

          {generatedJson && (
            <TextField
              label="Generated JSON Object"
              value={generatedJson}
              multiline
              minRows={12}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          )}

          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={copyToClipboard} disabled={!generatedJson || !hasRequiredText}>
              Copy JSON
            </Button>
            <Button variant="outlined" onClick={resetForm}>
              Clear
            </Button>
          </Stack>

          {copied && <Alert severity="success">Copied. Paste into restaurants.json and add a comma if needed.</Alert>}
        </Stack>
      </Box>
    </Container>
  );
}
