// src/layouts/AppLayout.jsx
import React from 'react';
import { Layout, AppBar, ToggleThemeButton, TitlePortal, defaultTheme } from 'react-admin';
import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const CustomAppBar = (props) => (
  <AppBar {...props}>
    <TitlePortal />
    <ToggleThemeButton lightTheme={defaultTheme} darkTheme={darkTheme} />
  </AppBar>
);

const AppLayout = (props) => <Layout {...props} appBar={CustomAppBar} />;

export default AppLayout;
