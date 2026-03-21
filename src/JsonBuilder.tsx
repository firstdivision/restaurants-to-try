import React from 'react';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import ResponsiveAppBar from './AppBar';

type RestaurantDraft = {
  name: string;
  url: string;
  blurb: string;
  lat: string;
  lon: string;
  googleMapsLink: string;
  cuisine: string;
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

export default function JsonBuilder() {
  const [draft, setDraft] = React.useState<RestaurantDraft>(initialDraft);
  const [copied, setCopied] = React.useState(false);

  const updateField = (field: keyof RestaurantDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setCopied(false);
  };

  const latValue = Number(draft.lat);
  const lonValue = Number(draft.lon);
  const hasValidCoordinates = Number.isFinite(latValue) && Number.isFinite(lonValue);
  const hasRequiredText = draft.name.trim() !== '' && draft.blurb.trim() !== '' && draft.cuisine.trim() !== '';

  const generatedObject = hasValidCoordinates
    ? {
        name: draft.name,
        url: draft.url,
        blurb: draft.blurb,
        lat: latValue,
        lon: lonValue,
        googleMapsLink: draft.googleMapsLink,
        cuisine: draft.cuisine,
      }
    : null;

  const generatedJson = generatedObject ? JSON.stringify(generatedObject, null, 4) : '';

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

        <Stack spacing={2} sx={{ maxWidth: 960 }}>
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

          <TextField
            label="Google Maps Link"
            value={draft.googleMapsLink}
            onChange={updateField('googleMapsLink')}
            fullWidth
          />
          <TextField label="Cuisine" value={draft.cuisine} onChange={updateField('cuisine')} fullWidth required />

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
