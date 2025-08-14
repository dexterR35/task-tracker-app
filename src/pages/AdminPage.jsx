import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUsersForAnalytics, fetchTasksForAnalytics, calculateAnalytics } from '../redux/slices/adminSlice';
import DynamicButton from '../components/DynamicButton';
import { 
  UserGroupIcon, 
  ChartBarIcon, 
  DocumentDuplicateIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function AdminPage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    // Fetch data for analytics
    dispatch(fetchUsersForAnalytics());
    dispatch(fetchTasksForAnalytics());
  }, [dispatch]);

  useEffect(() => {
    // Calculate analytics when data is loaded
    if (!loading.fetchUsersForAnalytics && !loading.fetchTasksForAnalytics) {
      dispatch(calculateAnalytics());
    }
  }, [loading.fetchUsersForAnalytics, loading.fetchTasksForAnalytics, dispatch]);

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'Create, edit, and manage user accounts',
      to: '/manage-users',
      icon: UserGroupIcon,
      variant: 'primary'
    },
    {
      title: 'View Dashboard',
      description: 'Access the main dashboard with task creation',
      to: '/dashboard',
      icon: DocumentDuplicateIcon,
      variant: 'success'
    },
    {
      title: 'Analytics',
      description: 'View system analytics and reports',
      to: '/admin/analytics',
      icon: ChartBarIcon,
      variant: 'secondary'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.name}. Manage your system and view analytics.
        </p>
      </div>

      {/* Quick Stats */}
      {analytics?.userStats && analytics?.taskStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.userStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <DocumentDuplicateIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.taskStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CpuChipIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Usage</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round((analytics.taskStats.aiUsageStats.withAI / analytics.taskStats.total) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rework Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(analytics.taskStats.reworkRate)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminActions.map((action, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <action.icon className="h-8 w-8 text-gray-600" />
              <h3 className="ml-3 text-lg font-semibold text-gray-900">{action.title}</h3>
            </div>
            <p className="text-gray-600 mb-4">{action.description}</p>
            <Link to={action.to}>
              <DynamicButton
                variant={action.variant}
                className="w-full"
              >
                {action.title}
              </DynamicButton>
            </Link>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        
        {loading.fetchUsersForAnalytics || loading.fetchTasksForAnalytics ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        ) : analytics?.userStats && analytics?.taskStats ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">User Statistics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Total Users: {analytics.userStats.total}</li>
                <li>Admins: {analytics.userStats.admins}</li>
                <li>Regular Users: {analytics.userStats.users}</li>
                <li>Recently Joined: {analytics.userStats.recentlyJoined}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Task Analytics</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Total Tasks: {analytics.taskStats.total}</li>
                <li>With AI: {analytics.taskStats.aiUsageStats.withAI}</li>
                <li>Avg Completion Time: {Math.round(analytics.taskStats.averageCompletionTime * 10) / 10}h</li>
                <li>Rework Rate: {Math.round(analytics.taskStats.reworkRate)}%</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No analytics data available yet.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;