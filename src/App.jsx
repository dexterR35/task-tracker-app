
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './app/store';
import router from './app/router';
import { AuthProvider } from './shared/context/AuthProvider';
import { DarkModeProvider } from './shared/context/DarkModeProvider';
import ErrorBoundary from './shared/components/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <DarkModeProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </DarkModeProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
