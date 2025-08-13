import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';

import Layout from './components/Layout';
import PageLoader from './components/PageLoader';

// Dynamic imports for better code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/UserDashBoard'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ManageUsersPage = lazy(() => import('./pages/ManageUsersPage'));

import { AdminRoute, UserRoute } from './features/auth/ProtectedRoutes';
import AuthRedirectHandler from './features/auth/AuthRedirect';

// Component to protect login page from authenticated users
const LoginRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading.fetchCurrentUser) {
    return <PageLoader message="Checking authentication..." />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// React Router v7 routing object with createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <LoginRoute>
        <Suspense fallback={<PageLoader message="Loading login..." />}>
          <LoginPage />
        </Suspense>
      </LoginRoute>
    ),
  },
  {
    path: '/',
    element: (
      <>
        <AuthRedirectHandler />
        <Layout />
      </>
    ),
    children: [
      { 
        index: true, // v7 preferred syntax for index routes
        element: (
          <Suspense fallback={<PageLoader message="Loading home..." />}>
            <HomePage />
          </Suspense>
        ) 
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <Suspense fallback={<PageLoader message="Loading admin..." />}>
              <AdminPage />
            </Suspense>
          </AdminRoute>
        ),
      },
      {
        path: 'manage-users',
        element: (
          <AdminRoute>
            <Suspense fallback={<PageLoader message="Loading user management..." />}>
              <ManageUsersPage />
            </Suspense>
          </AdminRoute>
        ),
      },
      {
        path: 'dashboard/:uid',
        element: (
          <UserRoute>
            <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
              <DashboardPage />
            </Suspense>
          </UserRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
