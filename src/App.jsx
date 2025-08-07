// src/App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import store from './app/store';
import router from './router';
import { AuthProvider } from './features/auth/AuthProvider';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import GlobalErrorToastHandler from './components/GlobalErrorToastHandler';

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <RouterProvider router={router} />
      <GlobalErrorToastHandler />
      <ToastContainer />
    </AuthProvider>
  </Provider>
);

export default App;
