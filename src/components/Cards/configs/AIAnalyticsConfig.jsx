import React from "react";
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";
import { addConsistentColors, CHART_COLORS, CHART_DATA_TYPE, addGrandTotalRow } from "./analyticsSharedConfig";

/**
 * AI Analytics Configuration
 * Handles AI-specific analytics calculations and card props
 */

export const calculateAIAnalyticsData = (tasks, users) => {
  if (!tasks || tasks.length === 0) {
    return {
      tableData: [],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        {
          key: "totalTasks",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "aiUsedTasks",
          header: "AI Used Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "aiTime",
          header: "AI Time (hrs)",
          align: "center",
          highlight: true,
        },
        {
          key: "aiUsagePercentage",
          header: "AI Usage %",
          align: "center",
          highlight: true,
        },
        {
          key: "aiModels",
          header: "AI Models Used",
          align: "left",
          render: (value, row) => {
            if (!value) return value;
            const aiModels = value.split(", ").filter((m) => m.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {aiModels.map((model, index) => (
                  <Badge key={index} color="purple" size="sm">
                    {model}
                  </Badge>
                ))}
              </div>
            );
          },
        },
        {
          key: "markets",
          header: "Markets",
          align: "left",
          render: (value, row) => {
            if (!value) return value;
            const markets = value.split(", ").filter((m) => m.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {markets.map((market, index) => (
                  <Badge key={index} color="amber" size="sm">
                    {market}
                  </Badge>
                ))}
              </div>
            );
          },
        },
        {
          key: "products",
          header: "Products",
          align: "left",
          render: (value, row) => {
            if (!value) return value;
            const products = value.split(", ").filter((p) => p.trim());
            return (
              <div className="flex flex-wrap gap-1">
                {products.map((product, index) => (
                  <Badge key={index} color="blue" size="sm">
                    {product}
                  </Badge>
                ))}
              </div>
            );
          },
        },
      ],
      aiModelsData: [],
      usersAIData: [],
      usersBiaxialData: [],
      marketsAIData: [],
      productsAIData: [],
      marketsBiaxialData: [],
      productsBiaxialData: [],
    };
  }

  // Initialize data structures
  const userAIData = {};
  const aiModelCounts = {};
  const aiModelHours = {};
  const marketAICounts = {};
  const productAICounts = {};
  const allUsers = new Set();
  const allAIModels = new Set();
  const allMarkets = new Set();
  const allProducts = new Set();

  // Check if there are any tasks with AI usage
  const hasAIUsage = tasks.some((task) => {
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return aiUsed && aiUsed.length > 0;
  });

  if (!hasAIUsage) {
    return {
      tableData: [],
      tableColumns: [
        { key: "user", header: "User", align: "left" },
        {
          key: "totalTasks",
          header: "Total Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "aiUsedTasks",
          header: "AI Used Tasks",
          align: "center",
          highlight: true,
        },
        {
          key: "aiTime",
          header: "AI Time (hrs)",
          align: "center",
          highlight: true,
        },
        {
          key: "aiUsagePercentage",
          header: "AI Usage %",
          align: "center",
          highlight: true,
        },
        { key: "aiModels", header: "AI Models Used", align: "left" },
        { key: "markets", header: "Markets", align: "left" },
        { key: "products", header: "Products", align: "left" },
      ],
      aiModelsData: [],
      aiModelsBiaxialData: [],
      usersAIData: [],
      usersBiaxialData: [],
      marketsAIData: [],
      productsAIData: [],
      marketsBiaxialData: [],
      productsBiaxialData: [],
    };
  }

  // Process tasks to extract AI usage data
  tasks.forEach((task) => {
    const userId = task.userUID || task.createbyUID;
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    const markets = task.data_task?.markets || task.markets || [];
    const products = task.data_task?.products || task.products || "";

    if (!userId || !aiUsed || aiUsed.length === 0) return;

    allUsers.add(userId);

    // Initialize user data if not exists
    if (!userAIData[userId]) {
      userAIData[userId] = {
        totalTasks: 0,
        totalAITime: 0,
        aiModels: new Set(),
        aiUsedCount: 0,
        markets: new Set(),
        products: new Set(),
      };
    }

    // Count tasks with AI usage
    userAIData[userId].totalTasks += 1;
    userAIData[userId].aiUsedCount += aiUsed.length;

    // Add markets and products to user's sets and global sets
    if (Array.isArray(markets)) {
      markets.forEach((market) => {
        if (market) {
          allMarkets.add(market);
          userAIData[userId].markets.add(market);
        }
      });
    }

    if (products && typeof products === "string") {
      allProducts.add(products);
      userAIData[userId].products.add(products);
    }

    // Process each AI usage entry
    aiUsed.forEach((ai) => {
      const aiTime = ai.aiTime || 0;
      const aiModels = ai.aiModels || [];

      userAIData[userId].totalAITime += aiTime;

      // Add AI models to user's set and track hours
      aiModels.forEach((model) => {
        allAIModels.add(model);
        userAIData[userId].aiModels.add(model);
        aiModelCounts[model] = (aiModelCounts[model] || 0) + 1;
        aiModelHours[model] = (aiModelHours[model] || 0) + aiTime;
      });
    });
  });

  // Create table data
  let tableData = Array.from(allUsers).map((userId) => {
    const user = users.find((u) => (u.id || u.uid || u.userUID) === userId);
    const userName = user?.name || user?.email || `User ${userId.slice(0, 8)}`;
    const userData = userAIData[userId];

    return {
      user: userName,
      totalTasks: userData.totalTasks,
      aiUsedTasks: userData.aiUsedCount,
      aiTime: Math.round(userData.totalAITime * 100) / 100,
      aiModels: Array.from(userData.aiModels).join(", "),
      markets: Array.from(userData.markets).join(", "),
      products: Array.from(userData.products).join(", "),
      aiUsagePercentage:
        userData.totalTasks > 0
          ? Math.min(Math.round((userData.aiUsedCount / userData.totalTasks) * 100), 100)
          : 0,
    };
  });

  // Sort by AI time descending
  tableData.sort((a, b) => b.aiTime - a.aiTime);

  // Add grand total row using shared utility
  if (tableData.length > 0) {
    const grandTotalTasks = tableData.reduce((sum, row) => sum + row.totalTasks, 0);
    const grandTotalAiUsedTasks = tableData.reduce((sum, row) => sum + row.aiUsedTasks, 0);
    const aiUsagePercentage = grandTotalTasks > 0
      ? Math.min(Math.round((grandTotalAiUsedTasks / grandTotalTasks) * 100), 100)
      : 0;

    tableData = addGrandTotalRow(tableData, {
      labelKey: 'user',
      labelValue: 'Grand Total',
      sumColumns: ['totalTasks', 'aiUsedTasks', 'aiTime'],
      customValues: {
        aiModels: Array.from(allAIModels).join(", "),
        markets: Array.from(allMarkets).join(", "),
        products: Array.from(allProducts).join(", "),
        aiUsagePercentage: aiUsagePercentage,
      },
    });
  }

  // Create table columns
  const tableColumns = [
    { key: "user", header: "User", align: "left" },
    {
      key: "totalTasks",
      header: "Total Tasks",
      align: "center",
      highlight: true,
    },
    {
      key: "aiUsedTasks",
      header: "AI Used Tasks",
      align: "center",
      highlight: true,
    },
    {
      key: "aiTime",
      header: "AI Time (hrs)",
      align: "center",
      highlight: true,
    },
    {
      key: "aiUsagePercentage",
      header: "AI Usage %",
      align: "center",
      highlight: true,
    },
    {
      key: "aiModels",
      header: "AI Models Used",
      align: "left",
      render: (value, row) => {
        if (!value) return value;
        const aiModels = value.split(", ").filter((m) => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {aiModels.map((model, index) => (
              <Badge
                key={index}
                colorHex={CARD_SYSTEM.COLOR_HEX_MAP.purple}
                size="xs"
              >
                {model}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "markets",
      header: "Markets",
      align: "left",
      render: (value, row) => {
        if (!value) return value;
        const markets = value.split(", ").filter((m) => m.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {markets.map((market, index) => (
              <Badge
                key={index}
                colorHex={CARD_SYSTEM.COLOR_HEX_MAP.amber}
                size="xs"
              >
                {market}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "products",
      header: "Products",
      align: "left",
      render: (value, row) => {
        if (!value) return value;
        const products = value.split(", ").filter((p) => p.trim());
        return (
          <div className="flex flex-wrap gap-1">
            {products.map((product, index) => (
              <Badge
                key={index}
                colorHex={CARD_SYSTEM.COLOR_HEX_MAP.blue}
                size="xs"
              >
                {product}
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  // Create AI models pie chart data
  const aiModelsData = addConsistentColors(
    Array.from(allAIModels)
      .map((model) => ({
        name: model,
        value: aiModelCounts[model] || 0,
      }))
      .sort((a, b) => b.value - a.value),
    CHART_DATA_TYPE.AI_MODEL
  );

  // Create AI models biaxial chart data (tasks and hours)
  const aiModelsBiaxialData = addConsistentColors(
    Array.from(allAIModels)
      .map((model) => ({
        name: model,
        tasks: aiModelCounts[model] || 0,
        hours: Math.round((aiModelHours[model] || 0) * 100) / 100,
      }))
      .filter((item) => item.tasks > 0)
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    CHART_DATA_TYPE.AI_MODEL
  );

  // Create users AI usage pie chart data
  const usersAIData = addConsistentColors(
    tableData
      .filter((row) => !row.bold) // Exclude grand total row
      .map((row) => ({
        name: row.user,
        value: row.aiTime,
      }))
      .sort((a, b) => b.value - a.value),
    CHART_DATA_TYPE.USER
  );

  // Create users biaxial chart data (AI time vs AI tasks)
  const usersBiaxialData = addConsistentColors(
    tableData
      .filter((row) => !row.bold) // Exclude grand total row
      .map((row) => ({
        name: row.user,
        tasks: row.aiUsedTasks,
        hours: row.aiTime,
      }))
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    CHART_DATA_TYPE.USER
  );

  // Create markets AI usage pie chart data
  const marketsAIData = addConsistentColors(
    Array.from(allMarkets)
      .map((market) => {
        // Count tasks that have AI usage and include this market
        const marketAICount = tasks.filter((task) => {
          const taskMarkets = task.data_task?.markets || task.markets || [];
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskMarkets.includes(market) && aiUsed.length > 0;
        }).length;

        // Calculate total AI time for this market
        const marketAITime = tasks
          .filter((task) => {
            const taskMarkets = task.data_task?.markets || task.markets || [];
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return taskMarkets.includes(market) && aiUsed.length > 0;
          })
          .reduce((sum, task) => {
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return (
              sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0)
            );
          }, 0);

        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        
        return {
          name: normalizedMarket,
          value: marketAICount,
          hours: Math.round(marketAITime * 100) / 100,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => {
        // Sort by tasks/value first (descending), then by hours (descending)
        if (b.value !== a.value) {
          return b.value - a.value;
        }
        return b.hours - a.hours;
      })
      .map(({ hours, ...rest }) => rest), // Remove hours from final data
    CHART_DATA_TYPE.MARKET
  );

  // Create products AI usage pie chart data
  const productsAIData = addConsistentColors(
    Array.from(allProducts)
      .map((product) => {
        // Count tasks that have AI usage and match this product
        const productAICount = tasks.filter((task) => {
          const taskProducts = task.data_task?.products || task.products || "";
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskProducts === product && aiUsed.length > 0;
        }).length;

        return {
          name: product,
          value: productAICount,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value),
    CHART_DATA_TYPE.PRODUCT
  );

  // Create markets biaxial chart data (AI usage by market)
  const marketsBiaxialData = addConsistentColors(
    Array.from(allMarkets)
      .map((market) => {
        // Count tasks that have AI usage and include this market
        const marketAICount = tasks.filter((task) => {
          const taskMarkets = task.data_task?.markets || task.markets || [];
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskMarkets.includes(market) && aiUsed.length > 0;
        }).length;

        // Calculate total AI time for this market
        const marketAITime = tasks
          .filter((task) => {
            const taskMarkets = task.data_task?.markets || task.markets || [];
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return taskMarkets.includes(market) && aiUsed.length > 0;
          })
          .reduce((sum, task) => {
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return (
              sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0)
            );
          }, 0);

        // Normalize market to uppercase for consistent color mapping
        const normalizedMarket = market.trim().toUpperCase();
        
        return {
          name: normalizedMarket,
          tasks: marketAICount,
          hours: Math.round(marketAITime * 100) / 100,
        };
      })
      .filter((item) => item.tasks > 0)
      .sort((a, b) => {
        // Sort by tasks first (descending), then by hours (descending)
        if (b.tasks !== a.tasks) {
          return b.tasks - a.tasks;
        }
        return b.hours - a.hours;
      }),
    CHART_DATA_TYPE.MARKET
  );

  // Create products biaxial chart data (AI usage by product)
  const productsBiaxialData = addConsistentColors(
    Array.from(allProducts)
      .map((product) => {
        // Count tasks that have AI usage and match this product
        const productAICount = tasks.filter((task) => {
          const taskProducts = task.data_task?.products || task.products || "";
          const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
          return taskProducts === product && aiUsed.length > 0;
        }).length;

        // Calculate total AI time for this product
        const productAITime = tasks
          .filter((task) => {
            const taskProducts =
              task.data_task?.products || task.products || "";
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return taskProducts === product && aiUsed.length > 0;
          })
          .reduce((sum, task) => {
            const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
            return (
              sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0)
            );
          }, 0);

        return {
          name: product,
          tasks: productAICount,
          hours: Math.round(productAITime * 100) / 100,
        };
      })
      .filter((item) => item.tasks > 0)
      .sort((a, b) => b.tasks - a.tasks),
    CHART_DATA_TYPE.PRODUCT
  );

  return {
    tableData,
    tableColumns,
    aiModelsData,
    aiModelsBiaxialData,
    usersAIData,
    usersBiaxialData,
    marketsAIData,
    productsAIData,
    marketsBiaxialData,
    productsBiaxialData,
  };
};

export const getAIAnalyticsCardProps = (tasks, users, isLoading = false) => {
  const calculatedData = calculateAIAnalyticsData(tasks, users);

  // Calculate totals for chart titles - only count tasks that actually used AI
  const totalAITasks = tasks?.filter((task) => {
    const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
    return aiUsed.length > 0;
  }).length || 0;
  const totalAITime =
    tasks?.reduce((sum, task) => {
      const aiUsed = task.data_task?.aiUsed || task.aiUsed || [];
      return sum + aiUsed.reduce((aiSum, ai) => aiSum + (ai.aiTime || 0), 0);
    }, 0) || 0;

  return {
    title: "AI Usage Analytics",
    aiTableData: calculatedData.tableData,
    aiTableColumns: calculatedData.tableColumns,
    aiModelsData: calculatedData.aiModelsData,
    aiModelsTitle: `AI Models Usage (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    aiModelsColors: calculatedData.aiModelsData.map((item) => item.color),
    aiModelsBiaxialData: calculatedData.aiModelsBiaxialData,
    aiModelsBiaxialTitle: `AI Models: AI Tasks & AI Time (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    aiModelsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    aiModelsBiaxialHoursColor: CHART_COLORS.DEFAULT[1],
    usersAIData: calculatedData.usersAIData,
    usersAITitle: `Users by AI Time (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    usersAIColors: calculatedData.usersAIData.map((item) => item.color),
    usersBiaxialData: calculatedData.usersBiaxialData,
    usersBiaxialTitle: `Users: AI Time & AI Tasks (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    usersBiaxialTimeColor: CHART_COLORS.DEFAULT[0],
    usersBiaxialTasksColor: CHART_COLORS.DEFAULT[1],
    marketsAIData: calculatedData.marketsAIData,
    marketsAITitle: `Markets AI Usage (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    marketsAIColors: calculatedData.marketsAIData.map((item) => item.color),
    productsAIData: calculatedData.productsAIData,
    productsAITitle: `Products AI Usage (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    productsAIColors: calculatedData.productsAIData.map((item) => item.color),
    marketsBiaxialData: calculatedData.marketsBiaxialData,
    marketsBiaxialTitle: `Markets: AI Tasks & AI Time (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    marketsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    marketsBiaxialTimeColor: CHART_COLORS.DEFAULT[1],
    productsBiaxialData: calculatedData.productsBiaxialData,
    productsBiaxialTitle: `Products: AI Tasks & AI Time (${totalAITasks} tasks, ${Math.round(totalAITime * 100) / 100}h)`,
    productsBiaxialTasksColor: CHART_COLORS.DEFAULT[0],
    productsBiaxialTimeColor: CHART_COLORS.DEFAULT[1],
    isLoading,
  };
};

// Simplified version without caching
export const getCachedAIAnalyticsCardProps = (
  tasks,
  users,
  month,
  isLoading = false
) => {
  return getAIAnalyticsCardProps(tasks, users, isLoading);
};

