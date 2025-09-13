import React from "react";
import { useAppDataContext } from "@/components/layout/AuthLayout";
import AdminPageHeader from "@/components/layout/AdminPageHeader";

const AdminDashboardPage = () => {
  // Get all data from AuthLayout context (pre-fetched data, no API calls!)
  const { monthId, monthName, boardExists } = useAppDataContext();

  const rightContent = (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="text-white text-sm font-medium">Current Month</div>
      <div className="text-blue-200 text-lg font-semibold">{monthName}</div>
      <div className="text-white text-sm font-medium mt-2">Board Status</div>
      <div className={`text-lg font-bold ${boardExists ? 'text-green-300' : 'text-red-300'}`}>
        {boardExists ? "✅ Active" : "❌ Not Generated"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Overview and management controls for all users"
        icon="🏠"
        gradient="from-indigo-900 via-blue-900 to-purple-900"
        rightContent={rightContent}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Welcome to Admin Dashboard
            </h2>
            <p className="text-gray-400 mb-4">
              Manage users, reporters, and tasks across your organization. All administrative functions are centralized here for easy access.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">📊 Quick Stats</h3>
                <p className="text-gray-300 text-sm">
                  Current month: <span className="font-semibold text-blue-400">{monthName}</span>
                </p>
                <p className="text-gray-300 text-sm">
                  Board status: <span className={`font-semibold ${boardExists ? 'text-green-400' : 'text-red-400'}`}>
                    {boardExists ? 'Active' : 'Not Generated'}
                  </span>
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">🔧 Admin Controls</h3>
                <p className="text-gray-300 text-sm">
                  Month board management is handled globally in the top notification bar.
                </p>
                <p className="text-gray-300 text-sm">
                  Use the navigation menu to access specific management pages.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer">
                <h3 className="text-lg font-semibold text-white mb-2">👥 User Management</h3>
                <p className="text-blue-100 text-sm">
                  Manage user accounts, roles, and permissions
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 hover:from-green-700 hover:to-green-800 transition-all duration-200 cursor-pointer">
                <h3 className="text-lg font-semibold text-white mb-2">📊 Reporter Management</h3>
                <p className="text-green-100 text-sm">
                  Create and manage reporter assignments
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 hover:from-purple-700 hover:to-purple-800 transition-all duration-200 cursor-pointer">
                <h3 className="text-lg font-semibold text-white mb-2">✅ Task Management</h3>
                <p className="text-purple-100 text-sm">
                  View and manage all tasks across the organization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
