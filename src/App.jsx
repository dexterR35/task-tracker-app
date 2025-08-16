import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import store from './redux/store';
import router from './router';
import { AuthProvider } from './features/auth/AuthProvider';
import NotificationContainer from './components/NotificationContainer';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <AuthProvider>
  <RouterProvider router={router} />
        <NotificationContainer />
      </AuthProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
