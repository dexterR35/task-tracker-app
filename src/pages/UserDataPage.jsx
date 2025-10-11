import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { createUserDataCard } from "@/utils/cardUtils";


const UserDataPage = () => {
  const [searchParams] = useSearchParams();
  const selectedUserIdFromUrl = searchParams.get('userId');
  
  const {
    user,
    users,
    tasks,
    reporters,
    deliverables,
    currentMonth,
    selectedMonth,
    availableMonths,
    isCurrentMonth,
    isLoading,
    isInitialLoading,
    selectMonth,
    resetToCurrentMonth,
    isAdmin,
  } = useAppData();


  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;
  const displayMonth = selectedMonth || currentMonth;

  // Determine which user's data to show
  const targetUser = useMemo(() => {
    // If URL has userId parameter, show that user's data
    if (selectedUserIdFromUrl) {
      return users.find(u => u.userUID === selectedUserIdFromUrl) || user;
    }
    // Otherwise show current user's data
    return user;
  }, [selectedUserIdFromUrl, users, user]);

  // Calculate user-specific metrics based on selected month
  const userMetrics = useMemo(() => {
    if (!tasks || tasks.length === 0 || !targetUser) {
      return {
        totalTasks: 0,
        totalHours: 0,
        totalDeliverables: 0,
        totalAIModels: 0,
        totalMarkets: 0,
        totalProducts: 0,
        vipTasks: 0,
        reworkedTasks: 0,
        averageTaskDuration: 0,
        monthlyBreakdown: [],
        departmentBreakdown: [],
        aiModelBreakdown: [],
        marketBreakdown: [],
        productBreakdown: [],
        deliverablesBreakdown: [],
        timeDistribution: [],
        topAI: null,
        topMarket: null,
        topProduct: null,
        topDepartment: null,
        mostActiveDay: null,
        recentTasks: [],
        performanceStats: {
          tasksThisMonth: 0,
          hoursThisMonth: 0,
          avgTasksPerWeek: 0,
          avgHoursPerWeek: 0,
          productivityScore: 0
        }
      };
    }

    // Filter tasks for target user and selected month
    const userTasks = tasks.filter(task => 
      task.userUID === targetUser.userUID || task.createbyUID === targetUser.userUID
    );

    if (userTasks.length === 0) {
      return {
        totalTasks: 0,
        totalHours: 0,
        totalDeliverables: 0,
        totalAIModels: 0,
        totalMarkets: 0,
        totalProducts: 0,
        vipTasks: 0,
        reworkedTasks: 0,
        averageTaskDuration: 0,
        monthlyBreakdown: [],
        departmentBreakdown: [],
        aiModelBreakdown: [],
        marketBreakdown: [],
        productBreakdown: [],
        deliverablesBreakdown: [],
        timeDistribution: [],
        topAI: null,
        topMarket: null,
        topProduct: null,
        topDepartment: null,
        mostActiveDay: null,
        recentTasks: [],
        performanceStats: {
          tasksThisMonth: 0,
          hoursThisMonth: 0,
          avgTasksPerWeek: 0,
          avgHoursPerWeek: 0,
          productivityScore: 0
        }
      };
    }

    // Basic counts
    const totalTasks = userTasks.length;
    const totalHours = userTasks.reduce((sum, task) => {
      const hours = task.data_task?.timeInHours || 0;
      return sum + (typeof hours === 'number' ? hours : parseFloat(hours) || 0);
    }, 0);

    // Count deliverables
    const totalDeliverables = userTasks.reduce((sum, task) => {
      const deliverablesUsed = task.data_task?.deliverablesUsed || [];
      return sum + deliverablesUsed.reduce((delSum, del) => delSum + (del.count || 0), 0);
    }, 0);

    // Count AI models
    const totalAIModels = userTasks.reduce((sum, task) => {
      const aiUsed = task.data_task?.aiUsed || [];
      return sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiModels?.length || 0), 0);
    }, 0);

    // Count VIP and reworked tasks
    const vipTasks = userTasks.filter(task => task.data_task?.isVip).length;
    const reworkedTasks = userTasks.filter(task => task.data_task?.reworked).length;

    // Department breakdown
    const departmentBreakdown = userTasks.reduce((acc, task) => {
      const departments = task.data_task?.departments;
      if (!departments) return acc;
      
      const deptArray = Array.isArray(departments) ? departments : [departments];
      deptArray.forEach(dept => {
        if (!acc[dept]) {
          acc[dept] = {
            department: dept,
            taskCount: 0,
            totalHours: 0,
            tasks: []
          };
        }
        
        const hours = task.data_task?.timeInHours || 0;
        acc[dept].taskCount += 1;
        acc[dept].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
        acc[dept].tasks.push(task);
      });
      
      return acc;
    }, {});

    // AI Model breakdown
    const aiModelBreakdown = userTasks.reduce((acc, task) => {
      const aiUsed = task.data_task?.aiUsed || [];
      aiUsed.forEach(ai => {
        const models = ai.aiModels || [];
        models.forEach(model => {
          if (!acc[model]) {
            acc[model] = {
              model,
              taskCount: 0,
              totalHours: 0,
              totalAITime: 0,
              tasks: []
            };
          }
          
          const hours = task.data_task?.timeInHours || 0;
          const aiTime = ai.aiTime || 0;
          acc[model].taskCount += 1;
          acc[model].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
          acc[model].totalAITime += typeof aiTime === 'number' ? aiTime : parseFloat(aiTime) || 0;
          acc[model].tasks.push(task);
        });
      });
      
      return acc;
    }, {});

    // Market breakdown
    const marketBreakdown = userTasks.reduce((acc, task) => {
      const markets = task.data_task?.markets || [];
      if (markets.length === 0) {
        if (!acc['No Market']) {
          acc['No Market'] = {
            market: 'No Market',
            taskCount: 0,
            totalHours: 0,
            tasks: []
          };
        }
        acc['No Market'].taskCount += 1;
        acc['No Market'].totalHours += task.data_task?.timeInHours || 0;
        acc['No Market'].tasks.push(task);
        return acc;
      }
      
      markets.forEach(market => {
        if (!acc[market]) {
          acc[market] = {
            market,
            taskCount: 0,
            totalHours: 0,
            tasks: []
          };
        }
        
        const hours = task.data_task?.timeInHours || 0;
        acc[market].taskCount += 1;
        acc[market].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
        acc[market].tasks.push(task);
      });
      
      return acc;
    }, {});

    // Product breakdown
    const productBreakdown = userTasks.reduce((acc, task) => {
      const products = task.data_task?.products;
      if (!products) {
        if (!acc['No Product']) {
          acc['No Product'] = {
            product: 'No Product',
            taskCount: 0,
            totalHours: 0,
            tasks: []
          };
        }
        acc['No Product'].taskCount += 1;
        acc['No Product'].totalHours += task.data_task?.timeInHours || 0;
        acc['No Product'].tasks.push(task);
        return acc;
      }
      
      if (!acc[products]) {
        acc[products] = {
          product: products,
          taskCount: 0,
          totalHours: 0,
          tasks: []
        };
      }
      
      const hours = task.data_task?.timeInHours || 0;
      acc[products].taskCount += 1;
      acc[products].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
      acc[products].tasks.push(task);
      
      return acc;
    }, {});

    // Deliverables breakdown
    const deliverablesBreakdown = userTasks.reduce((acc, task) => {
      const deliverablesUsed = task.data_task?.deliverablesUsed || [];
      deliverablesUsed.forEach(deliverable => {
        const name = deliverable.name || 'Unknown';
        const count = deliverable.count || 0;
        
        if (!acc[name]) {
          acc[name] = {
            name,
            totalCount: 0,
            taskCount: 0,
            totalHours: 0,
            tasks: []
          };
        }
        
        const hours = task.data_task?.timeInHours || 0;
        acc[name].totalCount += count;
        acc[name].taskCount += 1;
        acc[name].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
        acc[name].tasks.push(task);
      });
      
      return acc;
    }, {});

    // Time distribution (by day of week)
    const timeDistribution = userTasks.reduce((acc, task) => {
      const startDate = task.data_task?.startDate;
      if (!startDate) return acc;
      
      const date = new Date(startDate);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (!acc[dayOfWeek]) {
        acc[dayOfWeek] = {
          day: dayOfWeek,
          taskCount: 0,
          totalHours: 0
        };
      }
      
      const hours = task.data_task?.timeInHours || 0;
      acc[dayOfWeek].taskCount += 1;
      acc[dayOfWeek].totalHours += typeof hours === 'number' ? hours : parseFloat(hours) || 0;
      
      return acc;
    }, {});

    // Calculate totals
    const totalMarkets = Object.keys(marketBreakdown).length;
    const totalProducts = Object.keys(productBreakdown).length;

    // Calculate averages and find top performers
    const averageTaskDuration = totalTasks > 0 ? totalHours / totalTasks : 0;
    
    const topAI = Object.values(aiModelBreakdown).sort((a, b) => b.totalAITime - a.totalAITime)[0];
    const topMarket = Object.values(marketBreakdown).sort((a, b) => b.totalHours - a.totalHours)[0];
    const topProduct = Object.values(productBreakdown).sort((a, b) => b.totalHours - a.totalHours)[0];
    const topDepartment = Object.values(departmentBreakdown).sort((a, b) => b.totalHours - a.totalHours)[0];
    const mostActiveDay = Object.values(timeDistribution).sort((a, b) => b.totalHours - a.totalHours)[0];

    // Recent tasks (last 5)
    const recentTasks = userTasks
      .sort((a, b) => new Date(b.data_task?.startDate || b.createdAt) - new Date(a.data_task?.startDate || a.createdAt))
      .slice(0, 5);

    // Performance stats for selected month
    const selectedMonthTasks = userTasks; // All user tasks are already filtered for the selected month
    const tasksThisMonth = selectedMonthTasks.length;
    const hoursThisMonth = selectedMonthTasks.reduce((sum, task) => {
      const hours = task.data_task?.timeInHours || 0;
      return sum + (typeof hours === 'number' ? hours : parseFloat(hours) || 0);
    }, 0);

    // Calculate weekly averages (assuming 4 weeks per month)
    const avgTasksPerWeek = Math.round((tasksThisMonth / 4) * 100) / 100;
    const avgHoursPerWeek = Math.round((hoursThisMonth / 4) * 100) / 100;

    // Simple productivity score (tasks * hours efficiency)
    const productivityScore = Math.round((tasksThisMonth * (hoursThisMonth / Math.max(tasksThisMonth, 1))) * 100) / 100;

    return {
      totalTasks,
      totalHours: Math.round(totalHours * 100) / 100,
      totalDeliverables,
      totalAIModels,
      totalMarkets,
      totalProducts,
      vipTasks,
      reworkedTasks,
      averageTaskDuration: Math.round(averageTaskDuration * 100) / 100,
      departmentBreakdown: Object.values(departmentBreakdown),
      aiModelBreakdown: Object.values(aiModelBreakdown),
      marketBreakdown: Object.values(marketBreakdown),
      productBreakdown: Object.values(productBreakdown),
      deliverablesBreakdown: Object.values(deliverablesBreakdown),
      timeDistribution: Object.values(timeDistribution),
      topAI,
      topMarket,
      topProduct,
      topDepartment,
      mostActiveDay,
      recentTasks,
      performanceStats: {
        tasksThisMonth,
        hoursThisMonth: Math.round(hoursThisMonth * 100) / 100,
        avgTasksPerWeek,
        avgHoursPerWeek,
        productivityScore
      }
    };
  }, [tasks, targetUser, selectedMonth, currentMonth]);


  if (isLoading || isInitialLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="user-data-page" className="space-y-6">
      {/* User Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Icons.generic.user className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {targetUser.name || targetUser.displayName || 'User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{targetUser.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {targetUser.role || 'User'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {userMetrics.totalTasks} Total Tasks
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Month Selector */}
            <div className="w-64">
              <SearchableSelectField
                field={{
                  name: 'selectedMonth',
                  type: 'select',
                  label: 'Select Month',
                  required: false,
                  options: availableMonths?.map((month) => ({
                    value: month.monthId,
                    label: `${month.monthName}${month.isCurrent ? " (Current)" : ""}`
                  })) || [],
                  placeholder: 'Search months...'
                }}
                register={() => {}} // Not needed for this use case
                errors={{}}
                setValue={(fieldName, value) => {
                  if (fieldName === 'selectedMonth' && selectMonth) {
                    selectMonth(value);
                  }
                }}
                watch={() => selectedMonth?.monthId || currentMonth?.monthId || ""}
                trigger={() => {}}
                clearErrors={() => {}}
                formValues={{}}
                noOptionsMessage="No months available"
              />
            </div>
          </div>
        </div>
        
        {/* Month Progress Bar */}
        <div className="mt-4">
          <MonthProgressBar 
            monthId={displayMonth?.monthId}
            monthName={displayMonth?.monthName}
            isCurrentMonth={isCurrentMonth}
            startDate={displayMonth?.startDate}
            endDate={displayMonth?.endDate}
            daysInMonth={displayMonth?.daysInMonth}
          />
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SmallCard
          card={createUserDataCard(
            "Tasks This Month",
            selectedMonthName,
            userMetrics.performanceStats.tasksThisMonth,
            "Tasks completed this month",
            Icons.generic.task,
            "blue"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Hours This Month",
            selectedMonthName,
            userMetrics.performanceStats.hoursThisMonth,
            "Hours worked this month",
            Icons.generic.clock,
            "green"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Avg Tasks/Week",
            "Weekly Average",
            userMetrics.performanceStats.avgTasksPerWeek,
            "Average tasks per week",
            Icons.generic.chart,
            "purple"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Productivity Score",
            "Efficiency",
            userMetrics.performanceStats.productivityScore,
            "Your productivity rating",
            Icons.generic.zap,
            "amber"
          )}
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SmallCard
          card={createUserDataCard(
            "Total Tasks",
            "Completed",
            userMetrics.totalTasks,
            "Tasks completed this month",
            Icons.generic.task,
            "blue"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Total Hours",
            "Worked",
            userMetrics.totalHours,
            "Hours logged this month",
            Icons.generic.clock,
            "green"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Deliverables",
            "Completed",
            userMetrics.totalDeliverables,
            "Deliverables finished",
            Icons.generic.deliverable,
            "purple"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "AI Models",
            "Used",
            userMetrics.totalAIModels,
            "AI tools utilized",
            Icons.generic.zap,
            "amber"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "VIP Tasks",
            "Priority",
            userMetrics.vipTasks,
            "High priority tasks",
            Icons.generic.star,
            "yellow"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Reworked",
            "Tasks",
            userMetrics.reworkedTasks,
            "Tasks requiring rework",
            Icons.generic.refresh,
            "red"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Avg Duration",
            "Per Task",
            `${userMetrics.averageTaskDuration}h`,
            "Average time per task",
            Icons.generic.timer,
            "pink"
          )}
        />

        <SmallCard
          card={createUserDataCard(
            "Markets",
            "Active",
            userMetrics.totalMarkets,
            "Different markets worked",
            Icons.generic.globe,
            "green"
          )}
        />
      </div>

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {userMetrics.topAI && (
          <SmallCard
            card={createUserDataCard(
              "Top AI Model",
              "Most Used",
              userMetrics.topAI.model,
              "Your most utilized AI tool",
              Icons.generic.zap,
              "amber",
              [
                { label: "Tasks", value: userMetrics.topAI.taskCount },
                { label: "AI Time", value: `${userMetrics.topAI.totalAITime}h` }
              ]
            )}
          />
        )}

        {userMetrics.topMarket && (
          <SmallCard
            card={createUserDataCard(
              "Top Market",
              "Most Active",
              userMetrics.topMarket.market,
              "Your primary market focus",
              Icons.generic.globe,
              "green",
              [
                { label: "Tasks", value: userMetrics.topMarket.taskCount },
                { label: "Hours", value: `${userMetrics.topMarket.totalHours}h` }
              ]
            )}
          />
        )}

        {userMetrics.topProduct && (
          <SmallCard
            card={createUserDataCard(
              "Top Product",
              "Most Worked",
              userMetrics.topProduct.product,
              "Your main product focus",
              Icons.generic.product,
              "blue",
              [
                { label: "Tasks", value: userMetrics.topProduct.taskCount },
                { label: "Hours", value: `${userMetrics.topProduct.totalHours}h` }
              ]
            )}
          />
        )}

        {userMetrics.topDepartment && (
          <SmallCard
            card={createUserDataCard(
              "Top Department",
              "Most Active",
              userMetrics.topDepartment.department,
              "Your primary department",
              Icons.generic.department,
              "purple",
              [
                { label: "Tasks", value: userMetrics.topDepartment.taskCount },
                { label: "Hours", value: `${userMetrics.topDepartment.totalHours}h` }
              ]
            )}
          />
        )}
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icons.generic.globe className="w-5 h-5 text-teal-600 mr-2" />
            Market Distribution
          </h3>
          <div className="space-y-3">
            {userMetrics.marketBreakdown.slice(0, 5).map((market, index) => (
              <div key={market.market} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-300">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{market.market}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{market.taskCount} tasks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{market.totalHours}h</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">total time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icons.generic.clock className="w-5 h-5 text-indigo-600 mr-2" />
            Recent Tasks
          </h3>
          <div className="space-y-3">
            {userMetrics.recentTasks.map((task, index) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.data_task?.taskName || 'Task'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {task.data_task?.startDate ? new Date(task.data_task.startDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{task.data_task?.timeInHours || 0}h</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">duration</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deliverables Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icons.generic.deliverable className="w-5 h-5 text-purple-600 mr-2" />
          Deliverables Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMetrics.deliverablesBreakdown.slice(0, 6).map((deliverable, index) => (
            <div key={deliverable.name} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{deliverable.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {deliverable.totalCount} total
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <p>Tasks: {deliverable.taskCount}</p>
                </div>
                <div>
                  <p>Hours: {deliverable.totalHours}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Distribution */}
      {userMetrics.timeDistribution.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icons.generic.clock className="w-5 h-5 text-indigo-600 mr-2" />
            Weekly Activity Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {userMetrics.timeDistribution.map((day, index) => (
              <div key={day.day} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{day.day}</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{day.totalHours}h</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{day.taskCount} tasks</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDataPage;
