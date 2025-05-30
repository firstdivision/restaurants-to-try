import { Box, Container, Stack, Typography } from "@mui/material";
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ResponsiveAppBar from "./AppBar";
import React from "react";

import restaurants from './data/restaurants.json'

export default function ListView() {
    //alphabetize the list of restaurants
    let sortedRestaurants = restaurants.sort((a, b) => a.name > b.name ? 1 : -1)

    let restaurantList = sortedRestaurants.map(function(restaurant) {
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

    return (
        <Container maxWidth="sm">
            <ResponsiveAppBar />
            <Box sx={{ my: 4 }}>
            <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                Restaurants to Try
            </Typography>
            <div className="App">
               { restaurantList }
            </div>
            </Box>
        </Container>
    );
  }