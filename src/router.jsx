import { createBrowserRouter, Navigate } from 'react-router-dom';

import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/UserDashBoard';
import GuestPage from './pages/GuestPage';
import HomePage from './pages/HomePage';

import { AdminRoute, UserRoute, GuestRoute } from './features/auth/ProtectedRoutes';
import AuthRedirectHandler from './features/auth/AuthRedirect';

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <GuestRoute>
          <LoginPage />
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
        { path: '/', element: <HomePage /> },
        {
          path: '/admin',
          element: (
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          ),
        },
        {
          path: '/dashboard/:uid',
          element: (
            <UserRoute>
              <DashboardPage />
            </UserRoute>
          ),
        },
        {
          path: '/guest',
          element: (
            <UserRoute allowedRoles={['guest']}>
              <GuestPage />
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
