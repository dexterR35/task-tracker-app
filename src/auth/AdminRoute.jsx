import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}