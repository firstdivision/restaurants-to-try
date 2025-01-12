import { Box, Container, Typography } from "@mui/material";
import ResponsiveAppBar from "./AppBar";
import React from "react";
import Map from "./Map";

export default function Home() {
    return (
        <Container maxWidth="sm">
            <ResponsiveAppBar />
            <Box sx={{ my: 4 }}>
            <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
                Restaurants to Try
            </Typography>
            <div className="App">
                <Map />
            </div>
            </Box>
        </Container>
    );
  }