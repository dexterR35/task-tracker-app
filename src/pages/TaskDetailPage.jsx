import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { useDeliverableCalculation, calculateSingleDeliverable, formatDeliverableDisplay, formatDeclinariDisplay, formatTimeBreakdown } from '@/hooks/useDeliverableCalculation';
import Loader from '@/components/ui/Loader/Loader';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { formatDate } from '@/utils/dateUtils';
import { showError } from '@/utils/toast';
import { Icons } from '@/components/icons';
import { getCardColorHex } from '@/components/Card/cardConfig';
import { calculateDeliverableTime, formatTimeEstimate } from '@/features/tasks/config/useTaskForm';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tasks, isLoading, error } = useAppData();
  const { deliverablesOptions } = useDeliverablesOptions();
  
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

  // Analytics Card Component matching dashboard format
  const AnalyticsCard = ({ title, icon, color, data, className = "" }) => {
    const cardColorHex = getCardColorHex(color);
    
    return (
      <div className={`bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-800/70 transition-colors ${className}`}>
        {/* Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div 
            className="p-2 rounded-lg flex items-center justify-center shadow-lg border border-gray-600/30"
            style={{ backgroundColor: `${cardColorHex}20` }}
          >
            {icon && React.createElement(icon, {
              className: "w-4 h-4",
              style: { color: cardColorHex }
            })}
          </div>
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>

        {/* Content - Matching dashboard card format */}
        <div className="space-y-2">
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border hover:bg-gray-700/30 transition-colors"
                style={{ 
                  backgroundColor: `${cardColorHex}10`,
                  borderColor: `${cardColorHex}20`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full p-1"
                      style={{ 
                        backgroundColor: cardColorHex,
                        padding: '4px',
                        background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                      }}
                    ></div>
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Show badges for all data values with card color */}
                    {Array.isArray(item.value) ? (
                      <div className="flex flex-wrap gap-1">
                        {item.value.map((value, badgeIndex) => (
                          <div
                            key={badgeIndex}
                            className="px-2 py-1 rounded text-xs font-semibold text-white"
                            style={{ backgroundColor: cardColorHex }}
                          >
                            {value}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: cardColorHex }}
                      >
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Show hours value if available */}
                {item.hoursValue && (
                  <div className="ml-4 mt-1">
                    <span className="text-xs text-gray-500">total hrs {item.hoursValue}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-3">
              <span className="text-xs text-gray-500">No data available</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Prepare analytics data with comprehensive task information
  const basicInfoData = [
    {
      label: "Task Name",
      value: task.data_task?.taskName || 'Unnamed Task'
    },
    {
      label: "Department",
      value: (() => {
        const departments = task.data_task?.departments;
        if (!departments) return 'Not specified';
        return Array.isArray(departments) ? departments.join(', ') : departments;
      })()
    },
    {
      label: "Products", 
      value: Array.isArray(task.data_task?.products) 
        ? task.data_task.products
        : task.data_task?.products ? [task.data_task.products] : ['Not specified']
    },
    {
      label: "Reporter",
      value: task.data_task?.reporterName || 'Not specified'
    },
    {
      label: "User",
      value: task.data_task?.userName || task.userName || 'Not specified'
    },
    {
      label: "AI Models",
      value: Array.isArray(task.data_task?.aiModels) 
        ? task.data_task.aiModels
        : task.data_task?.aiModels ? [task.data_task.aiModels] : ['Not specified']
    }
  ];

  // Use the centralized deliverable calculation hook
  const { deliverablesList, totalTime, totalMinutes, totalDays } = useDeliverableCalculation(
    task.data_task?.deliverablesUsed, 
    deliverablesOptions
  );
  
  // Calculate deliverables time first
  const deliverablesData = [];
  let totalCalculatedTime = totalTime;
  let daysCalculation = '';
  
  // Enhanced deliverables processing for new data structure
  if (deliverablesList.length > 0) {
    // Process each deliverable using the hook results
    deliverablesList.forEach((deliverable, index) => {
      const deliverableName = deliverable.name;
      const deliverableCount = deliverable.quantity;
      
      if (deliverable.configured) {
        
        deliverablesData.push({
          label: `Deliverable ${index + 1}`,
          value: deliverableName,
          subValue: `${deliverableCount}x${deliverableName}${deliverable.declinariQuantity > 0 ? ` + ${deliverable.declinariQuantity} declinari` : ''}`
        });
        
        deliverablesData.push({
          label: `Count`,
          value: `${deliverableCount} units`
        });
        
        deliverablesData.push({
          label: `Time per Unit`,
          value: `${deliverable.timePerUnit} ${deliverable.timeUnit}${deliverable.declinariQuantity > 0 ? ` + ${deliverable.declinariQuantity}x × ${deliverable.declinariTime} ${deliverable.declinariTimeUnit} declinari` : ''}`
        });
        
        deliverablesData.push({
          label: `Calculation`,
          value: `${deliverable.timeInHours.toFixed(1)}h × ${deliverableCount} = ${(deliverable.timeInHours * deliverableCount).toFixed(1)}h${deliverable.declinariQuantity > 0 ? ` + ${deliverable.declinariQuantity}x × ${deliverable.declinariTime}${deliverable.declinariTimeUnit} = ${deliverable.totalDeclinariTime.toFixed(3)}h` : ''} = ${deliverable.time.toFixed(1)}h`
        });
        
        deliverablesData.push({
          label: `Total Time`,
          value: `${deliverable.time.toFixed(1)} hours (${(deliverable.time * 60).toFixed(0)} minutes, ${(deliverable.time / 8).toFixed(2)} days)`
        });
        
        deliverablesData.push({
          label: `---`,
          value: `---`
        });
      } else {
        // If deliverable not found in settings, show basic info
        deliverablesData.push({
          label: `Deliverable ${index + 1}`,
          value: deliverableName
        });
        
        deliverablesData.push({
          label: `Count`,
          value: `${deliverableCount} units`
        });
        
        deliverablesData.push({
          label: `Time per Unit`,
          value: '⚠️ Not configured in settings - Add to Settings → Deliverables'
        });
        
        deliverablesData.push({
          label: `---`,
          value: `---`
        });
      }
    });
    
    // Add comprehensive total calculation using hook results
    const timeBreakdown = formatTimeBreakdown(totalCalculatedTime);
    daysCalculation = `${timeBreakdown.days} days`;
    
    deliverablesData.push({
      label: "=== TOTAL CALCULATION ===",
      value: "---"
    });
    
    deliverablesData.push({
      label: "Total Hours",
      value: `${timeBreakdown.hours} hours`
    });
    
    deliverablesData.push({
      label: "Total Minutes", 
      value: `${timeBreakdown.minutes} minutes`
    });
    
    deliverablesData.push({
      label: "Total Days (8hr/day)",
      value: daysCalculation
    });
    
    // Add the exact format you requested
    deliverablesData.push({
      label: "SUMMARY",
      value: timeBreakdown.summary
    });
  }
  
  // Handle declinari deliverables separately
  if (task.data_task?.declinariDeliverables && Object.keys(task.data_task.declinariDeliverables).length > 0) {
    deliverablesData.push({
      label: "DECLINARI DELIVERABLES",
      value: "---"
    });
    
    Object.entries(task.data_task.declinariDeliverables).forEach(([name, data]) => {
      deliverablesData.push({
        label: `Declinari: ${name}`,
        value: `${data.count} units`
      });
    });
  }
  
  if (deliverablesData.length === 0) {
    deliverablesData.push({
      label: "No deliverables available",
      value: "No deliverables processed"
    });
    
    if (task.data_task?.deliverablesUsed) {
      deliverablesData.push({
        label: "deliverablesUsed",
        value: JSON.stringify(task.data_task.deliverablesUsed)
      });
    }
    
    if (task.data_task?.declinariDeliverables) {
      deliverablesData.push({
        label: "declinariDeliverables",
        value: JSON.stringify(task.data_task.declinariDeliverables)
      });
    }
    
    if (task.data_task?.deliverableQuantities) {
      deliverablesData.push({
        label: "deliverableQuantities",
        value: JSON.stringify(task.data_task.deliverableQuantities)
      });
    }
  }
  
  // Handle legacy array format (backward compatibility)
  if (task.data_task?.deliverables && Array.isArray(task.data_task.deliverables) && task.data_task.deliverables.length > 0 && deliverablesOptions) {
    const deliverableData = task.data_task.deliverables[0];
    const deliverableName = deliverableData.deliverableName;
    const deliverableQuantities = deliverableData.deliverableQuantities || {};
    const declinariQuantities = deliverableData.declinariQuantities || {};
    const declinariDeliverables = deliverableData.declinariDeliverables || {};
    
    const deliverable = deliverablesOptions.find(d => d.value === deliverableName);
    if (deliverable) {
      const quantity = deliverableQuantities[deliverableName] || 1;
      const calculatedTime = calculateDeliverableTime(deliverable, quantity, declinariQuantities);
      totalCalculatedTime = calculatedTime;
      
      deliverablesData.push({
        label: "Deliverable",
        value: deliverable.label,
        subValue: `${quantity}x${deliverable.label}${declinariQuantity > 0 ? ` + ${declinariQuantity} declinari` : ''}`
      });
      
      if (deliverable.requiresQuantity) {
        deliverablesData.push({
          label: "Quantity",
          value: `${quantity} units`
        });
      }
      
      // Add declinari information if present
      const declinariQuantity = declinariQuantities[task.data_task.deliverables] || 0;
      if (declinariQuantity > 0) {
        deliverablesData.push({
          label: "Declinari",
          value: `${declinariQuantity} units (10 min/unit)`
        });
      }
      
      deliverablesData.push({
        label: "Time per Unit",
        value: `${deliverable.timePerUnit} ${deliverable.timeUnit}`
      });
      
      deliverablesData.push({
        label: "Total Time",
        value: `${calculatedTime.toFixed(1)} hours`
      });
      
      // Calculate days (8 hours per day)
      const days = calculatedTime / 8;
      daysCalculation = `${days.toFixed(1)} days (${calculatedTime.toFixed(1)} hours ÷ 8 hours/day)`;
      deliverablesData.push({
        label: "Duration",
        value: daysCalculation
      });
    }
  }

  // Calculate total hours properly
  const taskHours = task.data_task?.timeInHours || 0;
  const aiHours = task.data_task?.aiTime || 0;
  const deliverablesHours = totalCalculatedTime;
  const totalHours = taskHours + aiHours + deliverablesHours;

  const timeInfoData = [
    {
      label: "Task Hours",
      value: `${taskHours} hours`
    },
    {
      label: "AI Hours", 
      value: `${aiHours} hours`
    },
    {
      label: "Deliverables Time",
      value: `${deliverablesHours.toFixed(1)} hours`
    },
    {
      label: "Total Hours",
      value: `${totalHours.toFixed(1)} hours`
    },
    {
      label: "Duration",
      value: daysBetween
    },
    {
      label: "Daily Breakdown",
      value: daysCalculation || 'No deliverables calculated'
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
      label: "Duration",
      value: daysBetween
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
    },
    {
      label: "Month",
      value: task.monthId || 'Not specified'
    }
  ];

  const aiData = [];
  
  // Add AI models if available
  if (task.data_task?.aiModels && task.data_task.aiModels.length > 0) {
    aiData.push({
      label: "AI Models Used",
      value: Array.isArray(task.data_task.aiModels) 
        ? task.data_task.aiModels.join(', ') 
        : task.data_task.aiModels
    });
  }
  
  // Add AI time if available
  if (task.data_task?.aiTime && task.data_task.aiTime > 0) {
    aiData.push({
      label: "AI Time",
      value: `${task.data_task.aiTime} hours`
    });
  }
  
  // Add AI enabled flag
  if (task.data_task?.usedAIEnabled !== undefined) {
    aiData.push({
      label: "AI Enabled",
      value: task.data_task.usedAIEnabled ? 'Yes' : 'No'
    });
  }

  // Task status and additional information
  const statusData = [
    {
      label: "Task Status",
      value: task.isVip ? 'VIP Task' : 'Regular Task'
    },
    {
      label: "Reworked",
      value: task.reworked ? 'Yes' : 'No'
    },
    {
      label: "Task ID",
      value: task.id || 'Not specified'
    },
    {
      label: "Month ID",
      value: task.monthId || 'Not specified'
    },
    {
      label: "User UID",
      value: task.userUID || 'Not specified'
    }
  ];

  
  // Handle legacy single string format (backward compatibility)
  if (task.data_task?.deliverables && typeof task.data_task.deliverables === 'string' && deliverablesOptions) {
    const deliverable = deliverablesOptions.find(d => d.value === task.data_task.deliverables);
    if (deliverable) {
      const quantity = task.data_task.deliverableQuantities?.[task.data_task.deliverables] || 1;
      const declinariQuantities = task.data_task.declinariQuantities || {};
      const declinariDeliverables = task.data_task.declinariDeliverables || {};
      const calculatedTime = calculateDeliverableTime(deliverable, quantity, declinariQuantities);
      totalCalculatedTime = calculatedTime;
      
      deliverablesData.push({
        label: "Deliverable",
        value: deliverable.label
      });
      
      if (quantity > 1) {
        deliverablesData.push({
          label: "Quantity",
          value: `${quantity}x`
        });
      }
      
      const declinariQuantity = declinariQuantities[task.data_task.deliverables] || 0;
      if (declinariQuantity > 0) {
        deliverablesData.push({
          label: "Declinari Quantity",
          value: `${declinariQuantity}x`
        });
      }
      
      if (calculatedTime > 0) {
        deliverablesData.push({
          label: "Time per Unit",
          value: formatTimeEstimate(deliverable, 1)
        });
        
        deliverablesData.push({
          label: "Total Time",
          value: `${calculatedTime.toFixed(1)} hours`
        });
        
        const days = calculatedTime / 8;
        daysCalculation = `${days.toFixed(1)} days`;
        deliverablesData.push({
          label: "Duration",
          value: daysCalculation
        });
      }
    }
  }
  
  // Handle legacy array format deliverables (backward compatibility)
  if (task.data_task?.deliverables && Array.isArray(task.data_task.deliverables) && !task.data_task.deliverables[0]?.deliverableName) {
    deliverablesData.push({
      label: "Deliverables",
      value: task.data_task.deliverables.join(', ')
    });
    
    // Show quantities if available
    if (task.data_task.deliverableQuantities) {
      const quantitiesText = Object.entries(task.data_task.deliverableQuantities)
        .map(([deliverable, qty]) => `${deliverable}: ${qty}x`)
        .join(', ');
      deliverablesData.push({
        label: "Quantities",
        value: quantitiesText
      });
    }
  }
  
  // Handle custom deliverables (when "others" is selected)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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


          {/* Deliverables Card */}
          {deliverablesData.length > 0 && (
            <AnalyticsCard
              title="Deliverables"
              icon={Icons.generic.package}
              color="yellow"
              data={deliverablesData}
            />
          )}

          {/* Task Status Card */}
          <AnalyticsCard
            title="Task Status"
            icon={Icons.generic.info}
            color="indigo"
            data={statusData}
          />
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