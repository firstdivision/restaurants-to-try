import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ResponsiveAppBar from "./AppBar";
import React from "react";
import { SelectChangeEvent } from '@mui/material/Select';

import restaurants from './data/restaurants.json'
import { ALL_CUISINES, filterRestaurants, getCuisineCounts, getSortedRestaurants } from './data/restaurantUtils';
import DiscoveryControls from './DiscoveryControls';

export default function ListView() {
    const [selectedCuisine, setCuisine] = React.useState(ALL_CUISINES);
    const [nameQuery, setNameQuery] = React.useState('');

    const sortedRestaurants = getSortedRestaurants(restaurants);
    const cuisineCounts = getCuisineCounts(sortedRestaurants);

    const selectedRestaurants = filterRestaurants(sortedRestaurants, selectedCuisine, nameQuery);

    const handleCuisineChange = (event: SelectChangeEvent) => {
        setCuisine(event.target.value as string);
    };

    const handleNameQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNameQuery(event.target.value);
    };

    return (
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ResponsiveAppBar />
            <Box sx={{ flex: 1, px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, display: 'grid', gap: 2.5, alignContent: 'start' }}>
                <DiscoveryControls
                    selectedCuisine={selectedCuisine}
                    nameQuery={nameQuery}
                    cuisineCounts={cuisineCounts}
                    resultCount={selectedRestaurants.length}
                    totalCount={sortedRestaurants.length}
                    onCuisineChange={handleCuisineChange}
                    onNameQueryChange={handleNameQueryChange}
                    headline="Scan the shortlist without losing the sense of place."
                    supportingText="The list view is built for comparison: quick cuisine context, direct links, and just enough detail to decide where to go next."
                />

                {selectedRestaurants.length > 0 ? (
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' } }}>
                        {selectedRestaurants.map((restaurant, index) => (
                            <Card key={restaurant.name} sx={{ background: index % 2 === 0 ? 'linear-gradient(180deg, rgba(255,250,246,0.96), rgba(247,239,230,0.9))' : 'linear-gradient(180deg, rgba(255,250,246,0.96), rgba(236,245,248,0.9))' }}>
                                <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="h5" component="h2" sx={{ mb: 0.75 }}>
                                                {restaurant.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                <Chip label={restaurant.cuisine} color="primary" size="small" />
                                                <Chip label={`${restaurant.lat.toFixed(3)}, ${restaurant.lon.toFixed(3)}`} variant="outlined" size="small" />
                                            </Stack>
                                        </Box>

                                        <Typography variant="body1" color="text.secondary">
                                            {restaurant.blurb}
                                        </Typography>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                                            <Button
                                                variant="contained"
                                                href={restaurant.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Visit website
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                href={restaurant.googleMapsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                            >
                                                Open in Google Maps
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(126, 85, 48, 0.14)', backgroundColor: 'rgba(255,250,246,0.68)' }}>
                        <Typography variant="h4" sx={{ mb: 1.25 }}>
                            No restaurants matched your filters.
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Try a broader search term or switch the cuisine filter back to All.
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Container>
    );
  }