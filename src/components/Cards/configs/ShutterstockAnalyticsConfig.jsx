import {
  getTaskMarkets,
  getTaskHours,
  getTaskUserUID,
  getUserName,
  normalizeMarket,
  calculateCountWithPercentage,
  renderCountWithPercentage,
  addGrandTotalRow,
} from "./analyticsSharedConfig";

export const calculateShutterstockAnalytics = (tasks, users) => {
  // Filter tasks to only include those with useShutterstock = true
  const shutterstockTasks = (tasks || []).filter((task) => {
    const useShutterstock = task.data_task?.useShutterstock || task.useShutterstock || false;
    return useShutterstock === true;
  });

  if (!shutterstockTasks || shutterstockTasks.length === 0 || !users || users.length === 0) {
    return {
      tableData: [
        {
          user: "No data available",
          totalTasks: 0,
          totalHours: 0,
          noData: true,
        },
      ],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        {
          key: "totalTasks",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "totalHours",
          header: "Total Hours",
          align: "center",
          highlight: true,
        },
      ],
      totalTasks: 0,
      totalHours: 0,
      totalAllTasks: tasks?.length || 0,
      comparisonTableData: [],
      comparisonTableColumns: [
        { key: "tool", header: "Tool Type", align: "left" },
        { key: "tasks", header: "Tasks", align: "center", highlight: true },
        { key: "percentage", header: "Percentage", align: "center", highlight: true, render: (value) => `${value}%` },
        { key: "ofTotalTask", header: "Of Total Task", align: "center", highlight: true, render: (value) => value !== undefined && value !== null ? `of ${value}` : "of 0" },
      ],
    };
  }

  const userMarketStats = {};
  const allMarkets = new Set();

  // Process only Shutterstock tasks
  shutterstockTasks.forEach((task) => {
    const taskMarkets = getTaskMarkets(task);
    const taskHours = getTaskHours(task);
    const userId = getTaskUserUID(task);

    if (!userId || !taskMarkets || taskMarkets.length === 0) return;

    const userName = getUserName(userId, users);

    if (!userMarketStats[userId]) {
      userMarketStats[userId] = {
        userName,
        markets: {},
        totalTasks: 0,
        totalHours: 0,
      };
    }

    taskMarkets.forEach((market) => {
      if (market) {
        const normalizedMarket = normalizeMarket(market);
        allMarkets.add(normalizedMarket);
        if (!userMarketStats[userId].markets[normalizedMarket]) {
          userMarketStats[userId].markets[normalizedMarket] = {
            tasks: 0,
            hours: 0,
          };
        }
        userMarketStats[userId].markets[normalizedMarket].tasks += 1;
        userMarketStats[userId].markets[normalizedMarket].hours += taskHours;
      }
    });

    userMarketStats[userId].totalTasks += 1;
    userMarketStats[userId].totalHours += taskHours;
  });

  const sortedMarkets = Array.from(allMarkets).sort();
  const tableData = Object.entries(userMarketStats)
    .map(([_userId, userData]) => {
      const row = {
        user: userData.userName,
        totalTasks: userData.totalTasks,
        totalHours: Math.round(userData.totalHours * 100) / 100,
      };

      // Calculate market items for percentage calculation
      const marketItems = sortedMarkets.map((market) => ({
        key: market,
        count: userData.markets[market]?.tasks || 0,
      }));

      // Calculate total market occurrences (sum of all market counts)
      // This ensures percentages sum to 100% across all markets
      const totalMarketOccurrences = marketItems.reduce((sum, item) => sum + item.count, 0);

      // Add market columns with percentages
      sortedMarkets.forEach((market) => {
        const marketData = userData.markets[market] || { tasks: 0, hours: 0 };
        const marketCount = marketData.tasks || 0;
        row[market] = calculateCountWithPercentage(
          marketCount,
          totalMarketOccurrences || userData.totalTasks, // Use total market occurrences, fallback to totalTasks if 0
          marketItems,
          market
        );
      });

      return row;
    })
    .sort((a, b) => {
      if (b.totalTasks !== a.totalTasks) {
        return b.totalTasks - a.totalTasks;
      }
      return a.user.localeCompare(b.user);
    });

  // Add grand total row
  const tableDataWithTotal = addGrandTotalRow(tableData, {
    labelKey: "user",
    labelValue: "Grand Total",
    sumColumns: ["totalTasks", "totalHours"],
    marketColumns: sortedMarkets,
  });

  const tableColumns = [
    { key: "user", header: "User", align: "left" },
    {
      key: "totalTasks",
      header: "Total Tasks",
      align: "center",
      highlight: true,
    },
    {
      key: "totalHours",
      header: "Total Hours",
      align: "center",
      highlight: true,
    },
  ];

  sortedMarkets.forEach((market) => {
    tableColumns.push({
      key: market,
      header: market.toUpperCase(),
      align: "center",
      render: renderCountWithPercentage,
    });
  });

  // Calculate totals
  const totalTasks = shutterstockTasks.length;
  const totalHours = shutterstockTasks.reduce((sum, task) => {
    const hours = getTaskHours(task);
    return sum + (typeof hours === "number" ? hours : 0);
  }, 0);

  // Calculate Shutterstock vs AI Tools Comparison
  const totalAllTasks = tasks.length;
  
  // Count tasks with Shutterstock only
  const shutterstockOnlyTasks = tasks.filter((task) => {
    const useShutterstock = task.data_task?.useShutterstock || task.useShutterstock || false;
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return useShutterstock === true && (!aiUsed || aiUsed.length === 0);
  }).length;
  
  // Count tasks with AI Tools only
  const aiToolsOnlyTasks = tasks.filter((task) => {
    const useShutterstock = task.data_task?.useShutterstock || task.useShutterstock || false;
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return useShutterstock === false && aiUsed && aiUsed.length > 0;
  }).length;
  
  // Count tasks with both Shutterstock and AI Tools
  const bothTasks = tasks.filter((task) => {
    const useShutterstock = task.data_task?.useShutterstock || task.useShutterstock || false;
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return useShutterstock === true && aiUsed && aiUsed.length > 0;
  }).length;
  
  // Count tasks with neither
  const neitherTasks = totalAllTasks - shutterstockOnlyTasks - aiToolsOnlyTasks - bothTasks;
  
  // Calculate total counts (including overlaps)
  const totalShutterstockTasks = shutterstockOnlyTasks + bothTasks;
  const totalAIToolsTasks = aiToolsOnlyTasks + bothTasks;
  
  // Calculate sum of visible rows (Shutterstock Only + AI Tools Only)
  const totalVisibleTasks = shutterstockOnlyTasks + aiToolsOnlyTasks;
  
  // Calculate percentages based on total of all tasks (124)
  const shutterstockOnlyPercentage = totalAllTasks > 0 ? Math.round((shutterstockOnlyTasks / totalAllTasks) * 100) : 0;
  const aiToolsOnlyPercentage = totalAllTasks > 0 ? Math.round((aiToolsOnlyTasks / totalAllTasks) * 100) : 0;
  const totalVisiblePercentage = totalAllTasks > 0 ? Math.round((totalVisibleTasks / totalAllTasks) * 100) : 0;
  
  // Create comparison table data
  const comparisonTableData = [
    {
      tool: "Shutterstock Only",
      tasks: shutterstockOnlyTasks,
      percentage: shutterstockOnlyPercentage,
      ofTotalTask: totalAllTasks,
    },
    {
      tool: "AI Tools Only",
      tasks: aiToolsOnlyTasks,
      percentage: aiToolsOnlyPercentage,
      ofTotalTask: totalAllTasks,
    },
    {
      tool: "Total (Shutterstock + AI Tools)",
      tasks: totalVisibleTasks,
      percentage: totalVisiblePercentage,
      ofTotalTask: totalAllTasks,
      bold: true,
      highlight: true,
    },
  ];
  
  // Create comparison table columns
  const comparisonTableColumns = [
    { key: "tool", header: "Tool Type", align: "left" },
    {
      key: "tasks",
      header: "Tasks",
      align: "center",
      highlight: true,
    },
    {
      key: "percentage",
      header: "Percentage",
      align: "center",
      highlight: true,
      render: (value) => `${value}%`,
    },
    {
      key: "ofTotalTask",
      header: "Of Total Task",
      align: "center",
      highlight: true,
      render: (value) => value !== undefined && value !== null ? `of ${value}` : "of 0",
    },
  ];

  return {
    tableData: tableDataWithTotal,
    tableColumns,
    comparisonTableData,
    comparisonTableColumns,
    totalTasks,
    totalHours: Math.round(totalHours * 100) / 100,
    totalAllTasks, // Total of all tasks for percentage calculation explanation
  };
};


export const getShutterstockAnalyticsCardProps = (tasks, users, isLoading = false) => {
  const calculatedData = calculateShutterstockAnalytics(tasks, users);

  return {
    tasks: tasks || [],
    users: users || [],
    isLoading,
    totalTasks: calculatedData.totalTasks,
    totalHours: calculatedData.totalHours,
    hasNoData: calculatedData.totalTasks === 0,
  };
};


export const getCachedShutterstockAnalyticsCardProps = (
  tasks,
  users = [],
  isLoading = false
) => {
  return getShutterstockAnalyticsCardProps(tasks, users, isLoading);
};

