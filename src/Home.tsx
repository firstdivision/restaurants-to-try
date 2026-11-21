import { Box, Container } from '@mui/material';
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Map from "./Map";

export default function Home() {
    return (
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <ResponsiveAppBar />
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    px: { xs: 2, md: 4 },
                    py: { xs: 2, md: 3 },
                }}
            >
                <Map />
            </Box>
        </Container>
    );
}