import React, { useMemo } from "react";
import LargeAnalyticsCard from "./LargeAnalyticsCard";
import { Icons } from "@/components/icons";
import { useTop3Calculations } from "@/hooks/useTop3Calculations";

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
  const marketBadges = useMemo(() => {
    const marketCounts = {};
    filteredTasks.forEach(task => {
      const markets = task.data_task?.markets || task.markets;
      if (markets && Array.isArray(markets)) {
        markets.forEach(market => {
          if (market) {
            marketCounts[market] = (marketCounts[market] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(marketCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([market, count]) => ({ market, count }));
  }, [filteredTasks]);

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
  const analyticsData = useMemo(() => {
    const data = {
      acquisition: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
      product: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
      marketing: { casino: 0, sport: 0, poker: 0, lotto: 0, total: 0 },
      grandTotal: 0
    };

    filteredTasks.forEach(task => {
      const product = task.data_task?.products || task.products;
      if (!product) return;

      // Count tasks by category and product
      if (product.includes('acquisition')) {
        if (product.includes('casino')) data.acquisition.casino++;
        if (product.includes('sport')) data.acquisition.sport++;
        if (product.includes('poker')) data.acquisition.poker++;
        if (product.includes('lotto')) data.acquisition.lotto++;
        data.acquisition.total++;
      } else if (product.includes('product')) {
        if (product.includes('casino')) data.product.casino++;
        if (product.includes('sport')) data.product.sport++;
        if (product.includes('poker')) data.product.poker++;
        if (product.includes('lotto')) data.product.lotto++;
        data.product.total++;
      } else if (product.includes('marketing')) {
        if (product.includes('casino')) data.marketing.casino++;
        if (product.includes('sport')) data.marketing.sport++;
        if (product.includes('poker')) data.marketing.poker++;
        if (product.includes('lotto')) data.marketing.lotto++;
        data.marketing.total++;
      }

      data.grandTotal++;
    });

    return data;
  }, [filteredTasks]);

  const tableData = [
    { 
      category: "Acquisition", 
      casino: analyticsData.acquisition.casino, 
      sport: analyticsData.acquisition.sport, 
      poker: analyticsData.acquisition.poker, 
      lotto: analyticsData.acquisition.lotto, 
      total: analyticsData.acquisition.total 
    },
    { 
      category: "Product", 
      casino: analyticsData.product.casino, 
      sport: analyticsData.product.sport, 
      poker: analyticsData.product.poker, 
      lotto: analyticsData.product.lotto, 
      total: analyticsData.product.total 
    },
    { 
      category: "Marketing", 
      casino: analyticsData.marketing.casino, 
      sport: analyticsData.marketing.sport, 
      poker: analyticsData.marketing.poker, 
      lotto: analyticsData.marketing.lotto, 
      total: analyticsData.marketing.total 
    },
    { 
      category: "Grand Total", 
      casino: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino, 
      sport: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport, 
      poker: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker, 
      lotto: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto, 
      total: analyticsData.grandTotal, 
      bold: true, 
      highlight: true 
    }
  ];

  const tableColumns = [
    { key: "category", header: "Category", align: "left" },
    { key: "casino", header: "Casino", align: "center" },
    { key: "sport", header: "Sport", align: "center" },
    { key: "poker", header: "Poker", align: "center" },
    { key: "lotto", header: "Lotto", align: "center" },
    { key: "total", header: "Total", align: "center", highlight: true }
  ];

  const chartData = [
    { name: "Acquisition", value: analyticsData.acquisition.total },
    { name: "Product", value: analyticsData.product.total },
    { name: "Marketing", value: analyticsData.marketing.total }
  ];

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
