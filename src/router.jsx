import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAuth } from './hooks/useAuth';

import Layout from './components/Layout';
import GlobalLoader from './components/GlobalLoader';

// Import components directly instead of lazy loading
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import ManageUsersPage from './pages/ManageUsersPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import TaskDetailPage from './pages/TaskDetailPage';

// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading.fetchCurrentUser) {
    return <GlobalLoader />;
  }
  
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading.fetchCurrentUser) {
    return <GlobalLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
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

// Component to handle redirects based on auth state
const AuthRedirectHandler = () => {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading.fetchCurrentUser) {
    return <GlobalLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on role
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <div>Something went wrong!</div>,
    children: [
      {
        index: true,
        element: <HomePage />
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
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        )
      },
      {
        path: 'manage-users',
        element: (
          <AdminRoute>
            <ManageUsersPage />
          </AdminRoute>
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
