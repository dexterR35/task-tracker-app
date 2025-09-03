
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './app/store';
import router from './app/router';
import { AuthProvider } from './context/AuthProvider';
import { DarkModeProvider } from './context/DarkModeProvider';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import CacheDebugger from '@/components/ui/Debug/CacheDebugger';
import PerformanceMonitor from '@/components/PerformanceMonitor';

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <DarkModeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastContainer />
          <CacheDebugger />
          <PerformanceMonitor />
        </AuthProvider>
      </DarkModeProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
