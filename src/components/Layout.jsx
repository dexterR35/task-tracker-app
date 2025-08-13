import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import PageLoader from './PageLoader';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, role, isAuthenticated, loading } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isLoading = Object.values(loading).some(Boolean);

  if (isLoading) return <PageLoader message="Initializing app..." />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TT</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Task Tracker</span>
              </Link>
            </div>

            {/* Navigation */}
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                {role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {role === 'user' && (
                  <Link 
                    to={`/dashboard/${user?.uid}`} 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
              </nav>
            )}

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">TT</span>
              </div>
              <span className="text-gray-600 text-sm">© 2025 Task Tracker. All rights reserved.</span>
            </div>
            
            <div className="flex space-x-6 text-sm text-gray-600">
              <span>Version 1.0.0</span>
              {isAuthenticated && (
                <span>
                  Logged in as <span className="font-medium">{role}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
