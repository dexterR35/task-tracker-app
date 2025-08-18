// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
// Import all components needed
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import TaskDetailPage from './pages/TaskDetailPage';

// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }
  return children;
};

// Component to protect routes that require authentication
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, initialAuthResolved } = useAuth();
  const location = useLocation();
  
  if (!initialAuthResolved) {
    // This is the key change: show a loader while auth state is being resolved
    return <SimpleLoader />; 
  }
  
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

// Root index wrapper: redirect authenticated users directly to dashboard
const RootIndex = () => {
  const { isAuthenticated, initialAuthResolved } = useAuth();
  if (!initialAuthResolved) {
    return <SimpleLoader />;
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
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