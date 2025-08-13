import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HomePage = () => {
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-gray-600 mb-6">
            You're logged in as a <span className="font-medium capitalize text-blue-600">{role}</span>.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Actions</h2>
              <div className="space-y-3">
                {role === 'admin' && (
                  <Link 
                    to="/admin"
                    className="block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition-colors"
                  >
                    Go to Admin Panel
                  </Link>
                )}
                {role === 'user' && (
                  <Link 
                    to={`/dashboard/${user?.uid}`}
                    className="block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Account Info</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Role:</span> {role}</p>
                <p><span className="font-medium">User ID:</span> {user?.uid}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white rounded-lg shadow-sm p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Task Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Organize your tasks efficiently with our powerful task management system.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <p className="text-gray-500">
            Please log in to access your tasks and dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
