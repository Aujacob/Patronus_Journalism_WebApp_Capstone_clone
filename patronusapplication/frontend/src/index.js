import React from 'react';
import ReactDOM from 'react-dom';
import App from './App'; // Import App Component
import { extendTheme } from '@chakra-ui/react';
import { SaasProvider, theme as baseTheme } from '@saas-ui/react';

/// Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    900: '#0f1316', // Custom color
    800: '#196e85',
    700: '#1b5192',
  },
};

const theme = extendTheme({
  colors: {
    brand: {
      900: '#0f1316', // Custom color
      800: '#196e85',
      700: '#1b5192',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'brand.900', // Set the background color to your custom color
        color: 'white', // Set the text color to white
      },
    },
  },
}, baseTheme);

ReactDOM.render(
  <React.StrictMode>
    <SaasProvider theme={theme}>
      <App />
    </SaasProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
