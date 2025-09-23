import React, { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";

const MarketingAnalyticsCard = ({ tasks, selectedMonth, isLoading = false }) => {
  // Filter tasks for marketing category
  const marketingTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      const products = task.data_task?.products || task.products;
      return products && products.includes('marketing');
    });
  }, [tasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title="Marketing Task Breakdown"
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle="Marketing Tasks"
        colors={["#8b5cf6", "#7c3aed", "#6d28d9"]}
        isLoading={true}
      />
    );
  }

  // Calculate analytics data for marketing tasks
  const analyticsData = useMemo(() => {
    const data = {
      casino: 0,
      sport: 0,
      poker: 0,
      lotto: 0,
      total: 0
    };

    marketingTasks.forEach(task => {
      const products = task.data_task?.products || task.products;
      if (!products) return;

      // Count tasks by product type
      if (products.includes('casino')) data.casino++;
      if (products.includes('sport')) data.sport++;
      if (products.includes('poker')) data.poker++;
      if (products.includes('lotto')) data.lotto++;
      data.total++;
    });

    return data;
  }, [marketingTasks]);

  const tableData = [
    { 
      product: "Casino", 
      tasks: analyticsData.casino,
      percentage: analyticsData.total > 0 ? ((analyticsData.casino / analyticsData.total) * 100).toFixed(1) : 0
    },
    { 
      product: "Sport", 
      tasks: analyticsData.sport,
      percentage: analyticsData.total > 0 ? ((analyticsData.sport / analyticsData.total) * 100).toFixed(1) : 0
    },
    { 
      product: "Poker", 
      tasks: analyticsData.poker,
      percentage: analyticsData.total > 0 ? ((analyticsData.poker / analyticsData.total) * 100).toFixed(1) : 0
    },
    { 
      product: "Lotto", 
      tasks: analyticsData.lotto,
      percentage: analyticsData.total > 0 ? ((analyticsData.lotto / analyticsData.total) * 100).toFixed(1) : 0
    },
    { 
      product: "Total", 
      tasks: analyticsData.total,
      percentage: 100,
      bold: true, 
      highlight: true 
    }
  ];

  const tableColumns = [
    { key: "product", header: "Product", align: "left" },
    { key: "tasks", header: "Tasks", align: "center" },
    { key: "percentage", header: "%", align: "center", highlight: true }
  ];

  const chartData = [
    { name: "Casino", value: analyticsData.casino },
    { name: "Sport", value: analyticsData.sport },
    { name: "Poker", value: analyticsData.poker },
    { name: "Lotto", value: analyticsData.lotto }
  ];

  return (
    <AnalyticsCard
      title="Marketing Task Breakdown"
      tableData={tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Marketing Tasks by Product"
      colors={["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"]}
      isLoading={isLoading}
    />
  );
};

export default MarketingAnalyticsCard;
