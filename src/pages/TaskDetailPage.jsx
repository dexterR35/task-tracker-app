import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import Loader from '@/components/ui/Loader/Loader';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { formatDate, normalizeTimestamp } from '@/utils/dateUtils';
import { differenceInDays } from 'date-fns';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUserAdmin = user?.role === 'admin';
  const { tasks, isLoading } = useAppData();
  
  // Get query parameters
  const userId = searchParams.get('user');
  const monthId = searchParams.get('monthId');

  // Find the task in the current tasks data
  const task = tasks?.find(t => t.id === taskId);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  // Determine what to show
  const shouldShowLoading = isLoading;
  const shouldShowNotFound = !isLoading && !task;

  // Calculate days between start and end dates
  const getDaysBetweenDates = () => {
    if (!task || !task.data_task) return 'Unknown';
    
    const startDate = task.data_task?.startDate;
    const endDate = task.data_task?.endDate;
    
    if (!startDate || !endDate) return 'Unknown';
    
    try {
      // Use date utilities for consistent date handling
      const start = normalizeTimestamp(startDate);
      const end = normalizeTimestamp(endDate);
      
      if (!start || !end) return 'Invalid dates';
      
      // Use date-fns for accurate day calculation
      const diffDays = differenceInDays(end, start);
      return `${Math.abs(diffDays)} days`;
    } catch {
      return 'Invalid dates';
    }
  };

  const daysBetween = getDaysBetweenDates();

  // Helper function to format array values
  const formatArrayValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'Not specified';
  };

  // Helper function to format JSON values
  const formatJsonValue = (value) => {
    if (value && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value || 'None';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {shouldShowLoading ? (
        <div className="flex items-center justify-center">
          <Loader size="lg" text="Loading task details..." variant="spinner" />
        </div>
      ) : shouldShowNotFound ? (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Task Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The requested task could not be found.</p>
            <DynamicButton
              onClick={handleGoBack}
              variant="primary"
              size="md"
              iconName="arrowLeft"
              iconPosition="left"
            >
              Back to Dashboard
            </DynamicButton>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <DynamicButton
                onClick={handleGoBack}
                variant="secondary"
                size="sm"
                iconName="arrowLeft"
                iconPosition="left"
              >
                Back to Dashboard
              </DynamicButton>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
              <h1 className="text-3xl font-bold">
                {task?.data_task?.taskName || 'Unnamed Task'}
              </h1>
              <p className="text-blue-100 mt-2">
                Task ID: {task?.id}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {task?.isVip && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    VIP Task
                  </span>
                )}
                {task?.reworked && (
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Reworked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Task Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Basic Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.taskName || 'Unnamed Task'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.id || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Department:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatArrayValue(task?.data_task?.departments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Products:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatArrayValue(task?.data_task?.products)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Markets:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatArrayValue(task?.data_task?.markets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reporter:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.reporterName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.userName || task?.userName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">User UID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.userUID || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Time Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{daysBetween}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task Hours:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.timeInHours || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.aiTime || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Hours:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{(task?.data_task?.timeInHours || 0) + (task?.data_task?.aiTime || 0)} hours</span>
                </div>
              </div>
            </div>

            {/* AI Information Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Models:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatArrayValue(task?.data_task?.aiModels)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Time:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.aiTime || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Enabled:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.data_task?.usedAIEnabled ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Deliverables Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Deliverables</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deliverables Used:</span>
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    {formatJsonValue(task?.data_task?.deliverablesUsed)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Custom Deliverables:</span>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {formatArrayValue(task?.data_task?.customDeliverables)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deliverable Quantities:</span>
                  <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    {formatJsonValue(task?.data_task?.deliverableQuantities)}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Timeline Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dates & Timeline</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task?.data_task?.startDate ? formatDate(task.data_task.startDate, 'dd MMM yyyy', true) : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task?.data_task?.endDate ? formatDate(task.data_task.endDate, 'dd MMM yyyy', true) : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created At:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task?.createdAt ? formatDate(task.createdAt, 'dd MMM yyyy, HH:mm', true) : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Created By:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.createdByName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Month ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.monthId || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Task Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task Status:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.isVip ? 'VIP Task' : 'Regular Task'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reworked:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.reworked ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Task ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.id || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Month ID:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{task?.monthId || 'Not specified'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Jira Link Section */}
          {task?.data_task?.taskName && (
            <div className="mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Jira Integration
                </h3>
                <a
                  href={`https://gmrd.atlassian.net/browse/${task?.data_task?.taskName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Jira
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;