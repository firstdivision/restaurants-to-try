import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import Map from "./Map";

import "./styles.css";
import ResponsiveAppBar from './AppBar';

export default function App() {

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
