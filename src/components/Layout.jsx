import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { useNavigate, Outlet } from 'react-router-dom';  // <-- import Outlet here

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, role, isAuthenticated, loading } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/', { replace: true });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#222',
        color: 'white',
      }}>
        {isAuthenticated ? (
          <>
            <div>
              <strong>Logged in as:</strong> {user?.name || user?.email} ({role})
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ff4d4f',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <div>Welcome, guest!</div>
        )}
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet />  {/* <-- This renders the child route components */}
      </main>
    </div>
  );
};

export default Layout;
