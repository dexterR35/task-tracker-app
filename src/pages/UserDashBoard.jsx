import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

function UserDashboard() {
  const { uid } = useParams();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.email}!</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Create New Task
              </button>
              <button className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors">
                View All Tasks
              </button>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-green-900 mb-3">Task Statistics</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Total Tasks:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Completed:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">In Progress:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Pending:</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-purple-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">Recent Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-700">No recent activity</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-gray-50 p-6 rounded-lg md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Profile Information</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <span className="ml-2 text-gray-600">{uid}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">{user?.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">{user?.name || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Member Since:</span>
                <span className="ml-2 text-gray-600">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;


