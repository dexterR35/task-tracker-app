import React, { useMemo } from "react";
import LargeAnalyticsCard from "@/components/Cards/LargeAnalyticsCard";
import { Icons } from "@/components/icons";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";
import { 
  calculateMarketBadges, 
  calculateAnalyticsData, 
  generateCategoryTableData, 
  generateCategoryChartData 
} from "@/utils/analyticsHelpers";

const CategoryBreakdownCard = ({ tasks, selectedMonth, isLoading = false }) => {
  // Tasks are already filtered by month from useMonthSelection, no need for additional filtering
  const filteredTasks = useMemo(() => {
    return tasks || [];
  }, [tasks]);

  // Get top 3 calculations for this card
  const top3Data = useTop3Calculations(
    { tasks: filteredTasks },
    {
      selectedUserId: null,
      selectedReporterId: null,
      selectedMonthId: selectedMonth?.monthId,
      department: null,
      limit: 3,
    }
  );

  // Calculate market badges from tasks
  const marketBadges = useMemo(() => calculateMarketBadges(filteredTasks), [filteredTasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <LargeAnalyticsCard
        title="Task Breakdown by Category"
        subtitle="Current Period Analysis"
        icon={Icons.generic.chart}
        color="blue"
        top3Data={{}}
        marketBadges={[]}
        isLoading={true}
      />
    );
  }

  // Calculate analytics data
  const analyticsData = useMemo(() => calculateAnalyticsData(filteredTasks), [filteredTasks]);

  const tableData = generateCategoryTableData(analyticsData);

  const tableColumns = [
    { key: "category", header: "Category", align: "left" },
    { key: "casino", header: "Casino", align: "center" },
    { key: "sport", header: "Sport", align: "center" },
    { key: "poker", header: "Poker", align: "center" },
    { key: "lotto", header: "Lotto", align: "center" },
    { key: "total", header: "Total", align: "center", highlight: true }
  ];

  const chartData = generateCategoryChartData(analyticsData);

  return (
    <LargeAnalyticsCard
      title="Task Breakdown by Category"
      subtitle={`${selectedMonth?.monthName || 'Current Month'} Analysis`}
      icon={Icons.generic.chart}
      color="blue"
      top3Data={top3Data}
      marketBadges={marketBadges}
      isLoading={isLoading}
    />
  );
};

export default CategoryBreakdownCard;
