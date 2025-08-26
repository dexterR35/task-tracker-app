
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './app/store';
import router from './app/router';
import { AuthProvider } from './shared/context/AuthProvider';
import GlobalLoader from './shared/components/ui/GlobalLoader';
import ErrorBoundary from './shared/components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <AuthProvider>
        <GlobalLoader>
          <RouterProvider router={router} />
          <ToastContainer />
        </GlobalLoader>
      </AuthProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
