import React, { useMemo } from "react";
import AnalyticsCard from "@/components/Cards/AnalyticsCard";

const AcquisitionAnalyticsCard = ({ tasks, selectedMonth, isLoading = false }) => {
  // Filter tasks for acquisition category
  const acquisitionTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      const products = task.data_task?.products || task.products;
      return products && products.includes('acquisition');
    });
  }, [tasks]);

  // Show skeleton if loading or no tasks yet
  if (isLoading || !tasks || tasks.length === 0) {
    return (
      <AnalyticsCard
        title="Acquisition Task Breakdown"
        tableData={[]}
        tableColumns={[]}
        chartData={[]}
        chartTitle="Acquisition Tasks"
        colors={["#10b981", "#059669", "#047857"]}
        isLoading={true}
      />
    );
  }

  // Calculate analytics data for acquisition tasks
  const analyticsData = useMemo(() => {
    const data = {
      casino: 0,
      sport: 0,
      poker: 0,
      lotto: 0,
      total: 0
    };

    acquisitionTasks.forEach(task => {
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
  }, [acquisitionTasks]);

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
      title="Acquisition Task Breakdown"
      tableData={tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Acquisition Tasks by Product"
      colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]}
      isLoading={isLoading}
    />
  );
};

export default AcquisitionAnalyticsCard;
