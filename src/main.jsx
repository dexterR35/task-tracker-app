import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import store from './app/store';
import fontLoader from './utils/fontLoader';

// Register service worker for better caching and performance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Load critical fonts immediately but don't block rendering
fontLoader.loadCriticalFonts();

// Load non-critical fonts when the page becomes idle
const loadFontsWhenIdle = () => {
  if ('requestIdleCallback' in window) {
    // Use requestIdleCallback if available (more efficient)
    requestIdleCallback(() => fontLoader.loadNonCriticalFonts(), { timeout: 3000 });
  } else {
    // Fallback to a longer timeout to avoid blocking
    setTimeout(() => fontLoader.loadNonCriticalFonts(), 1000);
  }
};

// Start loading non-critical fonts after initial render
loadFontsWhenIdle();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
