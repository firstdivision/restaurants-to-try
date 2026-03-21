// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'
import { Box, FormControl, InputLabel, MenuItem, TextField } from "@mui/material";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { ALL_CUISINES, filterRestaurants, getCuisineCounts, getSortedRestaurants } from './data/restaurantUtils';

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

    const cuisineMenuItems = [
        <MenuItem value={ALL_CUISINES} key={ALL_CUISINES}>{ALL_CUISINES}</MenuItem>,
        ...cuisineCounts.map(({ cuisine, count }) => (
            <MenuItem value={cuisine} key={cuisine}>{cuisine} ({count})</MenuItem>
        )),
    ];

    const selectedRestaurants = filterRestaurants(sortedRestaurants, selectedCuisine, nameQuery);

    const markerPositions = selectedRestaurants.map((restaurant) => [restaurant.lat, restaurant.lon] as [number, number]);

    let markers = selectedRestaurants.map(function(restaurant) {
        return <Marker key={restaurant.name} position={[restaurant.lat, restaurant.lon]}>
                <Popup>
                    <div>
                        <b><a href={ restaurant.url } target="_blank">{ restaurant.name }</a></b> 
                        &nbsp; - &nbsp;
                        <a target="_blank" href={ restaurant.googleMapsLink }>
                            Google
                            <OpenInNewRoundedIcon display={"inline"} sx={{ fontSize: 10 }} />   
                        </a>
                    </div>

                <div>
                    {restaurant.blurb}
                </div>
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
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <FormControl fullWidth>
                <InputLabel id="select-cuisine-label">Cuisine</InputLabel>
                <Select
                    labelId="select-cuisine-label"
                    id="cuisine-select"
                    value={selectedCuisine}
                    label="Cuisine"
                    onChange={handleCuisineChange}
                >
                    { cuisineMenuItems }
                </Select>
            </FormControl>

            <TextField
                fullWidth
                label="Search by name"
                value={nameQuery}
                onChange={handleNameQueryChange}
                placeholder="Type part of a restaurant name"
            />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}>
            <MapContainer style={{ height: '100%', width: '100%' }} center={[30.265175, -97.743821]} zoom={10} scrollWheelZoom={false}>
                <FitMapToMarkers positions={markerPositions} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers}
            </MapContainer>              
        </Box>
    </Box>

  );
}