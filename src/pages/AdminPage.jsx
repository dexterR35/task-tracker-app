
import React from 'react';
import { useSelector } from 'react-redux';

function AdminPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome to the administrative control panel, {user?.name || user?.email}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Management */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">User Management</h2>
            <p className="text-blue-700 text-sm mb-4">Manage user accounts and permissions</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Manage Users
            </button>
          </div>

          {/* System Settings */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-3">System Settings</h2>
            <p className="text-green-700 text-sm mb-4">Configure application settings</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              Settings
            </button>
          </div>

          {/* Analytics */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">Analytics</h2>
            <p className="text-purple-700 text-sm mb-4">View system analytics and reports</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
              View Analytics
            </button>
          </div>

          {/* Task Overview */}
          <div className="bg-orange-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-orange-900 mb-3">Task Overview</h2>
            <p className="text-orange-700 text-sm mb-4">Monitor all user tasks</p>
            <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
              View Tasks
            </button>
          </div>

          {/* System Status */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">System Status</h2>
            <p className="text-gray-700 text-sm mb-4">Monitor system health</p>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">All systems operational</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-indigo-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-indigo-900 mb-3">Quick Stats</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-indigo-700">Total Users:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">Active Tasks:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-700">System Uptime:</span>
                <span className="font-medium">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;