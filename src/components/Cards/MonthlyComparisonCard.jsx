import React, { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SkeletonAnalyticsCard } from "../ui/Skeleton/Skeleton";

const MonthlyComparisonCard = ({ selectedMonth, isLoading = false }) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Generate last 6 months for comparison
  const getLastMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthId = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ monthId, monthName });
    }
    
    return months;
  };

  const monthsToFetch = getLastMonths();

  // Fetch data for each month
  const monthQueries = monthsToFetch.map(month => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useGetMonthTasksQuery({
      monthId: month.monthId,
      userId: undefined, // Get all users for admin
      role: 'admin',
      userData: user
    });
  });

  // Process data when all queries are complete
  useEffect(() => {
    const allQueriesComplete = monthQueries.every(query => !query.isLoading);
    
    if (allQueriesComplete) {
      const processedData = monthsToFetch.map((month, index) => {
        const tasks = monthQueries[index].data || [];
        
        // Filter tasks by department
        const acqTasks = tasks.filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.includes('acquisition');
        });
        
        const marketingTasks = tasks.filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.includes('marketing');
        });
        
        const prodTasks = tasks.filter(task => {
          const products = task.data_task?.products || task.products;
          return products && products.includes('product');
        });

        // Calculate totals
        const acqTotalHours = acqTasks.reduce((sum, task) => {
          const hours = task.data_task?.timeInHours || task.timeInHours || 0;
          return sum + (parseFloat(hours) || 0);
        }, 0);

        const marketingTotalHours = marketingTasks.reduce((sum, task) => {
          const hours = task.data_task?.timeInHours || task.timeInHours || 0;
          return sum + (parseFloat(hours) || 0);
        }, 0);

        const prodTotalHours = prodTasks.reduce((sum, task) => {
          const hours = task.data_task?.timeInHours || task.timeInHours || 0;
          return sum + (parseFloat(hours) || 0);
        }, 0);

        return {
          month: month.monthName,
          'ACQ Tasks': acqTasks.length,
          'Marketing Tasks': marketingTasks.length,
          'Production Tasks': prodTasks.length,
          'ACQ Hours': Math.round(acqTotalHours * 10) / 10,
          'Marketing Hours': Math.round(marketingTotalHours * 10) / 10,
          'Production Hours': Math.round(prodTotalHours * 10) / 10,
        };
      });

      setChartData(processedData);
      setIsLoadingData(false);
    }
  }, [monthQueries, monthsToFetch]);

  // Show skeleton if loading
  if (isLoading || isLoadingData) {
    return <SkeletonAnalyticsCard className="col-span-2" />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card-large col-span-2">
        <h2 className="card-title text-xl mb-6">Monthly Department Comparison</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-large col-span-2">
      <h2 className="card-title text-xl mb-6">Monthly Department Comparison</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks by Department</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f9fafb'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ACQ Tasks" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Marketing Tasks" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Production Tasks" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hours Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hours by Department</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#f9fafb'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ACQ Hours" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Marketing Hours" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Production Hours" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">6-Month Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Tasks/Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Hours/Month
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {['ACQ', 'Marketing', 'Production'].map((dept) => {
                const taskKey = `${dept} Tasks`;
                const hourKey = `${dept} Hours`;
                const totalTasks = chartData.reduce((sum, month) => sum + (month[taskKey] || 0), 0);
                const totalHours = chartData.reduce((sum, month) => sum + (month[hourKey] || 0), 0);
                const avgTasks = (totalTasks / chartData.length).toFixed(1);
                const avgHours = (totalHours / chartData.length).toFixed(1);

                return (
                  <tr key={dept}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {dept}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {avgTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {avgHours}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonCard;
