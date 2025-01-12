import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ProTip from './ProTip';

import Map from "./Map";

import "./styles.css";
import { Button, ButtonGroup } from '@mui/material';
import ResponsiveAppBar from './AppBar';

function Copyright() {
  return (
    <Typography
      variant="body2"
      align="center"
      sx={{
        color: 'text.secondary',
      }}
    >
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}

export default function App() {

  return (

    <Container maxWidth="sm">
      {/* <ButtonGroup variant="text" aria-label="Basic button group">
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup> */}
      <ResponsiveAppBar />
      <Box sx={{ my: 4 }}>
        <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
          Restaurants to Try
        </Typography>
        <div className="App">
          <Map />
        </div>
        <Copyright />
      </Box>
    </Container>
  );
}
