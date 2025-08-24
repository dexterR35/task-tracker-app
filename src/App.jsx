
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import store from './app/store';
import router from './app/router';
import { AuthProvider } from './shared/context/AuthProvider';
import NotificationContainer from './features/notifications/components/NotificationContainer';
import ErrorBoundary from './features/notifications/components/error/ErrorBoundary';

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
