import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Icons } from "@/components/icons";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { CARD_SYSTEM } from "@/constants";
import { useAppDataContext } from "@/context/AppDataContext";
import { createCards, convertMarketsToBadges } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Badge from "@/components/ui/Badge/Badge";
import { logger } from "@/utils/logger";
import { normalizeTimestamp } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { matchesUserName, matchesReporterName } from "@/utils/taskFilters";
import { getWeeksInMonth } from "@/utils/monthUtils";

// Hardcoded efficiency data for demonstration
const HARDCODED_EFFICIENCY_DATA = {
  averageTaskCompletion: 2.3, // days
  productivityScore: 87, // percentage
  qualityRating: 4.2, // out of 5
  onTimeDelivery: 94, // percentage
  clientSatisfaction: 4.6, // out of 5
};

// Generate real data from useAppData
const generateRealData = (tasks, userName, reporterName, monthId, weekParam = null, deliverablesOptions = []) => {
  if (!tasks || tasks.length === 0) {
    return {
      totalTasksThisMonth: 0,
      totalTasksMultipleMonths: 0,
      totalHours: 0,
      totalDeliverables: 0,
      totalVariations: 0,
      totalDeliverablesHours: 0,
      totalDeliverablesWithVariationsHours: 0,
      aiUsed: { total: 0, models: [], time: 0 },
      marketsUsed: [],
      productsUsed: [],
      weeklyTasks: [0, 0, 0, 0, 0, 0, 0],
      dailyHours: [0, 0, 0, 0, 0, 0, 0],
      efficiency: HARDCODED_EFFICIENCY_DATA,
    };
  }

  // Filter tasks based on parameters
  const filteredTasks = tasks.filter(task => {
    // Filter by month only if explicitly provided
    // null means show all months, otherwise filter by specific monthId
    if (monthId && task.monthId !== monthId) {
      return false;
    }
    // If monthId is null, don't filter by month (show all data)
    
    // Filter by user if specified (using shared utility)
    if (userName && !matchesUserName(task, userName)) {
      return false;
    }
    
    // Filter by reporter if specified (using shared utility)
    if (reporterName && !matchesReporterName(task, reporterName)) {
      return false;
    }
    
    // Filter by week if specified (requires monthId to be set)
    if (weekParam && monthId) {
      try {
        const weekNumber = parseInt(weekParam);
        if (!isNaN(weekNumber)) {
          // Get weeks for the specified month
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
                logger.warn('Error processing week day:', error, day);
                return false;
              }
            });
            
            if (!isInWeek) return false;
          }
        }
      } catch (error) {
        logger.warn('Error processing week filter:', error);
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

  // Calculate deliverables hours (base time and with variations)
  let totalDeliverablesHours = 0; // Base time without variations
  let totalDeliverablesWithVariationsHours = 0; // Base time + variations time

  filteredTasks.forEach(task => {
    const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
    if (!deliverables || deliverables.length === 0) return;

    deliverables.forEach(deliverable => {
      const deliverableName = deliverable?.name;
      const quantity = deliverable?.count || 1;
      const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;

      if (!deliverableName) return;

      // Find deliverable in options
      const deliverableOption = deliverablesOptions.find(d =>
        d.value && d.value.toLowerCase().trim() === deliverableName.toLowerCase().trim()
      );

      if (deliverableOption) {
        const timePerUnit = deliverableOption.timePerUnit || 1;
        const timeUnit = deliverableOption.timeUnit || 'hr';
        const requiresQuantity = deliverableOption.requiresQuantity || false;

        // Convert base time to hours
        let baseTimeInHours = timePerUnit;
        if (timeUnit === 'min') baseTimeInHours = timePerUnit / 60;
        else if (timeUnit === 'hr') baseTimeInHours = timePerUnit;
        else if (timeUnit === 'day') baseTimeInHours = timePerUnit * 8;

        // Calculate base time for this deliverable (quantity × timePerUnit)
        const deliverableBaseHours = baseTimeInHours * quantity;
        totalDeliverablesHours += deliverableBaseHours;

        // Calculate variations time if applicable
        let variationsTimeInHours = 0;
        if (requiresQuantity && variationsQuantity > 0) {
          const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
          const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';

          let variationsTimePerUnitInHours = variationsTime;
          if (variationsTimeUnit === 'min') variationsTimePerUnitInHours = variationsTime / 60;
          else if (variationsTimeUnit === 'hr') variationsTimePerUnitInHours = variationsTime;
          else if (variationsTimeUnit === 'day') variationsTimePerUnitInHours = variationsTime * 8;

          variationsTimeInHours = variationsTimePerUnitInHours * variationsQuantity;
        }

        // Total time with variations
        const totalWithVariations = deliverableBaseHours + variationsTimeInHours;
        totalDeliverablesWithVariationsHours += totalWithVariations;
      }
    });
  });

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
  
  // Helper function to normalize market (consistent with analyticsSharedConfig)
  const normalizeMarket = (market) => {
    if (!market) return null;
    return market.toString().trim().toUpperCase();
  };

  filteredTasks.forEach(task => {
    const product = task.data_task?.products || task.products || '';
    const markets = task.data_task?.markets || task.markets || [];
    const timeInHours = task.data_task?.timeInHours || task.timeInHours || 0;
    
    if (product) {
      // Normalize product string and determine category and subcategory
      const productLower = product.toLowerCase().trim();
      
      // Handle product strings with or without spaces (e.g., "product casino" or "productcasino")
      let category = null;
      let subcategory = null;
      
      if (productLower.startsWith('marketing ')) {
        category = 'marketing';
        subcategory = productLower.replace('marketing ', '').trim();
      } else if (productLower.startsWith('acquisition ')) {
        category = 'acquisition';
        subcategory = productLower.replace('acquisition ', '').trim();
      } else if (productLower.startsWith('product ')) {
        category = 'product';
        subcategory = productLower.replace('product ', '').trim();
      } else if (productLower.startsWith('misc ')) {
        category = 'misc';
        subcategory = productLower.replace('misc ', '').trim();
      } else if (productLower.startsWith('marketing')) {
        category = 'marketing';
        subcategory = productLower.replace('marketing', '').trim();
      } else if (productLower.startsWith('acquisition')) {
        category = 'acquisition';
        subcategory = productLower.replace('acquisition', '').trim();
      } else if (productLower.startsWith('product')) {
        category = 'product';
        subcategory = productLower.replace('product', '').trim();
      } else if (productLower.startsWith('misc')) {
        category = 'misc';
        subcategory = productLower.replace('misc', '').trim();
      }
      
      // Only process if we have a valid category
      if (!category) return;
      
      // If no subcategory, use 'general' as default
      if (!subcategory || subcategory === '') {
        subcategory = 'general';
      }
      
      if (category === 'marketing') {
        // Skip marketing tasks without markets (consistent with other configs)
        if (!Array.isArray(markets) || markets.length === 0) return;
        
        if (!marketingData[subcategory]) {
          marketingData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        
        // Count unique tasks (1 task), but count markets per market
        marketingData[subcategory].tasks += 1;
        marketingData[subcategory].hours += timeInHours;
        
        // Count markets per market (RO: 3, IE: 2, UK: 2)
        markets.forEach(market => {
          const normalizedMarket = normalizeMarket(market);
          if (normalizedMarket) {
            marketingData[subcategory].markets[normalizedMarket] = 
              (marketingData[subcategory].markets[normalizedMarket] || 0) + 1;
          }
        });
      } else if (category === 'acquisition') {
        // Skip acquisition tasks without markets (consistent with AcquisitionAnalyticsConfig.js)
        if (!Array.isArray(markets) || markets.length === 0) return;
        
        if (!acquisitionData[subcategory]) {
          acquisitionData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        
        // Count unique tasks (1 task), but count markets per market
        acquisitionData[subcategory].tasks += 1;
        acquisitionData[subcategory].hours += timeInHours;
        
        // Count markets per market (RO: 3, IE: 2, UK: 2)
        markets.forEach(market => {
          const normalizedMarket = normalizeMarket(market);
          if (normalizedMarket) {
            acquisitionData[subcategory].markets[normalizedMarket] = 
              (acquisitionData[subcategory].markets[normalizedMarket] || 0) + 1;
          }
        });
      } else if (category === 'product') {
        // Skip product tasks without markets (consistent with other configs)
        if (!Array.isArray(markets) || markets.length === 0) return;
        
        if (!productData[subcategory]) {
          productData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        
        // Count unique tasks (1 task), but count markets per market
        productData[subcategory].tasks += 1;
        productData[subcategory].hours += timeInHours;
        
        // Count markets per market (RO: 3, IE: 2, UK: 2)
        markets.forEach(market => {
          const normalizedMarket = normalizeMarket(market);
          if (normalizedMarket) {
            productData[subcategory].markets[normalizedMarket] = 
              (productData[subcategory].markets[normalizedMarket] || 0) + 1;
          }
        });
      } else if (category === 'misc') {
        // Skip misc tasks without markets (consistent with other configs)
        if (!Array.isArray(markets) || markets.length === 0) return;
        
        if (!miscData[subcategory]) {
          miscData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        
        // Count unique tasks (1 task), but count markets per market
        miscData[subcategory].tasks += 1;
        miscData[subcategory].hours += timeInHours;
        
        // Count markets per market (RO: 3, IE: 2, UK: 2)
        markets.forEach(market => {
          const normalizedMarket = normalizeMarket(market);
          if (normalizedMarket) {
            miscData[subcategory].markets[normalizedMarket] = 
              (miscData[subcategory].markets[normalizedMarket] || 0) + 1;
          }
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

  // Calculate totals for each category (exclude totalTasks and totalHours from calculation)
  marketingData.totalTasks = Object.entries(marketingData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.tasks || 0), 0);
  marketingData.totalHours = Object.entries(marketingData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.hours || 0), 0);
  
  // Calculate totals - only count casino and sport to match details page
  // (details page only shows casino + sport, not poker/lotto)
  acquisitionData.totalTasks = (acquisitionData.casino?.tasks || 0) + (acquisitionData.sport?.tasks || 0);
  acquisitionData.totalHours = (acquisitionData.casino?.hours || 0) + (acquisitionData.sport?.hours || 0);
  
  productData.totalTasks = Object.entries(productData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.tasks || 0), 0);
  productData.totalHours = Object.entries(productData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.hours || 0), 0);
  
  miscData.totalTasks = Object.entries(miscData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.tasks || 0), 0);
  miscData.totalHours = Object.entries(miscData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.hours || 0), 0);

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
    
    if (!taskDate) return;
    
    const date = normalizeTimestamp(taskDate);
    if (!date || isNaN(date.getTime())) return;
    
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

  return {
    totalTasksThisMonth,
    totalTasksMultipleMonths: totalTasksThisMonth * 3, // Estimate
    totalHours,
    totalDeliverables,
    totalVariations,
    totalDeliverablesHours,
    totalDeliverablesWithVariationsHours,
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
    efficiency: HARDCODED_EFFICIENCY_DATA,
  };
};


const DynamicAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Extract URL parameters
  const userName = searchParams.get('user');
  const reporterName = searchParams.get('reporter');
  const monthIdParam = searchParams.get('month');
  const monthId = monthIdParam || null; // null means show all months
  const weekParam = searchParams.get('week');
  
  
  // Use real data from context
  const { tasks, isLoading, error, loadingStates, monthId: contextMonthId, reporters, deliverables } = useAppDataContext();
  const { user } = useAuth();

  // Transform deliverables to options format
  const deliverablesOptions = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];
    return deliverables.map(deliverable => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || 'min',
      declinariTime: deliverable.declinariTime,
      declinariTimeUnit: deliverable.declinariTimeUnit
    }));
  }, [deliverables]);
  
  // Helper function to get reporter name from UID
  const getReporterName = (task) => {
    // First try reporterName field
    const reporterName = task.data_task?.reporterName || task.reporterName;
    if (reporterName) return reporterName;
    
    // If no name, try to resolve from reporters data
    const reporterId = task.data_task?.reporters || task.data_task?.reporterUID || task.reporterUID || task.reporters;
    if (reporterId && reporters && Array.isArray(reporters)) {
      const reporter = reporters.find(r => {
        const reporterIdField = r.reporterUID;
        return reporterIdField && 
               typeof reporterIdField === 'string' &&
               reporterIdField.toLowerCase() === String(reporterId).toLowerCase();
      });
      if (reporter?.name) return reporter.name;
    }
    
    // Fallback to UID if nothing found
    return reporterId || 'N/A';
  };

  // Helper function to render market badges (consistent with table columns)
  const renderMarketBadges = (markets) => {
    if (!markets || markets.length === 0) return null;
    const marketList = Array.isArray(markets) ? markets : [markets];
    return marketList.map((market, idx) => (
      <Badge key={idx} variant="amber" size="sm" className="uppercase">
        {market}
      </Badge>
    ));
  };

  // Helper function to convert Firestore Timestamp to Date
  const convertToDate = (timestamp) => {
    return normalizeTimestamp(timestamp);
  };
  
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
  
  // Use actual monthId from context if 'current' is specified, otherwise use the provided monthId or null for all data
  const actualMonthId = monthId === 'current' ? contextMonthId : monthId;
  
  // Generate real data based on parameters
  const analyticsData = !tasks ? null : generateRealData(tasks, userName, reporterName, actualMonthId, weekParam, deliverablesOptions);

  
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

  
  // Determine page title
  const pageTitle = (() => {
    const weekInfo = weekParam ? ` - Week ${weekParam}` : "";
    const monthInfo = monthId ? (monthId === 'current' ? ' (Current Month)' : ` (Month: ${monthId})`) : ' (All Data)';
    
    if (userName && reporterName) {
      return `Analytics: ${userName} & ${reporterName}${weekInfo}${monthInfo}`;
    } else if (userName) {
      return `User Analytics: ${userName}${weekInfo}${monthInfo}`;
    } else if (reporterName) {
      return `Reporter Analytics: ${reporterName}${weekInfo}${monthInfo}`;
    }
    return `Analytics Overview${weekInfo}${monthInfo}`;
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
      <div className="min-h-screen bg-smallCard text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading analytics data: {error.message}</p>
          <DynamicButton
            onClick={() => navigate(-1)}
            variant="primary"
            size="lg"
            iconName="arrowLeft"
            iconCategory="buttons"
            iconPosition="left"
            className="font-semibold shadow-md"
          >
            Back to Overview
          </DynamicButton>
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
              <p className="text-gray-300">
                {userName && reporterName 
                  ? ` Analytics for user ${userName} and reporter ${reporterName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                  : userName 
                    ? ` Metrics for user ${userName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                    : reporterName
                      ? `Reporter analysis for ${reporterName}${monthId ? ` (${monthId === 'current' ? 'Current Month' : monthId})` : ' (All Data)'}`
                      : monthId 
                        ? `Overall system analytics (${monthId === 'current' ? 'Current Month' : monthId})`
                        : 'Overall system analytics - All Data'
                }
              </p>
            </div>
            <DynamicButton
              onClick={() => navigate(-1)}
              variant="primary"
              size="lg"
              iconName="arrowLeft"
              iconCategory="buttons"
              iconPosition="left"
              className="font-semibold shadow-md"
            >
              Back to Overview
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
        
      </div>
    </div>
  );
};

export default DynamicAnalyticsPage;
