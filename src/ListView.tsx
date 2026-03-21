import { Box, Container, FormControl, InputLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Select, { SelectChangeEvent } from '@mui/material/Select';

import restaurants from './data/restaurants.json'
import { ALL_CUISINES, filterRestaurants, getCuisineCounts, getSortedRestaurants } from './data/restaurantUtils';

export default function ListView() {
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

    const handleNameQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNameQuery(event.target.value);
    };

    return (
        <Container maxWidth={false}>
            <ResponsiveAppBar />
            <Box sx={{ my: 4 }}>
            <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                Restaurants to Try
            </Typography>
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
                        {cuisineMenuItems}
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
            <div className="App">
               {restaurantList.length > 0 ? restaurantList : (
                    <Typography variant="body1">No restaurants matched your filters.</Typography>
               )}
            </div>
            </Box>
        </Container>
    );
  }