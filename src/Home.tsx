import { Box, Container, Typography } from "@mui/material";
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Map from "./Map";

export default function Home() {
    return (
        <Container maxWidth={false} disableGutters sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <ResponsiveAppBar />
            <Box sx={{ flex: 1, minHeight: 0, px: 2, py: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                    Restaurants to Try
                </Typography>
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    <Map />
                </Box>
            </Box>
        </Container>
    );
  }