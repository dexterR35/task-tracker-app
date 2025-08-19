import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import DynamicButton from './DynamicButton';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  const isBooting = !listenerActive && loading.initListener;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const navigation = [
    ...(role === 'admin'
      ? [
          { name: 'Admin', href: '/admin', icon: ViewColumnsIcon },
          { name: 'Analytics', href: '/admin/analytics', icon: ViewColumnsIcon },
          { name: 'Users', href: '/admin/users', icon: ViewColumnsIcon },
        ]
      : [{ name: 'My Dashboard', href: '/me', icon: ViewColumnsIcon }]),
    { name: 'Profile', href: '/profile', icon: ViewColumnsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

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

      {/* Main content with soft skeleton overlay */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        {isBooting && (
          <div className="space-y-6">
            <Skeleton height={32} width={256} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton height={96} />
              <Skeleton height={96} />
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
