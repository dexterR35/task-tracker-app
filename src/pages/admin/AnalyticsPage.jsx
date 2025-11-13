import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import MarketsByUsersCard from "@/components/Cards/MarketsByUsersCard";
import MarketingAnalyticsCard from "@/components/Cards/MarketingAnalyticsCard";
import AcquisitionAnalyticsCard from "@/components/Cards/AcquisitionAnalyticsCard";
import ProductAnalyticsCard from "@/components/Cards/ProductAnalyticsCard";
import MiscAnalyticsCard from "@/components/Cards/MiscAnalyticsCard";
import AIAnalyticsCard from "@/components/Cards/AIAnalyticsCard";
import ReporterAnalyticsCard from "@/components/Cards/ReporterAnalyticsCard";
import TotalAnalyticsCard from "@/components/Cards/TotalAnalyticsCard";
import {
  getCachedMarketingAnalyticsCardProps,
  getCachedAcquisitionAnalyticsCardProps,
  getCachedProductAnalyticsCardProps,
  getCachedMiscAnalyticsCardProps,
  getCachedAIAnalyticsCardProps,
  getCachedReporterAnalyticsCardProps,
  getCachedMarketsByUsersCardProps,
  getCachedTotalAnalyticsCardProps,
} from "@/components/Cards/analyticsCardConfig";
import { MonthProgressBar } from "@/utils/monthUtils.jsx";
import { SkeletonAnalyticsCard } from "@/components/ui/Skeleton/Skeleton";
import DynamicButton from "@/components/ui/Button/DynamicButton";

import { CARD_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";

const AnalyticsPage = () => {
  // Get real-time data from month selection
  const { users, reporters, error } = useAppDataContext();

  // View mode state - 'overview' shows all cards, 'detailed' shows single card
  const [viewMode, setViewMode] = useState("overview");
  const [selectedCard, setSelectedCard] = useState(null);

  const {
    tasks, // Real-time tasks data (selected or current month)
    availableMonths, // Available months for dropdown
    currentMonth, // Current month info
    selectedMonth, // Selected month info
    isCurrentMonth, // Boolean check
    isLoading, // Loading state for selected month
    isInitialLoading, // Loading state for initial month data
    error: monthError, // Error state
    selectMonth, // Function to select month
  } = useAppDataContext();

  // Get current month name for display
  const currentMonthName = currentMonth?.monthName || "Current Month";
  const selectedMonthName = selectedMonth?.monthName || currentMonthName;

  // Calculate summary metrics (KPIs)
  // All metrics use unique counts (not per-market/category counts)
  const summaryMetrics = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        totalHours: 0,
        totalDeliverables: 0,
        totalVariations: 0,
        uniqueUsers: 0,
        uniqueMarkets: 0,
        uniqueReporters: 0,
      };
    }

    // Use unique tasks count (not sum of market/category counts)
    // This counts each task once, regardless of how many markets it has
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((sum, task) => {
      const hours = task.data_task?.timeInHours || task.timeInHours || 0;
      return sum + (typeof hours === "number" ? hours : 0);
    }, 0);

    const totalDeliverables = tasks.reduce((sum, task) => {
      const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      return sum + deliverables.reduce((delSum, del) => {
        return delSum + (del.count || 1);
      }, 0);
    }, 0);

    const totalVariations = tasks.reduce((sum, task) => {
      const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
      return sum + deliverables.reduce((delSum, del) => {
        return delSum + (del.variationsCount || 0);
      }, 0);
    }, 0);

    const uniqueUsers = new Set(
      tasks.map((task) => task.userUID || task.createbyUID).filter(Boolean)
    ).size;

    const uniqueMarkets = new Set(
      tasks.map((task) => task.data_task?.market || task.market).filter(Boolean)
    ).size;

    const uniqueReporters = new Set(
      tasks.map((task) => task.data_task?.reporter || task.reporter).filter(Boolean)
    ).size;

    return {
      totalTasks,
      totalHours: Math.round(totalHours * 100) / 100,
      totalDeliverables,
      totalVariations,
      uniqueUsers,
      uniqueMarkets,
      uniqueReporters,
    };
  }, [tasks]);

  // Helper function to check if data is empty
  const hasNoData = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return true;
    }
    return false;
  }, [tasks]);

  // Calculate Acquisition metrics for Markets KPI card
  const acquisitionMetrics = useMemo(() => {
    if (isLoading || hasNoData) {
      return { totalTasks: 0, totalHours: 0 };
    }
    try {
      const acquisitionProps = getCachedAcquisitionAnalyticsCardProps(tasks, users);
      return {
        totalTasks: acquisitionProps?.totalTasks || 0,
        totalHours: acquisitionProps?.totalHours || 0,
      };
    } catch (error) {
      logger.error('Error calculating acquisition metrics:', error);
      return { totalTasks: 0, totalHours: 0 };
    }
  }, [tasks, users, isLoading, hasNoData]);

  // Calculate Marketing metrics for Deliverables KPI card
  const marketingMetrics = useMemo(() => {
    if (isLoading || hasNoData) {
      return { totalTasks: 0, totalHours: 0 };
    }
    try {
      const marketingProps = getCachedMarketingAnalyticsCardProps(tasks, users);
      return {
        totalTasks: marketingProps?.totalTasks || 0,
        totalHours: marketingProps?.totalHours || 0,
      };
    } catch (error) {
      logger.error('Error calculating marketing metrics:', error);
      return { totalTasks: 0, totalHours: 0 };
    }
  }, [tasks, users, isLoading, hasNoData]);

  // Analytics cards configuration
  const analyticsCards = useMemo(
    () => [
      {
        id: "total-analytics",
        name: "Total Analytics",
        description: "View  all hours by Product, Acquisition, and Marketing",
        icon: Icons.generic.chart,
        color: "blue",
      },
      {
        id: "markets-by-users",
        name: "Markets by Users",
        description: "View  tasks by markets and users",
        icon: Icons.generic.globe,
        color: "green",
      },
      {
        id: "marketing-analytics",
        name: "Marketing Analytics",
        description: "View  marketing hours",
        icon: Icons.generic.target,
        color: "purple",
      },
      {
        id: "acquisition-analytics",
        name: "Acquisition Analytics",
        description: "View  acquisition tasks and hours",
        icon: Icons.generic.target,
        color: "orange",
      },
      {
        id: "product-analytics",
        name: "Product Analytics",
        description: "View  product tasks and hours",
        icon: Icons.generic.package,
        color: "amber",
      },
      {
        id: "misc-analytics",
        name: "Misc Analytics",
        description: "View misc product tasks and hours",
        icon: Icons.generic.product,
        color: "pink",
      },
      {
        id: "ai-analytics",
        name: "AI Analytics",
        description: "View AI usage by users and models",
        icon: Icons.generic.ai,
        color: "purple",
      },
      {
        id: "reporter-analytics",
        name: "Reporter Analytics",
        description: "View  tasks, hours, markets, and products by reporter",
        icon: Icons.admin.reporters,
        color: "orange",
      },
    ],
    []
  );

  // Handle card click to view in detail
  const handleCardClick = useCallback((cardId) => {
    setSelectedCard(cardId);
    setViewMode("detailed");
  }, []);

  // Handle back to overview
  const handleBackToOverview = useCallback(() => {
    setViewMode("overview");
    setSelectedCard(null);
  }, []);

  // Calculate props for all cards (for overview mode) or selected card (for detailed mode)
  // All card props now include unique tasks count (not sum of market/category counts)
  const getCardProps = useCallback((cardId) => {
    if (isLoading || hasNoData) return null;

    try {
      switch (cardId) {
        case "reporter-analytics":
          // Use unique tasks count (not sum of reporter counts)
          return getCachedReporterAnalyticsCardProps(tasks, reporters);
        case "markets-by-users":
          // Use unique tasks count (not sum of market counts)
          return getCachedMarketsByUsersCardProps(tasks, users);
        case "marketing-analytics":
          // Use unique tasks count (not sum of market counts)
          return getCachedMarketingAnalyticsCardProps(tasks, users);
        case "acquisition-analytics":
          // Use unique tasks count (not sum of market counts)
          return getCachedAcquisitionAnalyticsCardProps(tasks, users);
        case "product-analytics":
          // Use unique tasks count (not sum of market counts)
          return getCachedProductAnalyticsCardProps(tasks, users);
        case "misc-analytics":
          // Use unique tasks count (not sum of category counts)
          return getCachedMiscAnalyticsCardProps(tasks, users);
        case "ai-analytics":
          // Use unique tasks count (not sum of product/market/user counts)
          return getCachedAIAnalyticsCardProps(tasks, users);
        case "total-analytics":
          // Use unique tasks count across all categories
          return getCachedTotalAnalyticsCardProps(tasks);
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error calculating props for ${cardId}:`, error);
      return null;
    }
  }, [tasks, users, reporters, isLoading, hasNoData]);

  // Error handling function
  const showError = (message) => {
    logger.error(message);
    // You can replace this with a toast notification if you have one
    alert(message);
  };

  if (isLoading || isInitialLoading) {
    return (
      <div>
        {/* Page Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Month Progress Bar Skeleton */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>

        {/* Analytics Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonAnalyticsCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error || monthError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">
          Error loading analytics:{" "}
          {(error || monthError)?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  // Render KPI Card Component - Matching SmallCard design
  const KPICard = ({ title, value, icon: IconComponent, color, subtitle }) => {
    const cardColorHex = CARD_SYSTEM.COLOR_HEX_MAP[color] || CARD_SYSTEM.COLOR_HEX_MAP.blue;
    const styles = useMemo(
      () => ({
        iconGradient: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`,
      }),
      [cardColorHex]
    );

    return (
      <div className="card-small-modern group">
        {/* Accent border on top */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-10 rounded-t-xl"
          style={{
            background: cardColorHex,
          }}
        />

        <div className="flex flex-col h-full relative z-10">
          {/* Modern Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Modern Icon with gradient background */}
              <div
                className="relative flex-shrink-0"
                style={{
                  background: styles.iconGradient,
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: `0 4px 12px ${cardColorHex}25`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{ background: cardColorHex }}
                />
                <IconComponent className="relative w-5 h-5 text-white" />
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
                  {title}
                </h4>
              </div>
            </div>
          </div>

          {/* Value Display */}
          <div className="mb-2">
            <p
              className="text-4xl font-bold mb-2 leading-tight tracking-tight"
              style={{ color: cardColorHex }}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Analytics Card Preview - Matching SmallCard design
  const AnalyticsCardPreview = ({ card, onClick }) => {
    const cardProps = getCardProps(card.id);
    const hasData = cardProps && !cardProps.hasNoData;
    const cardColorHex = CARD_SYSTEM.COLOR_HEX_MAP[card.color] || CARD_SYSTEM.COLOR_HEX_MAP.blue;
    const styles = useMemo(
      () => ({
        iconGradient: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`,
        gradientBg: `linear-gradient(135deg, ${cardColorHex}15 0%, ${cardColorHex}05 100%)`,
        regularDetailBorder: `${cardColorHex}30`,
      }),
      [cardColorHex]
    );

    // Use unique tasks count from cardProps (not sum of market/category counts)
    // All analytics cards now show unique tasks in totals, with per-market/category counts in breakdowns
    const totalTasks = useMemo(() => {
      if (!cardProps || !hasData) return 0;
      return cardProps.totalTasks || 0; // This is already unique tasks count from configs
    }, [cardProps, hasData]);

    return (
      <div
        className="card-small-modern group cursor-pointer hover:shadow-xl transition-all duration-300"
        onClick={() => onClick(card.id)}
      >
        {/* Accent border on top */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-10 rounded-t-xl"
          style={{
            background: cardColorHex,
          }}
        />

        <div className="flex flex-col h-full relative z-10">
          {/* Modern Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Modern Icon with gradient background */}
              <div
                className="relative flex-shrink-0"
                style={{
                  background: styles.iconGradient,
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: `0 4px 12px ${cardColorHex}25`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{ background: cardColorHex }}
                />
                <card.icon className="relative w-5 h-5 text-white" />
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
                  {card.name}
                </h4>
              </div>
            </div>

            {/* Arrow icon */}
            <Icons.buttons.chevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              {card.description}
            </p>
          </div>

          {/* Status indicator */}
          <div
            className="p-2 rounded-lg border flex items-center justify-between mt-auto"
            style={{
              background: styles.gradientBg,
              borderColor: styles.regularDetailBorder,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: hasData ? cardColorHex : "#64748b",
                  boxShadow: `0 0 8px ${hasData ? cardColorHex : "#64748b"}60`,
                }}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {hasData ? "Data available" : "No data available"}
              </span>
            </div>
            {hasData && totalTasks > 0 && (
              <Badge
                variant={card.color}
                size="sm"
                className="shadow-sm"
              >
                {totalTasks.toLocaleString()} tasks
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render detailed card view
  const renderDetailedCard = () => {
    if (!selectedCard) return null;

    const cardProps = getCardProps(selectedCard);
    const card = analyticsCards.find((c) => c.id === selectedCard);

    if (!cardProps || cardProps.hasNoData) {
      return (
        <div className="card">
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Data Available
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                There is no data available for {card?.name || "this section"}. Data will
                appear once tasks are added for the selected month.
              </p>
              <DynamicButton
                onClick={handleBackToOverview}
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
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="mb-4">
            <DynamicButton
              onClick={handleBackToOverview}
              variant="primary"
              size="md"
              iconName="arrowLeft"
              iconCategory="buttons"
              iconPosition="left"
              className="font-semibold shadow-md my-4 py-3"
            >
              Back to Overview
            </DynamicButton>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {card?.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {card?.description}
          </p>
        </div>

        <div id={`${selectedCard}-card`}>
          {/* All analytics cards now use unique tasks count in totals (not sum of market/category counts) */}
          {selectedCard === "reporter-analytics" && (
            <ReporterAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "markets-by-users" && (
            <MarketsByUsersCard {...cardProps} />
          )}
          {selectedCard === "marketing-analytics" && (
            <MarketingAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "acquisition-analytics" && (
            <AcquisitionAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "product-analytics" && (
            <ProductAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "misc-analytics" && (
            <MiscAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "ai-analytics" && (
            <AIAnalyticsCard {...cardProps} />
          )}
          {selectedCard === "total-analytics" && (
            <TotalAnalyticsCard {...cardProps} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your task performance and analytics data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Month Selector */}
          <select
            value={selectedMonth?.monthId || currentMonth?.monthId || ""}
            onChange={(e) => selectMonth(e.target.value)}
            className="bg-white dark:bg-primary border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableMonths && availableMonths.length > 0
              ? availableMonths.map((month) => (
                  <option key={month.monthId} value={month.monthId}>
                    {month.monthName} {month.isCurrent ? "(Current)" : ""}
                  </option>
                ))
              : currentMonth && (
                  <option value={currentMonth.monthId}>
                    {currentMonth.monthName} (Current)
                  </option>
                )}
          </select>
        </div>
      </div>

      {/* Month Progress Bar */}
      <div className="mb-8">
        <MonthProgressBar
          monthId={selectedMonth?.monthId || currentMonth?.monthId}
          monthName={selectedMonth?.monthName || currentMonth?.monthName}
          isCurrentMonth={isCurrentMonth}
          startDate={selectedMonth?.startDate || currentMonth?.startDate}
          endDate={selectedMonth?.endDate || currentMonth?.endDate}
          daysInMonth={
            selectedMonth?.daysInMonth || currentMonth?.daysInMonth
          }
        />
      </div>

      {/* Detailed View */}
      {viewMode === "detailed" && renderDetailedCard()}

      {/* Overview Dashboard */}
      {viewMode === "overview" && (
        <div className="space-y-8">
          {/* KPI Cards Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Key Indicators
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                task performance metrics
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Tasks"
                value={summaryMetrics.totalTasks.toLocaleString()}
                icon={Icons.generic.task}
                color="blue"
                subtitle={`${summaryMetrics.uniqueUsers} active users`}
              />
              <KPICard
                title="Total Hours"
                value={summaryMetrics.totalHours.toLocaleString()}
                icon={Icons.generic.clock}
                color="green"
                subtitle={`Avg ${summaryMetrics.totalTasks > 0 ? (summaryMetrics.totalHours / summaryMetrics.totalTasks).toFixed(1) : 0}h per task`}
              />
              <KPICard
                title="Marketing"
                value={marketingMetrics.totalTasks.toLocaleString()}
                icon={Icons.generic.target}
                color="purple"
                subtitle={`${marketingMetrics.totalHours}h total`}
              />
              <KPICard
                title="Acquisition"
                value={acquisitionMetrics.totalTasks.toLocaleString()}
                icon={Icons.generic.globe}
                color="orange"
                subtitle={`${acquisitionMetrics.totalHours}h total`}
              />
            </div>
          </div>


          {/* Analytics Cards Grid */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Product statistics 
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click on any card to view detailed breakdown
              </p>
            </div>

            {hasNoData ? (
              <div className="card-small-modern">
                <div className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Icons.generic.document className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Data Available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      There is no data available for the selected month. Data will
                      appear once tasks are added.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {analyticsCards.map((card) => (
                  <AnalyticsCardPreview
                    key={card.id}
                    card={card}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Counting Logic Explanation */}
          <div className="mb-8">
            <div className="card  ">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    <Icons.generic.help className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How Task and Market Counting Works
                    </h3>
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <p className="font-medium mb-2">Example: 3 tasks with markets [UK,RO,IE], [RO,UK], [RO,IE] will show:</p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">Total: 3 tasks</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">(unique tasks - each task counted once)</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">RO: 3, IE: 2, UK: 2</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">(per market counts - how many times each market appears)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-2">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
                          <li><span className="font-medium text-gray-900 dark:text-white">Total Tasks</span> = Count of unique tasks (3 tasks in the example)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">RO: 3</span> = RO appears in 3 tasks (Task 1, Task 2, Task 3)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">IE: 2</span> = IE appears in 2 tasks (Task 1, Task 3)</li>
                          <li><span className="font-medium text-gray-900 dark:text-white">UK: 2</span> = UK appears in 2 tasks (Task 1, Task 2)</li>
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-500">
                    
                        <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600 dark:text-gray-400">
                          <li><span className="font-medium">Acquisition, Marketing, Product, Misc</span> - Total shows unique tasks, market breakdowns show per-market counts</li>
                          <li><span className="font-medium">AI Analytics</span> - Total shows unique tasks, breakdowns by product/market/user show per-category counts</li>
                          <li><span className="font-medium">Reporter Analytics</span> - Total shows unique tasks, breakdowns by reporter/market show per-category counts</li>
                          <li><span className="font-medium">Markets by Users</span> - Total shows unique tasks, market breakdowns show per-market counts</li>
                          <li><span className="font-medium">Total Analytics</span> - Shows unique tasks across all categories</li>
                        </ul>
                  
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
