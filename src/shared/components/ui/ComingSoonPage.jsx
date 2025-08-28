import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/outline';

const ComingSoonPage = ({ 
  title = "Coming Soon", 
  description = "This feature is under development and will be available soon.",
  showHomeLink = true,
  customAction = null 
}) => {
  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
        <div className="mb-6">
          <ClockIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
        </div>
        
        <div className="space-y-3">
          {customAction && (
            <div className="mb-4">
              {customAction}
            </div>
          )}
          
          {showHomeLink && (
            <Link
              to="/"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
