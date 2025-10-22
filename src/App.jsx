
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import router from '@/app/router';
import { AuthProvider } from '@/context/AuthContext';
import { DarkModeProvider } from '@/context/DarkModeProvider';
import { AppDataProvider } from '@/context/AppDataContext';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

const App = () => (
  <ErrorBoundary>
    <DarkModeProvider>
      <AuthProvider>
        <AppDataProvider>
          <RouterProvider router={router} />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 9999 }}
          />
        </AppDataProvider>
      </AuthProvider>
    </DarkModeProvider>
  </ErrorBoundary>
);

export default App;
