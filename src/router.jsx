// src/router.jsx
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
// Import all components needed
import LoginPage from './pages/LoginPage';
// import UnauthorizedPage from './pages/UnauthorizedPage';
import TaskDetailPage from './pages/TaskDetailPage';
import HomePage from './pages/HomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import UserDashboardPage from './pages/UserDashboardPage';

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
  const { isAuthenticated, role, initialAuthResolved } = useAuth();
  if (!initialAuthResolved) return <SimpleLoader />;
  if (!isAuthenticated) return <HomePage />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/me" replace />;
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
        path: 'me',
        element: (
          <UserRoute>
            <UserDashboardPage />
          </UserRoute>
        )
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        )
      },
      {
        path: 'admin/analytics',
        element: (
          <AdminRoute>
            <AdminAnalyticsPage />
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
        path: 'profile',
        element: (
          <UserRoute>
            <ProfilePage />
          </UserRoute>
        )
      },
      // {
      //   path: 'unauthorized',
      //   element: <UnauthorizedPage />
      // }
    ]
  }
]);

export default router;