import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Import fonts statically to avoid module resolution issues
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
