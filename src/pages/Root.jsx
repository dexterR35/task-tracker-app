import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Root() {
  const { currentUser, userRole } = useAuth();
  const location = useLocation();

  // Prevent navigation loops by checking the current location
  if (location.pathname === '/login') {
    return <Navigate to="/" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'Admin' && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />;
  }

  if (userRole !== 'Admin' && location.pathname !== `/dashboard/${currentUser.uid}`) {
    return <Navigate to={`/dashboard/${currentUser.uid}`} replace />;
  }

  return null;
}
