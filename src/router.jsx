import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Layout from './components/Layout';
import PageLoader from './components/PageLoader';

// Dynamic imports for better code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/UserDashBoard'));
const GuestPage = lazy(() => import('./pages/GuestPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

import { AdminRoute, UserRoute, GuestRoute } from './features/auth/ProtectedRoutes';
import AuthRedirectHandler from './features/auth/AuthRedirect';

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <GuestRoute>
          <Suspense fallback={<PageLoader message="Loading login..." />}>
            <LoginPage />
          </Suspense>
        </GuestRoute>
      ),
    },
    {
      element: (
        <>
          <AuthRedirectHandler />
          <Layout />
        </>
      ),
      children: [
        { 
          path: '/', 
          element: (
            <Suspense fallback={<PageLoader message="Loading home..." />}>
              <HomePage />
            </Suspense>
          ) 
        },
        {
          path: '/admin',
          element: (
            <AdminRoute>
              <Suspense fallback={<PageLoader message="Loading admin..." />}>
                <AdminPage />
              </Suspense>
            </AdminRoute>
          ),
        },
        {
          path: '/dashboard/:uid',
          element: (
            <UserRoute>
              <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
                <DashboardPage />
              </Suspense>
            </UserRoute>
          ),
        },
        {
          path: '/guest',
          element: (
            <UserRoute allowedRoles={['guest']}>
              <Suspense fallback={<PageLoader message="Loading guest area..." />}>
                <GuestPage />
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
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

export default router;
