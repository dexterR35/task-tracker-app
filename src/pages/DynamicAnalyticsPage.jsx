import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Icons } from "@/components/icons";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { CARD_SYSTEM } from "@/constants";
import { useAppDataContext } from "@/context/AppDataContext";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import { getWeeksInMonth } from "@/utils/monthUtils";
import SelectField from "@/components/forms/components/SelectField";
import DynamicButton from "@/components/ui/Button/DynamicButton";

// Hardcoded efficiency data for demonstration
const HARDCODED_EFFICIENCY_DATA = {
  averageTaskCompletion: 2.3, // days
  productivityScore: 87, // percentage
  qualityRating: 4.2, // out of 5
  onTimeDelivery: 94, // percentage
  clientSatisfaction: 4.6, // out of 5
};

// Generate real data from useAppData
const generateRealData = (tasks, userName, reporterName, monthId, weekParam = null) => {
  if (!tasks || tasks.length === 0) {
    return {
      totalTasksThisMonth: 0,
      totalTasksMultipleMonths: 0,
      totalHours: 0,
      totalDeliverables: 0,
      totalVariations: 0,
      aiUsed: { total: 0, models: [], time: 0 },
      marketsUsed: [],
      productsUsed: [],
      weeklyTasks: [0, 0, 0, 0, 0, 0, 0],
      dailyHours: [0, 0, 0, 0, 0, 0, 0],
      latestTasks: [],
      efficiency: HARDCODED_EFFICIENCY_DATA,
    };
  }

  // Filter tasks based on parameters
  const filteredTasks = tasks.filter(task => {
    // Filter by month
    if (monthId && monthId !== 'current' && task.monthId !== monthId) return false;
    
    // Filter by user if specified
    if (userName) {
      const userMatch = (
        task.createdByName === userName ||
        task.userName === userName ||
        (task.userUID && task.userUID.includes(userName)) ||
        (task.createbyUID && task.createbyUID.includes(userName))
      );
      if (!userMatch) return false;
    }
    
    // Filter by reporter if specified
    if (reporterName) {
      const reporterMatch = (
        task.data_task?.reporterName === reporterName ||
        task.reporterName === reporterName ||
        (task.data_task?.reporters && task.data_task.reporters === reporterName) ||
        (task.reporterUID && task.reporterUID === reporterName)
      );
      if (!reporterMatch) return false;
    }
    
    // Filter by week if specified
    if (weekParam) {
      try {
        const weekNumber = parseInt(weekParam);
        if (!isNaN(weekNumber)) {
          // Get weeks for the current month
          const weeks = getWeeksInMonth(monthId);
          const week = weeks.find(w => w.weekNumber === weekNumber);
          
          if (week && week.days) {
            // Check if task was created on any day of this week
            const taskDate = task.createdAt;
            if (!taskDate) return false;
            
            // Handle Firestore Timestamp
            let taskDateObj;
            if (taskDate && typeof taskDate === 'object' && taskDate.seconds) {
              taskDateObj = new Date(taskDate.seconds * 1000);
            } else if (taskDate && typeof taskDate === 'object' && taskDate.toDate) {
              taskDateObj = taskDate.toDate();
            } else {
              taskDateObj = new Date(taskDate);
            }
            
            if (isNaN(taskDateObj.getTime())) return false;
            
            const taskDateStr = taskDateObj.toISOString().split('T')[0];
            
            // Check if task date matches any day in the week
            const isInWeek = week.days.some(day => {
              try {
                const dayDate = day instanceof Date ? day : new Date(day);
                if (isNaN(dayDate.getTime())) return false;
                const dayStr = dayDate.toISOString().split('T')[0];
                return dayStr === taskDateStr;
              } catch (error) {
                console.warn('Error processing week day:', error, day);
                return false;
              }
            });
            
            if (!isInWeek) return false;
          }
        }
      } catch (error) {
        console.warn('Error processing week filter:', error);
      }
    }
    
    return true;
  });
  
  // Calculate statistics
  const totalTasksThisMonth = filteredTasks.length;
  const totalHours = filteredTasks.reduce((sum, task) => {
    const hours = task.data_task?.timeInHours || task.timeInHours || 0;
    return sum + (typeof hours === 'number' ? hours : 0);
  }, 0);

  const totalDeliverables = filteredTasks.reduce((sum, task) => {
    const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
    return sum + deliverables.reduce((delSum, del) => {
      return delSum + (del.count || 1);
    }, 0);
  }, 0);

  const totalVariations = filteredTasks.reduce((sum, task) => {
    const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
    return sum + deliverables.reduce((delSum, del) => {
      return delSum + (del.variationsCount || 0);
    }, 0);
  }, 0);

  // AI Usage
  const aiUsed = filteredTasks.reduce((acc, task) => {
    const aiData = task.data_task?.aiUsed || task.aiUsed || [];
    aiData.forEach(ai => {
      acc.total += 1;
      acc.time += ai.aiTime || 0;
      if (ai.aiModels) {
        ai.aiModels.forEach(model => {
          if (!acc.models.includes(model)) {
            acc.models.push(model);
          }
        });
      }
    });
    return acc;
  }, { total: 0, models: [], time: 0 });

  // Category-based data structure
  const marketingData = {};
  const acquisitionData = {};
  const productData = {};
  const miscData = {};
  const aiModelCounts = {};
  
  filteredTasks.forEach(task => {
    const product = task.data_task?.products || task.products || '';
    const markets = task.data_task?.markets || task.markets || [];
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;
    
    if (product) {
      // Determine category and subcategory
      const [category, subcategory] = product.split(' ');
      
      if (category === 'marketing') {
        if (!marketingData[subcategory]) {
          marketingData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        marketingData[subcategory].tasks += 1;
        marketingData[subcategory].hours += timeInHours;
        markets.forEach(market => {
          marketingData[subcategory].markets[market] = (marketingData[subcategory].markets[market] || 0) + 1;
        });
      } else if (category === 'acquisition') {
        if (!acquisitionData[subcategory]) {
          acquisitionData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        acquisitionData[subcategory].tasks += 1;
        acquisitionData[subcategory].hours += timeInHours;
        markets.forEach(market => {
          acquisitionData[subcategory].markets[market] = (acquisitionData[subcategory].markets[market] || 0) + 1;
        });
      } else if (category === 'product') {
        if (!productData[subcategory]) {
          productData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        productData[subcategory].tasks += 1;
        productData[subcategory].hours += timeInHours;
        markets.forEach(market => {
          productData[subcategory].markets[market] = (productData[subcategory].markets[market] || 0) + 1;
        });
      } else if (category === 'misc') {
        if (!miscData[subcategory]) {
          miscData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        miscData[subcategory].tasks += 1;
        miscData[subcategory].hours += timeInHours;
        markets.forEach(market => {
          miscData[subcategory].markets[market] = (miscData[subcategory].markets[market] || 0) + 1;
        });
      }
    }
    
    // Count AI models
    const aiData = task.data_task?.aiUsed || task.aiUsed || [];
    aiData.forEach(ai => {
      if (ai.aiModels) {
        ai.aiModels.forEach(model => {
          aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
        });
      }
    });
  });

  // Calculate totals for each category
  marketingData.totalTasks = Object.values(marketingData).reduce((sum, data) => sum + (data.tasks || 0), 0);
  marketingData.totalHours = Object.values(marketingData).reduce((sum, data) => sum + (data.hours || 0), 0);
  
  acquisitionData.totalTasks = Object.values(acquisitionData).reduce((sum, data) => sum + (data.tasks || 0), 0);
  acquisitionData.totalHours = Object.values(acquisitionData).reduce((sum, data) => sum + (data.hours || 0), 0);
  
  productData.totalTasks = Object.values(productData).reduce((sum, data) => sum + (data.tasks || 0), 0);
  productData.totalHours = Object.values(productData).reduce((sum, data) => sum + (data.hours || 0), 0);
  
  miscData.totalTasks = Object.values(miscData).reduce((sum, data) => sum + (data.tasks || 0), 0);
  miscData.totalHours = Object.values(miscData).reduce((sum, data) => sum + (data.hours || 0), 0);

  // Create legacy arrays for backward compatibility
  const allMarkets = new Set();
  const allProducts = new Set();
  
  // Collect all markets and products from all categories
  Object.values(marketingData).forEach(data => {
    if (data.markets) {
      Object.keys(data.markets).forEach(market => allMarkets.add(market));
    }
  });
  Object.values(acquisitionData).forEach(data => {
    if (data.markets) {
      Object.keys(data.markets).forEach(market => allMarkets.add(market));
    }
  });
  Object.values(productData).forEach(data => {
    if (data.markets) {
      Object.keys(data.markets).forEach(market => allMarkets.add(market));
    }
  });
  Object.values(miscData).forEach(data => {
    if (data.markets) {
      Object.keys(data.markets).forEach(market => allMarkets.add(market));
    }
  });
  
  // Add products from all categories
  Object.keys(marketingData).forEach(key => {
    if (key !== 'totalTasks' && key !== 'totalHours') {
      allProducts.add(`marketing ${key}`);
    }
  });
  Object.keys(acquisitionData).forEach(key => {
    if (key !== 'totalTasks' && key !== 'totalHours') {
      allProducts.add(`acquisition ${key}`);
    }
  });
  Object.keys(productData).forEach(key => {
    if (key !== 'totalTasks' && key !== 'totalHours') {
      allProducts.add(`product ${key}`);
    }
  });
  Object.keys(miscData).forEach(key => {
    if (key !== 'totalTasks' && key !== 'totalHours') {
      allProducts.add(`misc ${key}`);
    }
  });
  
  const marketsUsed = Array.from(allMarkets);
  const productsUsed = Array.from(allProducts);

  // Calculate weekly tasks and hours based on actual dates
  const weeklyTasks = [0, 0, 0, 0, 0, 0, 0]; // Monday to Sunday
  const dailyHours = [0, 0, 0, 0, 0, 0, 0]; // Monday to Sunday
  
  filteredTasks.forEach(task => {
    // Get task date - try different possible date fields
    const taskDate = task.data_task?.startDate || 
                    task.data_task?.endDate || 
                    task.createdAt || 
                    task.timestamp;
    
    const date = new Date(taskDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Convert to our array index (Monday = 0, Sunday = 6)
    const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Count tasks
    weeklyTasks[arrayIndex]++;
    
    // Add hours
    const hours = task.data_task?.timeInHours || task.timeInHours || 0;
    dailyHours[arrayIndex] += typeof hours === 'number' ? hours : 0;
  });

  // Round daily hours to 1 decimal for display
  const roundedDailyHours = dailyHours.map(hours => Math.round(hours * 10) / 10);


  // Latest 5 tasks with Jira links
  const latestTasks = filteredTasks
    .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
    .slice(0, 5)
    .map(task => ({
      id: task.id,
      name: task.data_task?.taskName || task.taskName || 'Unnamed Task',
      status: task.data_task?.reworked ? 'reworked' : 'completed',
      hours: task.data_task?.timeInHours || task.timeInHours || 0,
      jiraLink: task.data_task?.jiraLink || task.jiraLink,
      createdAt: task.createdAt || task.timestamp,
      reporter: task.data_task?.reporterName || task.reporterName,
      user: task.createdByName || task.userName,
    }));

  return {
    totalTasksThisMonth,
    totalTasksMultipleMonths: totalTasksThisMonth * 3, // Estimate
    totalHours,
    totalDeliverables,
    totalVariations,
    aiUsed,
    marketingData,
    acquisitionData,
    productData,
    miscData,
    marketsUsed,
    productsUsed,
    aiModelCounts,
    weeklyTasks: weeklyTasks,
    dailyHours: roundedDailyHours,
    latestTasks,
    efficiency: HARDCODED_EFFICIENCY_DATA,
  };
};


const DynamicAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Set up form with React Hook Form
  const { register, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      weekSelect: '' // Default to "All Weeks"
    }
  });
  
  // Watch the week selection
  const selectedWeekValue = watch('weekSelect');
  // Extract URL parameters
  const userName = searchParams.get('user');
  const reporterName = searchParams.get('reporter');
  const monthId = searchParams.get('month') || 'current';
  const weekParam = searchParams.get('week');
  
  
  // Use real data from context
  const { tasks, isLoading, error, loadingStates, monthId: contextMonthId } = useAppDataContext();
  
  // Manage data ready state to prevent flickering
  useEffect(() => {
    if (!isLoading && !loadingStates?.isInitialLoading && tasks) {
      // Small delay to ensure data is fully processed
      const timer = setTimeout(() => {
        setIsDataReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsDataReady(false);
    }
  }, [isLoading, loadingStates?.isInitialLoading, tasks]);
  
  // Use actual monthId from context if 'current' is specified
  const actualMonthId = monthId === 'current' ? contextMonthId : monthId;
  
  // Generate real data based on parameters
  const analyticsData = !tasks ? null : generateRealData(tasks, userName, reporterName, actualMonthId, weekParam);
  
  // Create analytics cards using centralized system
  const analyticsCards = createCards({ 
    ...analyticsData, 
    userName, 
    reporterName,
    monthId: actualMonthId,
    tasks,
  }, 'analytics');
  
  // Create daily task cards using centralized system
  const dailyTaskCards = createCards(analyticsData, 'daily');
  
  // Helper function to convert Firestore Timestamp to Date
  const convertToDate = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        // Firestore Timestamp: {seconds: number, nanoseconds: number}
        return new Date(timestamp.seconds * 1000);
      } else if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        // Firestore Timestamp with toDate method
        return timestamp.toDate();
      } else {
        // Regular Date string or Date object
        return new Date(timestamp);
      }
    } catch (error) {
      console.warn('Error converting timestamp to date:', error, timestamp);
      return null;
    }
  };

  
  // Determine page title
  const pageTitle = (() => {
    const weekInfo = weekParam ? ` - Week ${weekParam}` : "";
    
    if (userName && reporterName) {
      return `Analytics: ${userName} & ${reporterName}${weekInfo}`;
    } else if (userName) {
      return `User Analytics: ${userName}${weekInfo}`;
    } else if (reporterName) {
      return `Reporter Analytics: ${reporterName}${weekInfo}`;
    }
    return `Analytics Overview${weekInfo}`;
  })();
  
  // Show loading state with skeleton cards - use data ready state to prevent flickering
  const shouldShowLoading = !isDataReady;
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-96 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          
          {/* Analytics Cards Grid Skeleton */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
          
          {/* Daily Task Cards Grid Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-700 rounded w-80 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading analytics data: {error.message}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 >{pageTitle}</h2>
              <p className="text-gray-400">
                {userName && reporterName 
                  ? ` Analytics for user ${userName} and reporter ${reporterName}`
                  : userName 
                    ? ` Metrics for user ${userName}`
                    : reporterName
                      ? `Reporter analysis for ${reporterName}`
                      : 'Overall system analytics'
                }
              </p>
            </div>
            <DynamicButton
              onClick={() => navigate(-1)}
              variant="primary"
              size="md"
              iconName="back"
              iconCategory="buttons"
              iconPosition="left"
            >
              Go Back
            </DynamicButton>
          </div>
        </div>
        
        {/* Analytics Cards Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {analyticsCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>
        </div>
        
        {/* Daily Task Cards Grid */}
        <div className="mb-6">
          <h3 className="mb-6">Weekly Task (Monday-Friday)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dailyTaskCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>
        </div>
        
        {/* Tasks by Week Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl ">Tasks by Week</h2>
            <div className="w-64">
              <SelectField
                field={{
                  name: 'weekSelect',
                  label: '',
                  options: [
                    { value: '', label: 'All Weeks' },
                    ...getWeeksInMonth(actualMonthId).map(week => ({
                      value: week.weekNumber.toString(),
                      label: `Week ${week.weekNumber}`
                    }))
                  ]
                }}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            </div>
          </div>
          {/* no task */}
          <div className="space-y-6">
            {(() => {
              if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium mb-1">No Tasks</p>
                      <p className="text-sm">No tasks found for this month</p>
                    </div>
                  </div>
                );
              }
 {/* no task */}
              // Get weeks for the current month
              const weeks = getWeeksInMonth(actualMonthId);
              if (!weeks || weeks.length === 0) {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No weeks available for this month</p>
                  </div>
                );
              }

              // If no week is selected (All Weeks), show all weeks
              if (!selectedWeekValue || selectedWeekValue === '') {
                // Show all weeks
                return weeks.map((week) => {
                  // Get tasks for this week
                  const weekTasks = [];
                  week.days.forEach(day => {
                    try {
                      const dayDate = day instanceof Date ? day : new Date(day);
                      if (isNaN(dayDate.getTime())) return;
                      
                      const dayStr = dayDate.toISOString().split('T')[0];
                      const dayTasks = tasks.filter(task => {
                        if (!task.createdAt) return false;
                        
                        const taskDate = convertToDate(task.createdAt);
                        if (!taskDate || isNaN(taskDate.getTime())) return false;
                        
                        const taskDateStr = taskDate.toISOString().split('T')[0];
                        const dateMatch = taskDateStr === dayStr;
                        
                        // Also filter by user if userName is specified
                        const userMatch = !userName || 
                          (task.createdByName && task.createdByName.toLowerCase().includes(userName.toLowerCase())) ||
                          (task.data_task?.createdByName && task.data_task.createdByName.toLowerCase().includes(userName.toLowerCase()));
                        
                        // Also filter by reporter if reporterName is specified
                        const reporterMatch = !reporterName || 
                          (task.data_task?.reporterName && task.data_task.reporterName.toLowerCase().includes(reporterName.toLowerCase()));
                        
                        return dateMatch && userMatch && reporterMatch;
                      });
                      
                      weekTasks.push(...dayTasks);
                    } catch (error) {
                      console.warn('Error processing day:', error, day);
                    }
                  });

                  return (
                    <div key={week.weekNumber} className="bg-primary rounded-lg p-6 border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Week {week.weekNumber}</h3>
                          <p className="text-sm text-gray-400">
                            {(() => {
                              try {
                                const startDate = week.startDate ? new Date(week.startDate).toLocaleDateString() : 'Invalid';
                                const endDate = week.endDate ? new Date(week.endDate).toLocaleDateString() : 'Invalid';
                                return `${startDate} - ${endDate}`;
                              } catch (error) {
                                console.warn('Error formatting week dates:', error, week);
                                return 'Invalid dates';
                              }
                            })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">{weekTasks.length}</div>
                          <div className="text-sm text-gray-400">tasks</div>
                        </div>
                      </div>
                      
                      {weekTasks.length > 0 ? (
                        <div className="space-y-3">
                          {weekTasks.map((task, index) => (
                            <div key={task.id || index} className="flex items-center justify-between p-3 bg-smallCard rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: task.data_task?.reworked ? '#dc2626' : // crimson for reworked
                                                  task.data_task?.completed ? '#f59e0b' : // amber for completed
                                                  '#10b981' // green for active
                                  }}
                                ></div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-white">
                                    {task.data_task?.taskName ? (
                                      <a 
                                        href={`https://gmrd.atlassian.net/browse/${task.data_task.taskName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                      >
                                        {task.data_task.taskName}
                                      </a>
                                    ) : (
                                      task.data_task?.title || 'Untitled Task'
                                    )}
                                  </span>
                                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                                    <span>Reporter: {task.data_task?.reporters || task.reporterName || 'N/A'}</span>
                                    <span>•</span>
                                    <span>Hours: {task.data_task?.timeInHours || task.timeInHours || 0}h</span>
                                    <span>•</span>
                                    <span>Dept: {task.data_task?.departments ? 
                                      (Array.isArray(task.data_task.departments) ? 
                                        task.data_task.departments.join(', ') : 
                                        task.data_task.departments) : 
                                      'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-white">
                                    {task.createdByName || task.userName || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {(() => {
                                      if (!task.createdAt) return 'No date';
                                      const date = convertToDate(task.createdAt);
                                      if (!date || isNaN(date.getTime())) return 'Invalid date';
                                      return date.toLocaleDateString();
                                    })()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">
                                    Markets: {task.data_task?.markets?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    HR: {task.data_task?.timeInHours || task.timeInHours || 0}h
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm">No tasks for this week</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              }

              // Show only the selected week
              const weekNumber = parseInt(selectedWeekValue);
              const week = weeks.find(w => w.weekNumber === weekNumber);
                // Get tasks for this week
                const weekTasks = [];
                week.days.forEach(day => {
                  try {
                    const dayDate = day instanceof Date ? day : new Date(day);
                    if (isNaN(dayDate.getTime())) return;
                    
                    const dayStr = dayDate.toISOString().split('T')[0];
                    const dayTasks = tasks.filter(task => {
                      if (!task.createdAt) return false;
                      
                      const taskDate = convertToDate(task.createdAt);
                      if (!taskDate || isNaN(taskDate.getTime())) return false;
                      
                      const taskDateStr = taskDate.toISOString().split('T')[0];
                      const dateMatch = taskDateStr === dayStr;
                      
                      // Also filter by user if userName is specified
                      if (userName && dateMatch) {
                        const userMatch = (
                          task.createdByName === userName ||
                          task.userName === userName ||
                          (task.userUID && task.userUID.includes(userName)) ||
                          (task.createbyUID && task.createbyUID.includes(userName))
                        );
                        if (!userMatch) return false;
                      }
                      
                      // Also filter by reporter if reporterName is specified
                      if (reporterName && dateMatch) {
                        const reporterMatch = (
                          task.data_task?.reporterName === reporterName ||
                          task.reporterName === reporterName ||
                          (task.data_task?.reporters && task.data_task.reporters === reporterName) ||
                          (task.reporterUID && task.reporterUID === reporterName)
                        );
                        if (!reporterMatch) return false;
                      }
                      
                      return dateMatch;
                    });
                    weekTasks.push(...dayTasks);
                  } catch (error) {
                    console.warn('Error processing day:', error, day);
                  }
                });

                return (
                  <div key={week.weekNumber} className="card rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Week {week.weekNumber}</h3>
                        <p className="text-sm text-gray-400">
                          {(() => {
                            try {
                              const startDate = week.startDate ? new Date(week.startDate).toLocaleDateString() : 'Invalid';
                              const endDate = week.endDate ? new Date(week.endDate).toLocaleDateString() : 'Invalid';
                              return `${startDate} - ${endDate}`;
                            } catch (error) {
                              console.warn('Error formatting week dates:', error, week);
                              return 'Invalid dates';
                            }
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">{weekTasks.length}</div>
                        <div className="text-sm text-gray-400">tasks</div>
                      </div>
                    </div>
                    
                    {weekTasks.length > 0 ? (
                      <div className="space-y-3">
                        {weekTasks.map((task, index) => (
                          <div key={task.id || index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: task.data_task?.reworked ? '#dc2626' : // crimson for reworked
                                                task.data_task?.completed ? '#f59e0b' : // amber for completed
                                                '#10b981' // green for active
                                }}
                              ></div>
                              <div className="flex flex-col">
                                <span className="font-medium text-white">
                                  {task.data_task?.taskName ? (
                                    <a 
                                      href={`https://gmrd.atlassian.net/browse/${task.data_task.taskName}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-300 hover:text-blue-500 underline cursor-pointer"
                                    >
                                      {task.data_task.taskName}
                                    </a>
                                  ) : (
                                    task.data_task?.title || 'Untitled Task'
                                  )}
                                </span>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  <span>Reporter: {task.data_task?.reporters || task.reporterName || 'N/A'}</span>
                                  <span>•</span>
                                  <span>Hours: {task.data_task?.timeInHours || task.timeInHours || 0}h</span>
                                  <span>•</span>
                                  <span>Dept: {task.data_task?.departments ? 
                                    (Array.isArray(task.data_task.departments) ? 
                                      task.data_task.departments.join(', ') : 
                                      task.data_task.departments) : 
                                    'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-sm font-medium text-white">
                                  {task.createdByName || task.userName || 'Unknown User'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {(() => {
                                    if (!task.createdAt) return 'No date';
                                    const date = convertToDate(task.createdAt);
                                    if (!date || isNaN(date.getTime())) return 'Invalid date';
                                    return date.toLocaleDateString();
                                  })()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-400">
                                  Markets: {task.data_task?.markets?.length || 0}
                                </div>
                                <div className="text-xs text-gray-400">
                                  HR: {task.data_task?.timeInHours || task.timeInHours || 0}h
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-sm">No tasks for this week</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
            })()}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DynamicAnalyticsPage;
