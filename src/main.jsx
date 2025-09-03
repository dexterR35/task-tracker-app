import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import "@fontsource/roboto/400.css";//normal - critical for initial render
import "@fontsource/roboto/500.css";// medium - critical for initial render
import store from './app/store';

// Lazy load non-critical fonts using a more efficient approach
const loadNonCriticalFonts = async () => {
  try {
    // Load fonts in parallel for better performance
    await Promise.all([
      import("@fontsource/roboto/300.css"),//thin
      import("@fontsource/roboto/300-italic.css"),
      import("@fontsource/roboto/400-italic.css"),
      import("@fontsource/roboto/700.css"),// bold
      import("@fontsource/roboto/800.css"),// extrabold
      import("@fontsource/roboto/900.css"),// Black
    ]);
  } catch (error) {
    console.warn('Failed to load non-critical fonts:', error);
  }
};

// Load non-critical fonts when the page becomes idle or after a short delay
const loadFontsWhenIdle = () => {
  if ('requestIdleCallback' in window) {
    // Use requestIdleCallback if available (more efficient)
    requestIdleCallback(() => loadNonCriticalFonts(), { timeout: 2000 });
  } else {
    // Fallback to a shorter timeout
    setTimeout(loadNonCriticalFonts, 500);
  }
};

// Start loading fonts after initial render
loadFontsWhenIdle();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  // </React.StrictMode>
);
