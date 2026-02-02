import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/context/AuthContext';
import { logger } from '@/utils/logger';
import { assertProductionEnv } from '@/config/envCheck';

assertProductionEnv();

// Import fonts statically to avoid module resolution issues
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";

// Log unhandled promise rejections (e.g. forgotten .catch on apiRequest)
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection:', event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
