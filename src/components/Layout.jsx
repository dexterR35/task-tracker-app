import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { beginLoading, endLoading } from '../redux/slices/loadingSlice';
import { useAuth } from '../hooks/useAuth';
import DynamicButton from './DynamicButton';
import GlobalLoader from './GlobalLoader';
import { 
  HomeIcon, 
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon 
} from '@heroicons/react/24/outline';

const Layout = () => {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, logout, loading, listenerActive } = useAuth();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      dispatch(beginLoading());
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      dispatch(endLoading());
    }
  };

  // Global loader overlay for auth listener boot
  const isBooting = !listenerActive && loading.initListener;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ViewColumnsIcon },
  // Manage Users removed
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalLoader />
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  Task Tracker
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <span className="text-sm text-gray-700">
                  {user?.name || user?.email}
                </span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {role}
                </span>
              </div>
              
              <DynamicButton
                id="logout-nav-btn"
                variant="outline"
                size="sm"
                icon={ArrowRightOnRectangleIcon}
                onClick={handleLogout}
                successMessage="Logged out successfully"
              >
                Logout
              </DynamicButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        {isBooting ? <div className="flex items-center justify-center py-24 text-gray-500 text-sm">Initializing…</div> : <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
