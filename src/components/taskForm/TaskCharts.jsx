import React from 'react';
import { useGetMonthTasksQuery } from '../../redux/services/tasksApi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from '../../hooks/useImports';
import LoadingWrapper from '../ui/LoadingWrapper';

const TaskCharts = ({ monthId }) => {
  const { data: tasks = [], isLoading } = useGetMonthTasksQuery({ monthId });

  const sumBy = (items, key) => {
    const map = new Map();
    for (const t of items) {
      const k = t[key];
      if (!k) continue;
      const prev = map.get(k) || 0;
      map.set(k, prev + (Number(t.timeInHours) || 0));
    }
    const arr = Array.from(map.entries()).map(([label, hours]) => ({ label, hours }));
    arr.sort((a, b) => b.hours - a.hours);
    return arr.slice(0, 8);
  };

  const marketsArr = sumBy(tasks, 'market');
  const productsArr = sumBy(tasks, 'product');

  const marketData = marketsArr.map(a => ({
    name: a.label,
    hours: Math.round(a.hours * 10) / 10,
  }));

  const productData = productsArr.map(a => ({
    name: a.label,
    hours: Math.round(a.hours * 10) / 10,
  }));

  // Check if there are any tasks
  const hasTasks = tasks && tasks.length > 0;

  return (
    <LoadingWrapper loading={isLoading} skeleton="chart">
      {!hasTasks ? (
        <div className="col-span-full p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-600 font-medium">
              No tasks found for the selected month.
            </span>
          </div>
          <p className="text-gray-800 text-sm mt-1">
            Please create some tasks before viewing charts.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Market chart */}
          <div className="p-4 bg-primary border rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Market</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={marketData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product chart */}
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Hours by Product</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={productData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </LoadingWrapper>
  );
};

export default TaskCharts;
