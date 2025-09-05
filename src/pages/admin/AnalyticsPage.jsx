import React from "react";
import { useSelector } from "react-redux";
import { useAuth } from "@/features/auth";
import { usersApi } from "@/features/users/usersApi";
import { reportersApi } from "@/features/reporters/reportersApi";
import { tasksApi } from "@/features/tasks/tasksApi";
import { selectCurrentMonthId, selectCurrentMonthName } from "@/features/currentMonth";
import { Loader } from "@/components/ui";

const AnalyticsPage = () => {
  const { user, canAccess } = useAuth();
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);

  // Get data from RTK Query cache
  const usersResult = useSelector(usersApi.endpoints.getUsers.select());
  const reportersResult = useSelector(reportersApi.endpoints.getReporters.select());
  
  // Get tasks data
  const tasksResult = useSelector((state) => {
    const tasksQuery = Object.values(state.tasksApi.queries).find(query => 
      query?.endpointName === 'subscribeToMonthTasks' && query?.data?.tasks
    );
    return tasksQuery;
  });

  const users = usersResult?.data || [];
  const reporters = reportersResult?.data || [];
  const tasksData = tasksResult?.data || { tasks: [] };
  const tasks = tasksData.tasks || [];

  const isLoading = usersResult?.isLoading || reportersResult?.isLoading || tasksResult?.isLoading || false;
  const error = usersResult?.error || reportersResult?.error || tasksResult?.error || null;

  // Check if user is admin
  if (!canAccess('admin')) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400">You need admin permissions to view analytics.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading analytics..." 
        fullScreen={true}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Analytics</h2>
          <p className="text-gray-400">
            {error?.message || "Failed to load analytics data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalUsers = users.length;
  const totalReporters = reporters.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  // Tasks by user
  const tasksByUser = tasks.reduce((acc, task) => {
    const userId = task.reporterId || task.userId;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {});

  // Tasks by market
  const tasksByMarket = tasks.reduce((acc, task) => {
    if (task.markets && Array.isArray(task.markets)) {
      task.markets.forEach(market => {
        acc[market] = (acc[market] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // Tasks by product
  const tasksByProduct = tasks.reduce((acc, task) => {
    if (task.product) {
      acc[task.product] = (acc[task.product] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Analytics Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">
          Analytics for {monthName || 'current month'} ({monthId})
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Reporters</p>
              <p className="text-2xl font-bold text-white">{totalReporters}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📝</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-white">{totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📋</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Completed Tasks</p>
              <p className="text-2xl font-bold text-white">{completedTasks}</p>
              <p className="text-xs text-gray-400">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks by User */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by User</h3>
          <div className="space-y-3">
            {Object.entries(tasksByUser)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([userId, count]) => {
                const user = users.find(u => (u.userUID || u.id) === userId);
                return (
                  <div key={userId} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user?.name || user?.email || userId}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white">{count}</div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tasks by Market */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Market</h3>
          <div className="space-y-3">
            {Object.entries(tasksByMarket)
              .sort(([,a], [,b]) => b - a)
              .map(([market, count]) => (
                <div key={market} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                  <div className="text-sm font-medium text-white capitalize">{market}</div>
                  <div className="text-sm font-bold text-white">{count}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Tasks by Product */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Product</h3>
          <div className="space-y-3">
            {Object.entries(tasksByProduct)
              .sort(([,a], [,b]) => b - a)
              .map(([product, count]) => (
                <div key={product} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                  <div className="text-sm font-medium text-white">{product}</div>
                  <div className="text-sm font-bold text-white">{count}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Task Status Overview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Task Status Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="text-sm font-medium text-white">Completed</div>
              </div>
              <div className="text-sm font-bold text-white">{completedTasks}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="text-sm font-medium text-white">Pending</div>
              </div>
              <div className="text-sm font-bold text-white">{pendingTasks}</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="text-sm font-medium text-white">In Progress</div>
              </div>
              <div className="text-sm font-bold text-white">{totalTasks - completedTasks - pendingTasks}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
