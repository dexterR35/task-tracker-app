import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthRedirectHandler = () => {
  const { isAuthenticated, role, user, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading.fetchCurrentUser) return;

    if (!isAuthenticated) return;

    // Redirect users on login based on role:
    if (location.pathname === '/login' || location.pathname === '/') {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'user') navigate(`/dashboard/${user.uid}`, { replace: true });
      else if (role === 'guest') navigate('/guest', { replace: true });
    }
  }, [isAuthenticated, role, user, location, navigate, loading]);

  return null;
};

export default AuthRedirectHandler;
