import React, { useState, useEffect, useMemo } from "react";
import { useAppData } from "@/hooks/useAppData";
import CategoryBreakdownCard from "@/components/Cards/CategoryBreakdownCard";
import ProductBreakdownCard from "@/components/Cards/ProductBreakdownCard";

const AnalyticsPage = () => {
  const { tasks = [], isLoading } = useAppData();
  const [selectedMonth, setSelectedMonth] = useState("");

  // Get unique months from tasks
  const availableMonths = useMemo(() => {
    const months = new Set();
    tasks.forEach(task => {
      if (task.createdAt) {
        const date = new Date(task.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort().reverse();
  }, [tasks]);

  // Set default month to most recent
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Task breakdown by acquisition, product, and marketing
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">All Time</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="space-y-6">
        <CategoryBreakdownCard tasks={tasks} selectedMonth={selectedMonth} />
        <ProductBreakdownCard tasks={tasks} selectedMonth={selectedMonth} />
      </div>
    </div>
  );
};

export default AnalyticsPage;