import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/UserDashBoard';
import GuestPage from './pages/GuestPage';
import HomePage from './pages/HomePage';

import { AdminRoute, UserRoute, GuestRoute } from './features/auth/ProtectedRoutes';
import AuthRedirectHandler from './features/auth/AuthRedirect';

const router = createBrowserRouter([
  // Login route - only accessible if NOT logged in
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },

  // Routes wrapped in Layout + AuthRedirectHandler for redirect after login
  {
    element: (
      <>
        <AuthRedirectHandler />
        <Layout />
      </>
    ),
    children: [
      // Public home page
      {
        path: '/',
        element: <HomePage />,
      },

      // Protected routes for admin
      {
        path: '/admin',
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },

      // Protected routes for user
      {
        path: '/dashboard/:uid',
        element: (
          <UserRoute>
            <DashboardPage />
          </UserRoute>
        ),
      },

      // Protected route for guest role
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

  // Catch-all unknown routes:  
  // Redirect to homepage for unauthenticated users,
  // or to their default page if authenticated.
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
