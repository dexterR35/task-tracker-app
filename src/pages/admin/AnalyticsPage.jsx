import React from "react";
import AdminPageHeader from "@/components/layout/AdminPageHeader";

const AnalyticsPage = () => {
  return (

      <div>
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Data insights and performance metrics for your organization
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-300 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Coming Soon</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">🚀</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-300 dark:border-gray-700 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Analytics Dashboard Coming Soon
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
              We're working on a comprehensive analytics dashboard that will provide insights into task completion, user productivity, and organizational performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Task Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Track task completion rates, time spent, and productivity metrics
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Insights</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Analyze user activity, performance, and engagement patterns
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Performance Reports</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Generate detailed reports and visualizations for stakeholders
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
   
  );
};

export default AnalyticsPage;
