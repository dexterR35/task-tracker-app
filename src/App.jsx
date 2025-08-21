
import { Provider,RouterProvider } from './hooks/useImports';
import store from './redux/store';
import router from './router';
import { AuthProvider } from './features/auth/AuthProvider';
import NotificationContainer from './components/notification/NotificationContainer';
import ErrorBoundary from './components/notification/error/ErrorBoundary';

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
