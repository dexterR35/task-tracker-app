import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from './hooks/useAuth';

import Layout from './components/Layout';

// Simple inline loading component
const SimpleLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="h-8 w-8 relative">
      <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
      <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

// Import components directly instead of lazy loading
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import TaskDetailPage from './pages/TaskDetailPage';

// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated, loading, listenerActive, initialAuthResolved } = useAuth();
  const location = useLocation();
  if (!initialAuthResolved) return <SimpleLoader />;
  if (isAuthenticated) {
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }
  return children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading, listenerActive, initialAuthResolved } = useAuth();
  const location = useLocation();
  if (!initialAuthResolved) return <SimpleLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/unauthorized" replace />;
  return children;
};

// Component for admin-only routes
const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

// Component for authenticated user routes
const UserRoute = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);

// Root index wrapper: redirect authenticated users directly to dashboard without flicker
const RootIndex = () => {
  const { isAuthenticated, initialAuthResolved } = useAuth();
  if (!initialAuthResolved) return <SimpleLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <HomePage />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <div>Something went wrong!</div>,
    children: [
      {
        index: true,
        element: <RootIndex />
      },
      {
        path: 'login',
        element: (
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        )
      },
      {
        path: 'dashboard',
        element: (
          <UserRoute>
            <DashboardPage />
          </UserRoute>
        )
      },
      {
        path: 'dashboard/:userId',
        element: (
          <UserRoute>
            <DashboardPage />
          </UserRoute>
        )
      },
      {
        path: 'task/:monthId/:taskId',
        element: (
          <UserRoute>
            <TaskDetailPage />
          </UserRoute>
        )
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />
      }
    ]
  }
]);

export default router;
