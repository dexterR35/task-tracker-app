import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Icons } from "@/components/icons";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { CARD_SYSTEM } from "@/constants";
import { useAppData } from "@/hooks/useAppData";
import { createAnalyticsCards, createDailyTaskCards } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";

// Hardcoded efficiency data for demonstration
const HARDCODED_EFFICIENCY_DATA = {
  averageTaskCompletion: 2.3, // days
  productivityScore: 87, // percentage
  qualityRating: 4.2, // out of 5
  onTimeDelivery: 94, // percentage
  clientSatisfaction: 4.6, // out of 5
};

// Generate real data from useAppData
const generateRealData = (tasks, userName, reporterName, monthId) => {
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
        (task.data_task?.reporters && task.data_task.reporters.includes(reporterName)) ||
        (task.reporterUID && task.reporterUID.includes(reporterName))
      );
      if (!reporterMatch) return false;
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

  console.log('🔍 Weekly Data Debug:', {
    totalTasks: tasks.length,
    filteredTasks: filteredTasks.length,
    userName,
    reporterName,
    monthId,
    weeklyTasks: weeklyTasks,
    dailyHours: roundedDailyHours,
    sampleTaskDates: filteredTasks.slice(0, 3).map(task => ({
      startDate: task.data_task?.startDate,
      endDate: task.data_task?.endDate,
      createdAt: task.createdAt,
      timestamp: task.timestamp
    }))
  });

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
  
  // Extract URL parameters
  const userName = searchParams.get('user');
  const reporterName = searchParams.get('reporter');
  const monthId = searchParams.get('month') || 'current';
  
  // Use real data from useAppData hook
  const { tasks, isLoading, error, loadingStates } = useAppData();
  
  // Generate real data based on parameters
  const analyticsData = useMemo(() => {
    if (!tasks) return null;
    return generateRealData(tasks, userName, reporterName, monthId);
  }, [tasks, userName, reporterName, monthId]);
  
  // Create analytics cards using centralized system
  const analyticsCards = useMemo(() => {
    return createAnalyticsCards({ ...analyticsData, userName, reporterName });
  }, [analyticsData, userName, reporterName]);
  
  // Create daily task cards using centralized system
  const dailyTaskCards = useMemo(() => {
    return createDailyTaskCards(analyticsData);
  }, [analyticsData]);
  
  // Determine page title
  const pageTitle = useMemo(() => {
    if (userName && reporterName) {
      return `Analytics: ${userName} & ${reporterName}`;
    } else if (userName) {
      return `User Analytics: ${userName}`;
    } else if (reporterName) {
      return `Reporter Analytics: ${reporterName}`;
    }
    return 'Analytics Overview';
  }, [userName, reporterName]);
  
  // Show loading state with skeleton cards - wait for data to be fully ready
  const shouldShowLoading = isLoading || loadingStates?.isInitialLoading || !tasks || !analyticsData;
  
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{pageTitle}</h1>
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
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Icons.buttons.back className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
        
        {/* Analytics Cards Grid */}
        <div className="mb-8">
          {/* <h2 className="text-xl font-semibold mb-4">Performance Overview</h2> */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {analyticsCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>
        </div>
        
        {/* Daily Task Cards Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Weekly Task Distribution (Monday-Friday)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dailyTaskCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>
        </div>
        
        {/* Latest Tasks Section */}
        {analyticsData.latestTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Latest 5 Tasks Added</h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="space-y-3">
                {analyticsData.latestTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: task.status === 'completed' ? '#f59e0b' : // amber
                                        task.status === 'reworked' ? '#dc2626' : // crimson
                                        '#64748b' // gray
                        }}
                      ></div>
                      <div className="flex flex-col">
                        {(() => {
                          const jiraLink = task.jiraLink || (task.name && task.name.match(/GIMODEAR-\d+/))?.[0];
                          const fullJiraUrl = jiraLink ? 
                            (jiraLink.startsWith('http') ? jiraLink : `https://gmrd.atlassian.net/browse/${jiraLink}`) : 
                            null;
                          
                          return fullJiraUrl ? (
                            <a
                              href={fullJiraUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-400 hover:text-blue-300 underline"
                            >
                              {task.name}
                            </a>
                          ) : (
                            <span className="font-medium">{task.name}</span>
                          );
                        })()}
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>Reporter: {task.reporter || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">{task.hours}h</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed' ? 'text-gray-700 font-medium' :
                        task.status === 'reworked' ? 'text-red-100' : '!text-gray-700'
                      }`}
                      style={{
                        backgroundColor: task.status === 'completed' ? '#f59e0b' : // amber
                                      task.status === 'reworked' ? '#dc2626' : // crimson
                                      '#64748b' // gray
                      }}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Information */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Debug Information:</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Total Tasks: {tasks?.length || 0}</p>
            <p>Filtered Tasks: {analyticsData.totalTasksThisMonth}</p>
            <p>User Filter: {userName || 'None'}</p>
            <p>Reporter Filter: {reporterName || 'None'}</p>
            <p>Month: {monthId}</p>
            <p>Markets: {analyticsData.marketsUsed.length} ({Object.entries(analyticsData.marketCounts || {}).map(([k,v]) => `${v}x${k}`).join(', ')})</p>
            <p>Products: {analyticsData.productsUsed.length} ({Object.entries(analyticsData.productCounts || {}).map(([k,v]) => `${v}x${k}`).join(', ')})</p>
            <p>AI Models: {Object.entries(analyticsData.aiModelCounts || {}).map(([k,v]) => `${v}x${k}`).join(', ') || 'None'}</p>
            <p>Weekly Tasks (Mon-Fri): {analyticsData.weeklyTasks.slice(0, 5).join(', ')}</p>
            <p>Daily Hours (Mon-Fri): {analyticsData.dailyHours.slice(0, 5).map(h => h.toFixed(1)).join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicAnalyticsPage;
