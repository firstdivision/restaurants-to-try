// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'
import { Box, FormControl, InputLabel, MenuItem } from "@mui/material";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import Select, { SelectChangeEvent } from '@mui/material/Select';

class ItemWithCount {
    name:string;
    count:number;

    constructor(name:string, count:number) { 
        this.name = name; 
        this.count = count
     }  
}

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
    const [selectedCuisine, setCuisine] = React.useState('All');

    //alphabetize the list of restaurants
    let sortedRestaurants = restaurants.sort((a, b) => a.name > b.name ? 1 : -1)
    //get a list of distinct cuisines
    const cuisinesWithCount = [] as ItemWithCount[];

    sortedRestaurants.map(restaurant => {
        let found = cuisinesWithCount.find(e => e.name === restaurant.cuisine);

        if (!found) {
            cuisinesWithCount.push(new ItemWithCount(restaurant.cuisine, 1));
        } else {
            found.count++;
        }
    });

    cuisinesWithCount.sort((a, b) => a.name > b.name ? 1 : -1)

    let cuisineMenuItems = cuisinesWithCount
        .map(function(cuisine) {
        return <MenuItem value={cuisine.name} key={cuisine.name}>{cuisine.name} ({cuisine.count}) </MenuItem>
    });

    //add the "All" item at the front
    cuisineMenuItems.unshift(<MenuItem value="All" key="All">All</MenuItem>);

    let selectedRestaurants = sortedRestaurants
    if (selectedCuisine !== "All")
    {
        selectedRestaurants = selectedRestaurants.filter((restaurant) => restaurant.cuisine === selectedCuisine);
    }

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

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
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