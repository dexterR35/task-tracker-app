import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DynamicButton from '../components/DynamicButton';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  PlusIcon, 
  ViewColumnsIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { isAuthenticated, user, role, logout } = useAuth();

  if (isAuthenticated) {
    const displayName = user?.name || user?.email || 'User';
    const userRole = role || 'user';
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600 mb-6">
            You're logged in as a <span className="font-medium capitalize text-blue-600">{userRole}</span>.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {role === 'admin' && (
                  <Link to="/admin">
                    <DynamicButton
                      variant="primary"
                      icon={ChartBarIcon}
                      className="w-full"
                    >
                      Go to Admin Panel
                    </DynamicButton>
                  </Link>
                )}
                
                <Link to="/dashboard">
                  <DynamicButton
                    variant="success"
                    icon={ViewColumnsIcon}
                    className="w-full"
                  >
                    View Dashboard
                  </DynamicButton>
                </Link>

                {role === 'admin' && (
                  <Link to="/manage-users">
                    <DynamicButton
                      variant="secondary"
                      icon={UserGroupIcon}
                      className="w-full"
                    >
                      Manage Users
                    </DynamicButton>
                  </Link>
                )}
              </div>
            </div>            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Account Info</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {user?.email || 'N/A'}</p>
                <p><span className="font-medium">Role:</span> {userRole}</p>
                <p><span className="font-medium">User ID:</span> {user?.uid || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Task Tracker
              </h1>
              <p className="text-gray-600 mb-8">
                Manage your tasks efficiently with AI-powered insights
              </p>
              <Link to="/login">
                <DynamicButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Sign In to Get Started
                </DynamicButton>
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
};

export default HomePage;
