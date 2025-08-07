import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRedirectHandler = () => {
  const { isAuthenticated, role, user, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) return;

    // Redirect ONLY if user is logged in AND on root "/" or "/login"
    if (
      isAuthenticated &&
      (location.pathname === '/' || location.pathname === '/login')
    ) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'user') {
        navigate(`/dashboard/${user.uid}`, { replace: true });
      } else if (role === 'guest') {
        navigate('/guest', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, role, user, initialized, location.pathname, navigate]);

  return null;
};

export default AuthRedirectHandler;
