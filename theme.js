"use client";

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'SF Pro Display, SF Pro Icons, Helvetica Neue, Arial, sans-serif',
    fontSize: 14,
  },
  palette: {
    primary:    { main: '#2E7D32' },
    secondary:  { main: '#F57F17' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});

export default theme;
