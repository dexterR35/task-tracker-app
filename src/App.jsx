import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import createRouter from '@/app/router';
import { DarkModeProvider } from '@/context/DarkModeProvider';
import { AppDataProvider } from '@/context/AppDataContext';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

/**
 * Router wrapper component that creates the router within the provider context
 * This ensures all route components have access to context providers
 */
const RouterWrapper = () => {
  // Create router using useMemo to prevent recreation on re-renders
  // Router components are only rendered when routes match,
  // at which point they'll have access to all context providers
  const router = useMemo(() => createRouter(), []);
  
  return <RouterProvider router={router} />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <AppDataProvider>
          <RouterWrapper />
          <Toaster
            position="top-right"
            toastOptions={{ duration: 3000 }}
            containerStyle={{ zIndex: 9999 }}
          />
          </AppDataProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
};

export default App;
