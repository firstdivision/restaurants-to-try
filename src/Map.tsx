// Map.tsx
import React from "react";
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import { SelectChangeEvent } from '@mui/material/Select';
import { ALL_CUISINES, filterRestaurants, getCuisineCounts, getSortedRestaurants } from './data/restaurantUtils';
import DiscoveryControls from './DiscoveryControls';

const themedMarkerIcon = L.divIcon({
    className: 'restaurant-marker-wrapper',
    html: '<div class="restaurant-marker"><span class="restaurant-marker__core"></span></div>',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -36],
});

function FitMapToMarkers({ positions }: { positions: [number, number][] }) {
    const map = useMap();

    React.useEffect(() => {
        if (positions.length === 0) {
            return;
        }

        if (positions.length === 1) {
            map.setView(positions[0], 13);
            return;
        }

        map.fitBounds(positions, { padding: [40, 40] });
    }, [map, positions]);

    return null;
}

export default function Map() {
    const [selectedCuisine, setCuisine] = React.useState(ALL_CUISINES);
    const [nameQuery, setNameQuery] = React.useState('');

    const sortedRestaurants = getSortedRestaurants(restaurants);
    const cuisineCounts = getCuisineCounts(sortedRestaurants);

    const selectedRestaurants = filterRestaurants(sortedRestaurants, selectedCuisine, nameQuery);

    const markerPositions = selectedRestaurants.map((restaurant) => [restaurant.lat, restaurant.lon] as [number, number]);

    let markers = selectedRestaurants.map(function(restaurant) {
        return <Marker key={restaurant.name} position={[restaurant.lat, restaurant.lon]} icon={themedMarkerIcon}>
                <Popup>
                    <Box className="map-popup">
                        <Stack spacing={1.25}>
                            <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
                                <a href={restaurant.url} target="_blank" rel="noopener noreferrer" style={{ color: '#26160e', textDecoration: 'none' }}>
                                    {restaurant.name}
                                </a>
                            </Typography>
                            <Chip label={restaurant.cuisine} size="small" color="primary" sx={{ alignSelf: 'start' }} />
                            <Typography variant="body2" color="text.secondary">
                                {restaurant.blurb}
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    href={restaurant.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        backgroundColor: 'primary.main',
                                        color: 'primary.contrastText',
                                        textDecoration: 'none',
                                        '&:link': {
                                            color: 'primary.contrastText',
                                        },
                                        '&:visited': {
                                            color: 'primary.contrastText',
                                        },
                                        '&:hover': {
                                            backgroundColor: 'primary.dark',
                                            color: 'primary.contrastText',
                                            textDecoration: 'none',
                                        },
                                    }}
                                >
                                    Website
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    href={restaurant.googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                    sx={{
                                        borderColor: 'rgba(48, 95, 114, 0.22)',
                                        backgroundColor: 'rgba(48, 95, 114, 0.06)',
                                        color: 'secondary.dark',
                                        textDecoration: 'none',
                                        '&:link': {
                                            color: 'secondary.dark',
                                        },
                                        '&:visited': {
                                            color: 'secondary.dark',
                                        },
                                        '&:hover': {
                                            borderColor: 'secondary.main',
                                            backgroundColor: 'rgba(48, 95, 114, 0.10)',
                                            color: 'secondary.dark',
                                            textDecoration: 'none',
                                        },
                                    }}
                                >
                                    Google Maps
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Popup>
        </Marker>;
      });

    const handleCuisineChange = (event: SelectChangeEvent) => {
        setCuisine(event.target.value as string);
    };

    const handleNameQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNameQuery(event.target.value);
    };

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'grid', gap: 2, gridTemplateRows: 'auto minmax(0, 1fr)' }}>
        <DiscoveryControls
            selectedCuisine={selectedCuisine}
            nameQuery={nameQuery}
            cuisineCounts={cuisineCounts}
            resultCount={selectedRestaurants.length}
            totalCount={sortedRestaurants.length}
            onCuisineChange={handleCuisineChange}
            onNameQueryChange={handleNameQueryChange}
            headline="See what is worth trying, then zoom straight to it."
            supportingText="Filter the collection by cuisine or name and let the map tighten itself around the places that still look interesting."
        />

        <Paper
            elevation={0}
            sx={{
                minHeight: 0,
                p: { xs: 1.25, md: 1.5 },
                borderRadius: 8,
                border: '1px solid rgba(126, 85, 48, 0.14)',
                backgroundColor: 'rgba(255,250,246,0.6)',
                boxShadow: '0 30px 60px rgba(70, 45, 24, 0.10)',
            }}
        >
            {selectedRestaurants.length > 0 ? (
                <Box sx={{ height: '100%', minHeight: 420, position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                    <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 500, maxWidth: 320 }}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 5, backgroundColor: 'rgba(255,250,246,0.9)', backdropFilter: 'blur(14px)', border: '1px solid rgba(126, 85, 48, 0.12)' }}>
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <MyLocationRoundedIcon color="primary" fontSize="small" />
                                    <Typography variant="subtitle1">
                                        {selectedRestaurants.length} place{selectedRestaurants.length === 1 ? '' : 's'} in view
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedRestaurants.slice(0, 3).map((restaurant) => restaurant.name).join(' • ')}
                                    {selectedRestaurants.length > 3 ? ' • ...' : ''}
                                </Typography>
                            </Stack>
                        </Paper>
                    </Box>

                    <MapContainer style={{ height: '100%', width: '100%' }} center={[30.265175, -97.743821]} zoom={10} scrollWheelZoom>
                        <FitMapToMarkers positions={markerPositions} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        {markers}
                    </MapContainer>
                </Box>
            ) : (
                <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center', p: 4 }}>
                    <Stack spacing={1.25} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
                        <Typography variant="h4">No restaurants matched that filter set.</Typography>
                        <Typography variant="body1" color="text.secondary">
                            Try resetting the cuisine filter or broadening the name search to bring more markers back into view.
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Paper>
    </Box>

  );
}