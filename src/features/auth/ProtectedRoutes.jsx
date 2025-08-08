import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children, allowedRoles = ['admin', 'user', 'guest'] }) => {
  const { isAuthenticated, role, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading.fetchCurrentUser) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;

export const UserRoute = ({ children, allowedRoles = ['admin', 'user'] }) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>
);

export const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading.fetchCurrentUser) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
