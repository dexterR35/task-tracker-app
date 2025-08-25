import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import "@fontsource/roboto/300.css";//thin
import "@fontsource/roboto/300-italic.css";
import "@fontsource/roboto/400.css";//normal
import "@fontsource/roboto/400-italic.css";
import "@fontsource/roboto/500.css";// medium
import "@fontsource/roboto/700.css";// bold
import "@fontsource/roboto/800.css";// extrabold
import "@fontsource/roboto/900.css";// Black
import store from './app/store';
import { setupAuthListener } from './features/auth/authSlice';

// Setup auth listener early
setupAuthListener(store.dispatch);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
