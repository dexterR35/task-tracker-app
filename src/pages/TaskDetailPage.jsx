import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import Loader from '@/components/ui/Loader/Loader';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { formatDate } from '@/utils/dateUtils';
import { showError } from '@/utils/toast';
import { Icons } from '@/components/icons';
import { getCardColorHex } from '@/components/Card/cardConfig';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, isLoading, error } = useAppData();
  
  // Get query parameters
  const userId = searchParams.get('user');
  const monthId = searchParams.get('monthId');

  // Find the task in the current tasks data
  const task = tasks?.find(t => t.id === taskId);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading task details..." variant="spinner" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    );
  }

  // Calculate days between start and end dates
  const getDaysBetweenDates = () => {
    const startDate = task.data_task?.startDate;
    const endDate = task.data_task?.endDate;
    
    if (!startDate || !endDate) return 'Unknown';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch {
      return 'Invalid dates';
    }
  };

  const daysBetween = getDaysBetweenDates();

  // Analytics Card Component
  const AnalyticsCard = ({ title, icon, color, data, className = "" }) => {
    const cardColorHex = getCardColorHex(color);
    
    return (
      <div className={`bg-gray-800/50 border border-gray-700/30 rounded-lg p-6 hover:bg-gray-800/70 transition-colors ${className}`}>
        {/* Header */}
        <div className="flex items-center space-x-4 mb-4">
          <div 
            className="p-3 rounded-xl flex items-center justify-center shadow-lg border border-gray-600/30"
            style={{ backgroundColor: `${cardColorHex}20` }}
          >
            {icon && React.createElement(icon, {
              className: "w-6 h-6",
              style: { color: cardColorHex }
            })}
          </div>
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border hover:bg-gray-700/30 transition-colors"
                style={{ 
                  backgroundColor: `${cardColorHex}10`,
                  borderColor: `${cardColorHex}20`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: cardColorHex,
                        background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                      }}
                    ></div>
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {item.value}
                  </span>
                </div>
                
                {/* Show sub-value if available */}
                {item.subValue && (
                  <div className="ml-6 mt-2">
                    <span className="text-xs text-gray-400">{item.subValue}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <span className="text-sm text-gray-500">No data available</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Prepare analytics data
  const basicInfoData = [
    {
      label: "Department",
      value: task.data_task?.departments || 'Not specified'
    },
    {
      label: "Product", 
      value: task.data_task?.products || 'Not specified'
    },
    {
      label: "Markets",
      value: Array.isArray(task.data_task?.markets) 
        ? task.data_task.markets.join(', ') 
        : task.data_task?.markets || 'Not specified'
    },
    {
      label: "Reporter",
      value: task.data_task?.reporterName || 'Not specified'
    }
  ];

  const timeInfoData = [
    {
      label: "Task Hours",
      value: `${task.data_task?.timeInHours || 0} hours`
    },
    {
      label: "AI Hours", 
      value: `${task.data_task?.aiTime || 0} hours`
    },
    {
      label: "Total Hours",
      value: `${(task.data_task?.timeInHours || 0) + (task.data_task?.aiTime || 0)} hours`
    },
    {
      label: "Duration",
      value: daysBetween
    }
  ];

  const datesData = [
    {
      label: "Start Date",
      value: task.data_task?.startDate 
        ? formatDate(task.data_task.startDate, 'dd MMM yyyy', true)
        : 'Not specified'
    },
    {
      label: "End Date",
      value: task.data_task?.endDate 
        ? formatDate(task.data_task.endDate, 'dd MMM yyyy', true)
        : 'Not specified'
    },
    {
      label: "Created At",
      value: task.createdAt 
        ? formatDate(task.createdAt, 'dd MMM yyyy, HH:mm', true)
        : 'Not specified'
    },
    {
      label: "Created By",
      value: task.createdByName || 'Not specified'
    }
  ];

  const aiData = task.data_task?.aiModels && task.data_task.aiModels.length > 0 ? [
    {
      label: "AI Models Used",
      value: Array.isArray(task.data_task.aiModels) 
        ? task.data_task.aiModels.join(', ') 
        : task.data_task.aiModels
    }
  ] : [];

  const deliverablesData = [];
  
  if (task.data_task?.deliverables && task.data_task.deliverables.length > 0) {
    deliverablesData.push({
      label: "Standard Deliverables",
      value: Array.isArray(task.data_task.deliverables) 
        ? task.data_task.deliverables.join(', ') 
        : task.data_task.deliverables
    });
  }
  
  if (task.data_task?.customDeliverables && task.data_task.customDeliverables.length > 0) {
    deliverablesData.push({
      label: "Custom Deliverables",
      value: Array.isArray(task.data_task.customDeliverables) 
        ? task.data_task.customDeliverables.join(', ') 
        : task.data_task.customDeliverables
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <DynamicButton
              onClick={handleGoBack}
              variant="outline"
              size="sm"
              iconName="arrowLeft"
              iconPosition="left"
            >
              Back to Dashboard
            </DynamicButton>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
            <h1 className="text-3xl font-bold">
              {task.data_task?.taskName || 'Unnamed Task'}
            </h1>
            <p className="text-blue-100 mt-2">
              Task ID: {task.id}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {task.isVip && (
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  VIP Task
                </span>
              )}
              {task.reworked && (
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Reworked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Basic Information Card */}
          <AnalyticsCard
            title="Basic Information"
            icon={Icons.generic.task}
            color="blue"
            data={basicInfoData}
          />

          {/* Time Information Card */}
          <AnalyticsCard
            title="Time Information"
            icon={Icons.generic.clock}
            color="green"
            data={timeInfoData}
          />

          {/* Dates Information Card */}
          <AnalyticsCard
            title="Dates & Timeline"
            icon={Icons.generic.calendar}
            color="purple"
            data={datesData}
          />

          {/* AI Information Card */}
          {aiData.length > 0 && (
            <AnalyticsCard
              title="AI Information"
              icon={Icons.generic.ai}
              color="pink"
              data={aiData}
            />
          )}

          {/* Deliverables Card */}
          {deliverablesData.length > 0 && (
            <AnalyticsCard
              title="Deliverables"
              icon={Icons.generic.package}
              color="yellow"
              data={deliverablesData}
            />
          )}
        </div>

        {/* Jira Link Section */}
        {task.data_task?.taskName && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Jira Integration
              </h3>
              <a
                href={`https://gmrd.atlassian.net/browse/${task.data_task.taskName}`}
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
    </div>
  );
};

export default TaskDetailPage;