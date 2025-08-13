
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

function AdminPage() {
  const { user } = useSelector((state) => state.auth);

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'Create, edit, and manage user accounts',
      to: '/manage-users',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'View All Tasks',
      description: 'Monitor and manage all tasks across the system',
      to: '/admin/tasks',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      to: '/admin/analytics',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      to: '/admin/settings',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-xl text-gray-600">
          Welcome back, {user?.name || user?.email}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">2</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">📋</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Tasks</h3>
              <p className="text-2xl font-bold text-green-600">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">📊</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 font-bold text-lg">⚙️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <p className="text-lg font-semibold text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminActions.map((action, index) => (
            <Link
              key={index}
              to={action.to}
              className={`${action.color} ${action.hoverColor} text-white p-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-semibold">{action.title}</h3>
              </div>
              <p className="text-white/90">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;