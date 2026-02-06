import { useMemo } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import createRouter from '@/app/router';
import { store } from '@/store/store';
import { DarkModeProvider } from '@/context/DarkModeProvider';
import { AppDataProvider } from '@/context/AppDataContext';
import { SelectedDepartmentProvider } from '@/context/SelectedDepartmentContext';
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
    <Provider store={store}>
      <ErrorBoundary>
        <DarkModeProvider>
          <AppDataProvider>
            <SelectedDepartmentProvider>
              <RouterWrapper />
              <Toaster
                position="top-center"
                toastOptions={{ duration: 3000 }}
                containerStyle={{ zIndex: 9999 }}
              />
            </SelectedDepartmentProvider>
          </AppDataProvider>
        </DarkModeProvider>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
