// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './app/store';
import router from './router';
import { AuthProvider } from './features/auth/AuthProvider';
import "./index.css"
// import './styles/admin.css';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
