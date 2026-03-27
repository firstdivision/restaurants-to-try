import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RoomServiceRoundedIcon from '@mui/icons-material/RoomServiceRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import { ALL_CUISINES, CuisineCount } from './data/restaurantUtils';

type DiscoveryControlsProps = {
  selectedCuisine: string;
  nameQuery: string;
  cuisineCounts: CuisineCount[];
  resultCount: number;
  totalCount: number;
  onCuisineChange: (event: SelectChangeEvent<string>) => void;
  onNameQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  headline: string;
  supportingText: string;
};

export default function DiscoveryControls({
  selectedCuisine,
  nameQuery,
  cuisineCounts,
  resultCount,
  totalCount,
  onCuisineChange,
  onNameQueryChange,
  headline,
  supportingText,
}: DiscoveryControlsProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, md: 3 },
        borderRadius: 6,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.94), rgba(249,243,236,0.9))',
        border: '1px solid rgba(160, 125, 88, 0.16)',
        boxShadow: '0 24px 50px rgba(70, 45, 24, 0.10)',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TuneRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography variant="overline" sx={{ letterSpacing: '0.18em', color: 'text.secondary' }}>
              Restaurant Discovery
            </Typography>
          </Stack>

          <Typography variant="h4" component="h2" sx={{ maxWidth: 560 }}>
            {headline}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
            {supportingText}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<RoomServiceRoundedIcon />}
              label={`${resultCount} showing`}
              variant="outlined"
            />
            <Chip
              label={selectedCuisine === ALL_CUISINES ? `${cuisineCounts.length} cuisines` : selectedCuisine}
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="select-cuisine-label">Cuisine</InputLabel>
            <Select
              labelId="select-cuisine-label"
              id="cuisine-select"
              value={selectedCuisine}
              label="Cuisine"
              onChange={onCuisineChange}
            >
              <MenuItem value={ALL_CUISINES}>{ALL_CUISINES}</MenuItem>
              {cuisineCounts.map(({ cuisine, count }) => (
                <MenuItem value={cuisine} key={cuisine}>
                  {cuisine} ({count})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Search by name"
            value={nameQuery}
            onChange={onNameQueryChange}
            placeholder="Find a place by name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}