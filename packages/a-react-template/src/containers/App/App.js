import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../components/App';

export default () => (
  <Router>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </Router>
);
