import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Icons } from "@/components/icons";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { CARD_SYSTEM } from "@/constants";
import { useAppDataContext } from "@/context/AppDataContext";
import { createCards, convertMarketsToBadges } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import { getWeeksInMonth } from "@/utils/monthUtils";
import SelectField from "@/components/forms/components/SelectField";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Badge from "@/components/ui/Badge/Badge";
import { logger } from "@/utils/logger";
import { normalizeTimestamp } from "@/utils/dateUtils";
import PerformanceQualityMetricsCard from "@/components/Cards/PerformanceQualityMetricsCard";

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
        if (!marketingData[subcategory]) {
          marketingData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        marketingData[subcategory].tasks += 1;
        marketingData[subcategory].hours += timeInHours;
        
        // Normalize and count markets
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach(market => {
            const normalizedMarket = normalizeMarket(market);
            if (normalizedMarket) {
              marketingData[subcategory].markets[normalizedMarket] = 
                (marketingData[subcategory].markets[normalizedMarket] || 0) + 1;
            }
          });
        }
      } else if (category === 'acquisition') {
        if (!acquisitionData[subcategory]) {
          acquisitionData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        acquisitionData[subcategory].tasks += 1;
        acquisitionData[subcategory].hours += timeInHours;
        
        // Normalize and count markets
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach(market => {
            const normalizedMarket = normalizeMarket(market);
            if (normalizedMarket) {
              acquisitionData[subcategory].markets[normalizedMarket] = 
                (acquisitionData[subcategory].markets[normalizedMarket] || 0) + 1;
            }
          });
        }
      } else if (category === 'product') {
        if (!productData[subcategory]) {
          productData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        productData[subcategory].tasks += 1;
        productData[subcategory].hours += timeInHours;
        
        // Normalize and count markets
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach(market => {
            const normalizedMarket = normalizeMarket(market);
            if (normalizedMarket) {
              productData[subcategory].markets[normalizedMarket] = 
                (productData[subcategory].markets[normalizedMarket] || 0) + 1;
            }
          });
        }
      } else if (category === 'misc') {
        if (!miscData[subcategory]) {
          miscData[subcategory] = { tasks: 0, markets: {}, hours: 0 };
        }
        miscData[subcategory].tasks += 1;
        miscData[subcategory].hours += timeInHours;
        
        // Normalize and count markets
        if (Array.isArray(markets) && markets.length > 0) {
          markets.forEach(market => {
            const normalizedMarket = normalizeMarket(market);
            if (normalizedMarket) {
              miscData[subcategory].markets[normalizedMarket] = 
                (miscData[subcategory].markets[normalizedMarket] || 0) + 1;
            }
          });
        }
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
  
  acquisitionData.totalTasks = Object.entries(acquisitionData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.tasks || 0), 0);
  acquisitionData.totalHours = Object.entries(acquisitionData)
    .filter(([key]) => key !== 'totalTasks' && key !== 'totalHours')
    .reduce((sum, [, data]) => sum + (data?.hours || 0), 0);
  
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
  const { tasks, isLoading, error, loadingStates, monthId: contextMonthId, reporters, deliverables } = useAppDataContext();

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
        const reporterIdField = r.id || r.uid || r.reporterUID;
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

  // Helper function to get tasks for a specific week
  const getWeekTasks = useCallback((week, tasksList) => {
    if (!week || !tasksList) return [];
    
    // Get week date range - use full week range (includes weekends)
    let weekStart = null;
    let weekEnd = null;
    
    if (week.startDate) {
      weekStart = week.startDate instanceof Date ? new Date(week.startDate) : new Date(week.startDate);
    }
    if (week.endDate) {
      weekEnd = week.endDate instanceof Date ? new Date(week.endDate) : new Date(week.endDate);
    }
    
    // If week dates not available, try to calculate from days array
    if (!weekStart || !weekEnd || isNaN(weekStart.getTime()) || isNaN(weekEnd.getTime())) {
      if (week.days && week.days.length > 0) {
        const sortedDays = [...week.days].sort((a, b) => {
          const dateA = a instanceof Date ? a : new Date(a);
          const dateB = b instanceof Date ? b : new Date(b);
          return dateA - dateB;
        });
        weekStart = sortedDays[0] instanceof Date ? new Date(sortedDays[0]) : new Date(sortedDays[0]);
        weekEnd = sortedDays[sortedDays.length - 1] instanceof Date ? new Date(sortedDays[sortedDays.length - 1]) : new Date(sortedDays[sortedDays.length - 1]);
      } else {
        logger.warn('Invalid week dates:', week);
        return [];
      }
    }
    
    // Normalize week dates to start/end of day for comparison
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekTasks = [];
    const seenTaskIds = new Set(); // Prevent duplicates
    const errors = []; // Collect errors for tasks without startDate
    
    tasksList.forEach(task => {
      try {
        // Get task date - only use startDate, no fallback to createdAt
        let taskDate = null;
        
        // Only use task.data_task.startDate (actual task date)
        if (!task.data_task?.startDate) {
          logger.error('Task missing startDate:', {
            taskId: task.id,
            taskName: task.data_task?.taskName,
            task: task
          });
          throw new Error(`Task ${task.data_task?.taskName || task.id || 'unknown'} is missing startDate. All tasks must have a startDate to be included in week view.`);
        }
        
        if (task.data_task.startDate instanceof Date) {
          taskDate = new Date(task.data_task.startDate);
        } else if (typeof task.data_task.startDate === 'string') {
          // Handle ISO string dates - parse and convert to local date
          const parsed = new Date(task.data_task.startDate);
          if (!isNaN(parsed.getTime())) {
            taskDate = parsed;
          } else {
            logger.error('Invalid startDate string format:', {
              taskId: task.id,
              taskName: task.data_task?.taskName,
              startDate: task.data_task.startDate
            });
            throw new Error(`Task ${task.data_task?.taskName || task.id || 'unknown'} has invalid startDate format: ${task.data_task.startDate}`);
          }
        } else if (task.data_task.startDate.toDate && typeof task.data_task.startDate.toDate === 'function') {
          taskDate = task.data_task.startDate.toDate();
        } else if (task.data_task.startDate.seconds) {
          taskDate = new Date(task.data_task.startDate.seconds * 1000);
        } else {
          logger.error('Unsupported startDate format:', {
            taskId: task.id,
            taskName: task.data_task?.taskName,
            startDate: task.data_task.startDate,
            startDateType: typeof task.data_task.startDate
          });
          throw new Error(`Task ${task.data_task?.taskName || task.id || 'unknown'} has unsupported startDate format. Expected Date, string, Firestore Timestamp, or object with seconds.`);
        }
        
        // Validate parsed date
        if (!taskDate || isNaN(taskDate.getTime())) {
          logger.error('Failed to parse startDate:', {
            taskId: task.id,
            taskName: task.data_task?.taskName,
            startDate: task.data_task.startDate,
            parsedDate: taskDate
          });
          throw new Error(`Task ${task.data_task?.taskName || task.id || 'unknown'} has invalid startDate that could not be parsed.`);
        }
        
        // Normalize task date to start of day for comparison
        // Extract year, month, day from the date to avoid timezone issues
        const taskYear = taskDate.getFullYear();
        const taskMonth = taskDate.getMonth();
        const taskDay = taskDate.getDate();
        const normalizedTaskDate = new Date(taskYear, taskMonth, taskDay, 0, 0, 0, 0);
        
        // Also normalize week dates to ensure consistent comparison
        // Extract year, month, day to avoid timezone issues
        const weekStartYear = weekStart.getFullYear();
        const weekStartMonth = weekStart.getMonth();
        const weekStartDay = weekStart.getDate();
        const normalizedWeekStart = new Date(weekStartYear, weekStartMonth, weekStartDay, 0, 0, 0, 0);
        
        const weekEndYear = weekEnd.getFullYear();
        const weekEndMonth = weekEnd.getMonth();
        const weekEndDay = weekEnd.getDate();
        const normalizedWeekEnd = new Date(weekEndYear, weekEndMonth, weekEndDay, 23, 59, 59, 999);
        
        // Check if task date falls within the week range (includes weekends)
        // Use direct date comparison (milliseconds) to avoid timezone conversion issues
        const taskTime = normalizedTaskDate.getTime();
        const weekStartTime = normalizedWeekStart.getTime();
        const weekEndTime = normalizedWeekEnd.getTime();
        
        const isInWeek = taskTime >= weekStartTime && taskTime <= weekEndTime;
        
        if (!isInWeek) return;
        
        // Check if we've already added this task (prevent duplicates)
        // Use a combination of task ID, taskName, and date to create unique identifier
        const taskId = task.id || 
          `${task.data_task?.taskName || 'task'}-${normalizedTaskDate.getTime()}-${task.createdAt?.seconds || task.createdAt || Date.now()}`;
        if (seenTaskIds.has(taskId)) return;
        seenTaskIds.add(taskId);
        
        // Filter by user if userName is specified
        if (userName) {
          const userMatch = (
            task.createdByName === userName ||
            task.userName === userName ||
            (task.userUID && task.userUID.includes(userName)) ||
            (task.createbyUID && task.createbyUID.includes(userName)) ||
            (task.createdByName && task.createdByName.toLowerCase().includes(userName.toLowerCase())) ||
            (task.data_task?.createdByName && task.data_task.createdByName.toLowerCase().includes(userName.toLowerCase()))
          );
          if (!userMatch) return;
        }
        
        // Filter by reporter if reporterName is specified
        if (reporterName) {
          const reporterMatch = (
            task.data_task?.reporterName === reporterName ||
            task.reporterName === reporterName ||
            (task.data_task?.reporters && task.data_task.reporters === reporterName) ||
            (task.reporterUID && task.reporterUID === reporterName) ||
            (task.data_task?.reporterName && task.data_task.reporterName.toLowerCase().includes(reporterName.toLowerCase()))
          );
          if (!reporterMatch) return;
        }
        
        weekTasks.push(task);
      } catch (error) {
        // Collect errors for tasks without startDate
        errors.push({
          taskId: task.id,
          taskName: task.data_task?.taskName,
          error: error.message
        });
        logger.error('Error processing task for week:', error, task);
      }
    });
    
    // If there are errors, log them and throw a summary error
    if (errors.length > 0) {
      const errorMessage = `${errors.length} task(s) missing or have invalid startDate:\n${errors.map(e => `- ${e.taskName || e.taskId || 'unknown'}: ${e.error}`).join('\n')}`;
      logger.error('Tasks with missing/invalid startDate:', errors);
      // Throw error to affect weeks filters
      throw new Error(errorMessage);
    }
    
    return weekTasks;
  }, [userName, reporterName]);

  // Helper function to format week date range
  const formatWeekDates = useCallback((week) => {
    try {
      const startDate = week.startDate ? new Date(week.startDate).toLocaleDateString() : 'Invalid';
      const endDate = week.endDate ? new Date(week.endDate).toLocaleDateString() : 'Invalid';
      return `${startDate} - ${endDate}`;
    } catch (error) {
      logger.warn('Error formatting week dates:', error, week);
      return 'Invalid dates';
    }
  }, []);

  // Helper component to render a single week section - Modern Design
  const renderWeekSection = useCallback((week, weekTasks) => {
    const taskColor = weekTasks.length > 0 ? CARD_SYSTEM.COLOR_HEX_MAP.blue : CARD_SYSTEM.COLOR_HEX_MAP.gray;
    
    return (
      <div 
        key={week.weekNumber} 
        className="relative bg-white/95 dark:bg-smallCard rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden group transition-all duration-300 hover:shadow-xl"
      >
        {/* Accent border on top with color_default */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}cc 50%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 100%)`,
          }}
        />
        
        {/* Week Header */}
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default} 0%, ${CARD_SYSTEM.COLOR_HEX_MAP.color_default}dd 100%)`,
                }}
              >
                <span className="text-white font-bold text-lg">{week.weekNumber}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  Week {week.weekNumber}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {formatWeekDates(week)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: taskColor }}
            >
              {weekTasks.length}
            </div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {weekTasks.length === 1 ? 'Task' : 'Tasks'}
            </div>
          </div>
        </div>
        
        {/* Tasks List */}
        {weekTasks.length > 0 ? (
          <div className="space-y-3 relative z-10">
            {weekTasks.map((task, index) => {
              const aiModels = task.data_task?.aiModels || (task.data_task?.aiUsed?.[0]?.aiModels || []);
              const hasAI = aiModels && (Array.isArray(aiModels) ? aiModels.length > 0 : Boolean(aiModels));
              const taskColor = hasAI ? CARD_SYSTEM.COLOR_HEX_MAP.pink : CARD_SYSTEM.COLOR_HEX_MAP.green;
              
              return (
                <div 
                  key={task.id || index} 
                  className="group/task relative bg-white dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  {/* Left border accent */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: taskColor }}
                  />
                  
                  <div className="flex items-start justify-between gap-4 pl-3">
                    {/* Main Content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Status Dot */}
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5 shadow-sm"
                        style={{
                          backgroundColor: taskColor,
                          boxShadow: `0 0 8px ${taskColor}60`,
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Task Name */}
                        <div className="mb-2">
                          {task.data_task?.taskName ? (
                            <a 
                              href={`https://gmrd.atlassian.net/browse/${task.data_task.taskName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-semibold text-gray-900 dark:text-white hover:underline inline-flex items-center gap-1.5 group/link"
                              style={{ color: taskColor }}
                            >
                              {task.data_task.taskName}
                              <svg className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              {task.data_task?.title || 'Untitled Task'}
                            </span>
                          )}
                        </div>
                        
                        {/* Metadata Row */}
                        <div className="flex items-center flex-wrap gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{getReporterName(task)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">
                              {(() => {
                                const taskHours = task.data_task?.timeInHours || task.timeInHours || 0;
                                const aiTime = task.data_task?.aiTime || (task.data_task?.aiUsed?.[0]?.aiTime || 0);
                                return (taskHours + aiTime).toFixed(1);
                              })()}h
                            </span>
                          </div>
                        </div>
                        
                        {/* Badges Row */}
                        <div className="flex items-center flex-wrap gap-2 mt-2.5">
                          {/* AI Badges */}
                          {(() => {
                            const aiModels = task.data_task?.aiModels || (task.data_task?.aiUsed?.[0]?.aiModels || []);
                            const aiTime = task.data_task?.aiTime || (task.data_task?.aiUsed?.[0]?.aiTime || 0);
                            if (!aiModels || aiModels.length === 0) return null;
                            const models = Array.isArray(aiModels) ? aiModels : [aiModels];
                            return models.map((model, idx) => (
                              <Badge key={idx} variant="pink" size="sm" className="shadow-sm">
                                {model}{aiTime > 0 && idx === 0 ? ` (${aiTime}h)` : ''}
                              </Badge>
                            ));
                          })()}
                          {/* Market Badges */}
                          {renderMarketBadges(task.data_task?.markets || task.markets)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side - User & Date */}
                    <div className="flex-shrink-0 text-right border-l border-gray-200/50 dark:border-gray-700/50 pl-4">
                      <div className="mb-1">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {task.createdByName || task.userName || 'Unknown User'}
                        </div>
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {(() => {
                          if (!task.createdAt) return 'No date';
                          const date = convertToDate(task.createdAt);
                          if (!date || isNaN(date.getTime())) return 'Invalid date';
                          return date.toLocaleDateString();
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gray-100 dark:bg-gray-800">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-1">
              No tasks for this week
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Tasks will appear here when added
            </p>
          </div>
        )}
      </div>
    );
  }, [getReporterName, renderMarketBadges, formatWeekDates]);
  
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
  
  // Helper function to convert Firestore Timestamp to Date
  const convertToDate = (timestamp) => {
    return normalizeTimestamp(timestamp);
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
      <div className="min-h-screen bg-smallCard text-white flex items-center justify-center">
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
              <p className="text-gray-300">
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
            {analyticsData?.efficiency && (
              <PerformanceQualityMetricsCard 
                key="performance-quality-metrics" 
                efficiency={analyticsData.efficiency}
              />
            )}
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
        
        {/* Tasks by Week Section - Modern Design */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Tasks by Week
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage tasks organized by week
              </p>
            </div>
            <div className="w-full sm:w-64">
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
          {/* Weeks Container */}
          <div className="space-y-6">
            {(() => {
              if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-gray-300 mb-2">
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
              // Get weeks for the current month - this fetches all existing weeks, does NOT create new ones
              // Weeks are filtered/selected from this list, never duplicated
              const weeks = getWeeksInMonth(actualMonthId);
              if (!weeks || weeks.length === 0) {
                return (
                  <div className="text-center py-4">
                    <p className="text-gray-300">No weeks available for this month</p>
                  </div>
                );
              }

              // Determine which weeks to display
              const weeksToDisplay = (() => {
                if (!selectedWeekValue || selectedWeekValue === '') {
                  // Show all weeks
                  return weeks;
                } else {
                  // Show only selected week
                  const weekNumber = parseInt(selectedWeekValue);
                  const selectedWeek = weeks.find(w => w.weekNumber === weekNumber);
                  
                  if (!selectedWeek) {
                    // Week not found - return null to show error
                    return null;
                  }
                  
                  return [selectedWeek];
                }
              })();

              // If week not found, show error message
              if (weeksToDisplay === null) {
                const weekNumber = parseInt(selectedWeekValue);
                return (
                  <div className="text-center py-8">
                    <div className="text-gray-300 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-medium mb-1">Week Not Found</p>
                      <p className="text-sm">The selected week (Week {weekNumber}) is not available for this month</p>
                    </div>
                  </div>
                );
              }

              // Render all weeks (either all weeks or just the selected one) - using shared helper functions
              try {
                return weeksToDisplay.map((week) => {
                  const weekTasks = getWeekTasks(week, tasks);
                  return renderWeekSection(week, weekTasks);
                });
              } catch (error) {
                // Display error for tasks without startDate
                return (
                  <div className="text-center py-8">
                    <div className="text-red-400 mb-4">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg font-semibold mb-2">Error Loading Week Tasks</p>
                      <p className="text-sm text-red-300 whitespace-pre-line">{error.message}</p>
                      <p className="text-xs text-red-400 mt-2">Please ensure all tasks have a valid startDate.</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DynamicAnalyticsPage;
