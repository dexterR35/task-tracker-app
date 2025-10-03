
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from '@/app/store';
import router from '@/app/router';
import { AuthProvider } from '@/context/AuthProvider';
import { DarkModeProvider } from '@/context/DarkModeProvider';
import MaintenanceMode from '@/components/ui/MaintenanceMode/MaintenanceMode';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

// Set to true to enable maintenance mode, false to disable
const MAINTENANCE_MODE = true;

const App = () => {
  // Show maintenance mode if enabled
  if (MAINTENANCE_MODE) {
    return <MaintenanceMode />;
  }

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <DarkModeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </AuthProvider>
        </DarkModeProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
