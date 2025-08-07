import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const ProtectedRoute = ({ children, allowedRoles = ['admin', 'user', 'guest'] }) => {
  const { isAuthenticated, role, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Not authenticated → send to homepage (public)
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Authenticated but role not allowed → send to homepage
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const UserRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'user']}>
    {children}
  </ProtectedRoute>
);

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    // Logged in users should not access login page
    return <Navigate to="/" replace />;
  }

  return children;
};
