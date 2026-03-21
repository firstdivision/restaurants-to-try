import { Box, Container, FormControl, InputLabel, MenuItem, Stack, Typography } from "@mui/material";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Select, { SelectChangeEvent } from '@mui/material/Select';

import restaurants from './data/restaurants.json'

export default function ListView() {
    const [selectedCuisine, setCuisine] = React.useState('All');

    //alphabetize the list of restaurants
    const sortedRestaurants = [...restaurants].sort((a, b) => a.name > b.name ? 1 : -1);

    //get a list of distinct cuisines with counts
    const cuisineCounts = new Map<string, number>();
    sortedRestaurants.forEach((restaurant) => {
        cuisineCounts.set(restaurant.cuisine, (cuisineCounts.get(restaurant.cuisine) ?? 0) + 1);
    });

    const cuisineMenuItems = Array.from(cuisineCounts.entries())
        .sort((a, b) => a[0] > b[0] ? 1 : -1)
        .map(([cuisine, count]) => (
            <MenuItem value={cuisine} key={cuisine}>{cuisine} ({count})</MenuItem>
        ));

    cuisineMenuItems.unshift(<MenuItem value="All" key="All">All</MenuItem>);

    let selectedRestaurants = sortedRestaurants;
    if (selectedCuisine !== 'All') {
        selectedRestaurants = sortedRestaurants.filter((restaurant) => restaurant.cuisine === selectedCuisine);
    }

    let restaurantList = selectedRestaurants.map(function(restaurant) {
        return <div key={restaurant.name}>
            <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                <a href={ restaurant.url } target="_blank">{ restaurant.name }</a>
            </Typography>

            <Typography variant="body1" gutterBottom sx={{ display: 'block' }}>
                <a target="_blank" href={ restaurant.googleMapsLink }>
                    <Stack alignItems="center" direction="row" gap={2}>
                        <Typography variant="body1">Google</Typography>
                        <OpenInNewRoundedIcon  fontSize="small" />
                    </Stack> 
                </a>
            </Typography>

            <Typography variant="body1" gutterBottom sx={{ display: 'block' }}>
                Cuisine: {restaurant.cuisine}
            </Typography>
                                    
            <Typography variant="body1" gutterBottom sx={{ display: 'block' }}>
                {restaurant.blurb}
            </Typography>
        </div>;
        });

    const handleCuisineChange = (event: SelectChangeEvent) => {
        setCuisine(event.target.value as string);
    };

    return (
        <Container maxWidth={false}>
            <ResponsiveAppBar />
            <Box sx={{ my: 4 }}>
            <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                Restaurants to Try
            </Typography>
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
                        {cuisineMenuItems}
                    </Select>
                </FormControl>
            </Box>
            <div className="App">
               { restaurantList }
            </div>
            </Box>
        </Container>
    );
  }