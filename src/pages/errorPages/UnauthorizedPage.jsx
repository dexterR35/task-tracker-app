import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Icons } from '@/components/icons';

const UnauthorizedPage = () => {
  const { canAccess } = useAuth();
  
  // Check if user is admin for better messaging
  const isAdmin = canAccess('admin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-6">
            <Icons.buttons.alert className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          
          {/* Error Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isAdmin 
              ? "You don't have permission to access this page. Please contact your administrator."
              : "You don't have permission to access this page. Please check your role and try again."
            }
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Icons.cards.home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
            
            <Link
              to="/"
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <Icons.buttons.back className="h-4 w-4 mr-2" />
              Go to Home
            </Link>
          </div>
          
          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
