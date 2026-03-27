import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import { Link as RouterLink, useLocation } from 'react-router-dom';

type NavItem = {
  text: string;
  route: string;
};

const pages: NavItem[] = [
  { text: 'Map', route: '/' },
  { text: 'List', route: '/list' },
  { text: 'Builder', route: '/builder' },
];

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const location = useLocation();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl" sx={{ py: 1.25 }}>
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: '18px',
              backgroundColor: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(126, 85, 48, 0.12)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #a55a2a, #d89161)',
                color: 'primary.contrastText',
              }}
            >
              <RestaurantRoundedIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.1 }}>
                Restaurants to Try
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Austin shortlist
              </Typography>
            </Box>
          </Paper>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="open navigation"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
              sx={{
                border: '1px solid rgba(126, 85, 48, 0.14)',
                backgroundColor: 'rgba(255,255,255,0.72)',
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.route}
                  component={RouterLink}
                  to={page.route}
                  onClick={handleCloseNavMenu}
                  selected={location.pathname === page.route}
                >
                  <Typography sx={{ textAlign: 'center' }}>
                    {page.text}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              p: 0.75,
              borderRadius: '18px',
              backgroundColor: 'rgba(255,255,255,0.68)',
              border: '1px solid rgba(126, 85, 48, 0.12)',
            }}
          >
            {pages.map((page) => (
              <Button
                key={page.route}
                component={RouterLink}
                to={page.route}
                color={location.pathname === page.route ? 'primary' : 'inherit'}
                variant={location.pathname === page.route ? 'contained' : 'text'}
                sx={{
                  minWidth: 92,
                  color: location.pathname === page.route ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {page.text}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
