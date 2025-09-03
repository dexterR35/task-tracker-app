import React from "react";
import { useSelector } from "react-redux";
import { useFetchData } from "@/hooks/useFetchData.js";
import { selectCurrentMonthId, selectCurrentMonthName } from "@/features/currentMonth";

const AnalyticsPage = () => {
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const { user } = useFetchData();

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">
          View detailed analytics and insights for {monthName || 'current month'} ({monthId})
        </p>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-400 mb-6">
          We're working on building comprehensive analytics and reporting features.
          This will include detailed insights, trends, and performance metrics.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• Performance metrics and KPIs</p>
          <p>• Trend analysis and forecasting</p>
          <p>• Custom report generation</p>
          <p>• Data export capabilities</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
