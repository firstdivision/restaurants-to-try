import { alpha, createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  shape: {
    borderRadius: 2,
  },
  palette: {
    primary: {
      main: '#a55a2a',
      light: '#d89161',
      dark: '#7c3f16',
      contrastText: '#fffaf6',
    },
    secondary: {
      main: '#305f72',
      light: '#5c8ba0',
      dark: '#1f4352',
      contrastText: '#f5fbfd',
    },
    background: {
      default: '#f6efe7',
      paper: '#fffaf6',
    },
    text: {
      primary: '#26160e',
      secondary: '#71594a',
    },
    divider: 'rgba(126, 85, 48, 0.18)',
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h4: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontWeight: 700,
    },
    h6: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    subtitle1: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 800,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    overline: {
      fontWeight: 800,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top left, rgba(226, 190, 157, 0.28), transparent 35%), radial-gradient(circle at top right, rgba(98, 138, 156, 0.18), transparent 26%), linear-gradient(180deg, #fcf8f3 0%, #f5ede3 100%)',
          minHeight: '100vh',
        },
        '::selection': {
          backgroundColor: 'rgba(165, 90, 42, 0.20)',
        },
        a: {
          color: 'inherit',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: '14px',
          paddingInline: 18,
        },
        containedPrimary: {
          boxShadow: '0 16px 30px rgba(124, 63, 22, 0.18)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          fontWeight: 700,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#fffaf6', 0.84),
          backdropFilter: 'blur(18px)',
          color: '#26160e',
          borderBottom: '1px solid rgba(126, 85, 48, 0.14)',
          boxShadow: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#ffffff', 0.76),
          borderRadius: '14px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          border: '1px solid rgba(126, 85, 48, 0.12)',
          boxShadow: '0 18px 40px rgba(70, 45, 24, 0.08)',
          overflow: 'hidden',
        },
      },
    },
  },
});

export default theme;
