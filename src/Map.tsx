// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'
import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from '@mui/material/Select';

export default function Map() {
    console.log("function Map()...")
    const [selectedCuisine, setCuisine] = React.useState('All');

    //get a list of distinct cuisines
    const cuisines = [] as string[];

    restaurants.map(restaurant => {
        if (cuisines.indexOf(restaurant.cuisine) === -1) {
            cuisines.push(restaurant.cuisine)
        }
    });

    let cuisineMenuItems = cuisines.map(function(cuisine) {
        return <MenuItem value={cuisine} key={cuisine}>{cuisine}</MenuItem>
    });

    //add the "All" item at the front
    cuisineMenuItems.unshift(<MenuItem value="All" key="All">All</MenuItem>);

    let selectedRestaurants = restaurants
    if (selectedCuisine !== "All")
    {
        selectedRestaurants = selectedRestaurants.filter((restaurant) => restaurant.cuisine === selectedCuisine);
    }

    let markers = selectedRestaurants.map(function(restaurant) {
        return <Marker key={restaurant.name} position={[restaurant.lat, restaurant.lon]}>
                <Popup>
                <b><a href={ restaurant.url } target="_blank">{ restaurant.name }</a></b>
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
    <div>
        <div>
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
        </div>
        <div>
            <MapContainer center={[30.265175, -97.743821]} zoom={10} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers}
            </MapContainer>              
        </div>
     
    </div>

  );
}