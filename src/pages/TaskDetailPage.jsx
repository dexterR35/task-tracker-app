import React, { useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAppDataContext } from '@/context/AppDataContext';
import { SkeletonCard, SkeletonHeader } from '@/components/ui/Skeleton/Skeleton';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import SmallCard from '@/components/Card/smallCards/SmallCard';
import { formatDate, normalizeTimestamp } from '@/utils/dateUtils';
import { differenceInDays } from 'date-fns';
import { Icons } from '@/components/icons';
import { CARD_SYSTEM } from '@/constants';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUserAdmin = user?.role === 'admin';
  const { tasks, isLoading } = useAppDataContext();
  
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

  // Create task detail cards using SmallCard pattern
  const taskDetailCards = useMemo(() => {
    if (!task) return [];

    const totalHours = (task?.data_task?.timeInHours || 0) + (task?.data_task?.aiTime || 0);
    
    return [
      {
        id: 'task-basic-info',
        title: 'Basic Information',
        subtitle: 'Task Details',
        description: 'Core task information',
        icon: Icons.generic.task,
        color: 'blue',
        value: task?.data_task?.taskName || 'Unnamed Task',
        badge: {
          text: task?.isVip ? 'VIP' : 'Regular',
          color: task?.isVip ? 'amber' : 'blue'
        },
        details: [
          {
            label: 'Task ID',
            value: task?.id || 'Not specified'
          },
          {
            label: 'Department',
            value: formatArrayValue(task?.data_task?.departments)
          },
          {
            label: 'Products',
            value: formatArrayValue(task?.data_task?.products)
          },
          {
            label: 'Markets',
            value: formatArrayValue(task?.data_task?.markets)
          },
          {
            label: 'Reporter',
            value: task?.data_task?.reporterName || 'Not specified'
          },
          {
            label: 'User',
            value: task?.createdByName || task?.data_task?.userName || task?.userName || 'Not specified'
          }
        ]
      },
      {
        id: 'task-time-info',
        title: 'Time Information',
        subtitle: 'Duration & Hours',
        description: 'Time tracking details',
        icon: Icons.generic.clock,
        color: 'green',
        value: `${totalHours}h`,
        badge: {
          text: daysBetween,
          color: 'green'
        },
        details: [
          {
            label: 'Task Hours',
            value: `${task?.data_task?.timeInHours || 0}h`
          },
          {
            label: 'AI Time',
            value: `${task?.data_task?.aiTime || 0}h`
          },
          {
            label: 'Total Hours',
            value: `${totalHours}h`
          },
          {
            label: 'Duration',
            value: daysBetween
          }
        ]
      },
      {
        id: 'task-ai-info',
        title: 'AI Information',
        subtitle: 'AI Usage',
        description: 'Artificial intelligence details',
        icon: Icons.generic.chart,
        color: 'purple',
        value: task?.data_task?.aiTime || 0,
        badge: {
          text: task?.data_task?.usedAIEnabled ? 'Enabled' : 'Disabled',
          color: task?.data_task?.usedAIEnabled ? 'green' : 'red'
        },
        details: [
          {
            label: 'AI Models',
            value: formatArrayValue(task?.data_task?.aiModels)
          },
          {
            label: 'AI Time',
            value: `${task?.data_task?.aiTime || 0}h`
          },
          {
            label: 'AI Enabled',
            value: task?.data_task?.usedAIEnabled ? 'Yes' : 'No'
          }
        ]
      },
      {
        id: 'task-deliverables',
        title: 'Deliverables',
        subtitle: 'Task Deliverables',
        description: 'Deliverable information',
        icon: Icons.generic.deliverable,
        color: 'amber',
        value: task?.data_task?.deliverablesUsed?.length || 0,
        badge: {
          text: `${task?.data_task?.deliverablesUsed?.length || 0} items`,
          color: 'amber'
        },
        details: [
          {
            label: 'Deliverables Used',
            value: task?.data_task?.deliverablesUsed?.length || 0
          },
          {
            label: 'Custom Deliverables',
            value: formatArrayValue(task?.data_task?.customDeliverables)
          },
          {
            label: 'Deliverable Quantities',
            value: task?.data_task?.deliverableQuantities ? 'Configured' : 'Not set'
          }
        ]
      },
      {
        id: 'task-dates',
        title: 'Dates & Timeline',
        subtitle: 'Task Timeline',
        description: 'Date information',
        icon: Icons.generic.calendar,
        color: 'crimson',
        value: task?.data_task?.startDate ? formatDate(task.data_task.startDate, 'dd MMM yyyy', true) : 'Not set',
        badge: {
          text: task?.data_task?.endDate ? formatDate(task.data_task.endDate, 'dd MMM yyyy', true) : 'Not set',
          color: 'crimson'
        },
        details: [
          {
            label: 'Start Date',
            value: task?.data_task?.startDate ? formatDate(task.data_task.startDate, 'dd MMM yyyy', true) : 'Not specified'
          },
          {
            label: 'End Date',
            value: task?.data_task?.endDate ? formatDate(task.data_task.endDate, 'dd MMM yyyy', true) : 'Not specified'
          },
          {
            label: 'Created At',
            value: task?.createdAt ? formatDate(task.createdAt, 'MMM dd, yyyy HH:mm', true) : 'Not specified'
          },
          {
            label: 'Created By',
            value: task?.createdByName || 'Not specified'
          },
          {
            label: 'Month ID',
            value: task?.monthId || 'Not specified'
          }
        ]
      },
      {
        id: 'task-status',
        title: 'Task Status',
        subtitle: 'Status Information',
        description: 'Task status details',
        icon: Icons.generic.check,
        color: 'green',
        value: task?.reworked ? 'Reworked' : 'Original',
        badge: {
          text: task?.reworked ? 'Reworked' : 'Original',
          color: task?.reworked ? 'amber' : 'green'
        },
        details: [
          {
            label: 'Task Status',
            value: task?.isVip ? 'VIP Task' : 'Regular Task'
          },
          {
            label: 'Reworked',
            value: task?.reworked ? 'Yes' : 'No'
          },
          {
            label: 'Task ID',
            value: task?.id || 'Not specified'
          },
          {
            label: 'Month ID',
            value: task?.monthId || 'Not specified'
          }
        ]
      }
    ];
  }, [task, daysBetween]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {shouldShowLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <SkeletonHeader />

          {/* Task Detail Cards Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <SkeletonCard key={index} className="h-80" />
            ))}
          </div>
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
              
              {/* Jira Button */}
              {task?.data_task?.taskName && (
                <DynamicButton
                  onClick={() => window.open(`https://gmrd.atlassian.net/browse/${task.data_task.taskName}`, '_blank')}
                  variant="primary"
                  size="sm"
                  iconName="externalLink"
                  iconPosition="right"
                >
                  Open in Jira
                </DynamicButton>
              )}
            </div>
            
            {/* Task Header - No gradient, clean design */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {task?.data_task?.taskName || 'Unnamed Task'}
              </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                Task ID: {task?.id}
              </p>
                </div>
                <div className="flex flex-wrap gap-2">
                {task?.isVip && (
                    <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium">
                    VIP Task
                  </span>
                )}
                {task?.reworked && (
                    <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium">
                    Reworked
                  </span>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Task Detail Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskDetailCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;