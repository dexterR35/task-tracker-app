import React from "react";
import AdminPageHeader from "@/components/layout/AdminPageHeader";

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader
        title="Analytics Dashboard"
        subtitle="Data insights and performance metrics for your organization"
        icon="analytics"
        gradient="from-orange-900 via-red-900 to-pink-900"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Section */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Analytics Dashboard Coming Soon
            </h2>
            <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
              We're working on a comprehensive analytics dashboard that will provide insights into task completion, user productivity, and organizational performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">Task Analytics</h3>
                <p className="text-gray-300 text-sm">
                  Track task completion rates, time spent, and productivity metrics
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">User Insights</h3>
                <p className="text-gray-300 text-sm">
                  Analyze user activity, performance, and engagement patterns
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="text-lg font-semibold text-white mb-2">Performance Reports</h3>
                <p className="text-gray-300 text-sm">
                  Generate detailed reports and visualizations for stakeholders
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
