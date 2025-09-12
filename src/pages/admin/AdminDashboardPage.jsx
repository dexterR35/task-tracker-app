import React from "react";
import { useAppDataContext } from "@/components/layout/AuthLayout";

const AdminDashboardPage = () => {
  // Get all data from AuthLayout context (pre-fetched data, no API calls!)
  const { monthId, monthName, boardExists } = useAppDataContext();

  return (
    <div className="mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard - All Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {monthName
              ? `${monthName} - ${new Date().getFullYear()}`
              : "Current Month"}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Board Status</h3>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {boardExists ? "Active" : "Not Generated"}
          </p>
        </div>
      </div>

      {/* Month board warning and generation is now handled by AuthLayout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Admin Controls
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Month board management is now handled globally in the top notification bar.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
