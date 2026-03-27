import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Map from "./Map";
import restaurants from './data/restaurants.json';
import { getCuisineCounts } from './data/restaurantUtils';
import { Link as RouterLink } from 'react-router-dom';

export default function Home() {
    const cuisineCounts = getCuisineCounts(restaurants);

    return (
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <ResponsiveAppBar />
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    px: { xs: 2, md: 4 },
                    py: { xs: 2, md: 3 },
                    display: 'grid',
                    gap: 3,
                    gridTemplateRows: 'auto minmax(0, 1fr)',
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(255,250,246,0.94), rgba(247,234,221,0.88))',
                        border: '1px solid rgba(160, 125, 88, 0.14)',
                        boxShadow: '0 18px 36px rgba(70, 45, 24, 0.06)',
                    }}
                >
                    <Box sx={{ display: 'grid', gap: 1.5, alignItems: 'start', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(260px, 0.75fr)' } }}>
                        <Stack spacing={1}>
                            <Typography variant="overline" color="text.secondary">
                                Personal dining map
                            </Typography>
                            <Typography variant="h2" component="h1" sx={{ maxWidth: 560, fontSize: { xs: '1.55rem', md: '2.15rem' }, lineHeight: 1.03 }}>
                                A tighter way to keep track of restaurants worth trying.
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, fontSize: '0.94rem' }}>
                                Browse the shortlist on the map or jump straight into the full list.
                            </Typography>
                        </Stack>

                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                                justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                                flexWrap: 'wrap',
                                p: { xs: 0.75, lg: 1 },
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                border: '1px solid rgba(126, 85, 48, 0.10)',
                            }}
                        >
                            <Chip label={`${restaurants.length} restaurants`} variant="outlined" size="small" />
                            <Chip label={`${cuisineCounts.length} cuisines`} variant="outlined" size="small" />
                            <Chip label="Austin" variant="outlined" size="small" />
                            <Button component={RouterLink} to="/list" variant="contained" size="small" sx={{ minWidth: 140, ml: { xs: 0, lg: 0.5 } }}>
                                Browse the list
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <Box sx={{ minHeight: 0, display: 'grid', gap: 1, gridTemplateRows: 'auto minmax(0, 1fr)' }}>
                    <Typography variant="overline" color="text.secondary" sx={{ px: 0.5 }}>
                        Explore the map
                    </Typography>
                    <Box sx={{ minHeight: 0 }}>
                        <Map />
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}