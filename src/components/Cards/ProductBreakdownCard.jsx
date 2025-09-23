import React, { useMemo } from "react";
import AnalyticsCard from "./AnalyticsCard";

const ProductBreakdownCard = ({ tasks, selectedMonth }) => {
  // Tasks are already filtered by month from useMonthSelection, no need for additional filtering
  const filteredTasks = useMemo(() => {
    return tasks || [];
  }, [tasks]);

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
      product: "Casino", 
      acquisition: analyticsData.acquisition.casino, 
      product_dev: analyticsData.product.casino, 
      marketing: analyticsData.marketing.casino, 
      total: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino 
    },
    { 
      product: "Sport", 
      acquisition: analyticsData.acquisition.sport, 
      product_dev: analyticsData.product.sport, 
      marketing: analyticsData.marketing.sport, 
      total: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport 
    },
    { 
      product: "Poker", 
      acquisition: analyticsData.acquisition.poker, 
      product_dev: analyticsData.product.poker, 
      marketing: analyticsData.marketing.poker, 
      total: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker 
    },
    { 
      product: "Lotto", 
      acquisition: analyticsData.acquisition.lotto, 
      product_dev: analyticsData.product.lotto, 
      marketing: analyticsData.marketing.lotto, 
      total: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto 
    },
    { 
      product: "Grand Total", 
      acquisition: analyticsData.acquisition.total, 
      product_dev: analyticsData.product.total, 
      marketing: analyticsData.marketing.total, 
      total: analyticsData.grandTotal, 
      bold: true, 
      highlight: true 
    }
  ];

  const tableColumns = [
    { key: "product", header: "Product", align: "left" },
    { key: "acquisition", header: "Acquisition", align: "center" },
    { key: "product_dev", header: "Product", align: "center" },
    { key: "marketing", header: "Marketing", align: "center" },
    { key: "total", header: "Total", align: "center", highlight: true }
  ];

  const chartData = [
    { name: "Casino", value: analyticsData.acquisition.casino + analyticsData.product.casino + analyticsData.marketing.casino },
    { name: "Sport", value: analyticsData.acquisition.sport + analyticsData.product.sport + analyticsData.marketing.sport },
    { name: "Poker", value: analyticsData.acquisition.poker + analyticsData.product.poker + analyticsData.marketing.poker },
    { name: "Lotto", value: analyticsData.acquisition.lotto + analyticsData.product.lotto + analyticsData.marketing.lotto }
  ];

  return (
    <AnalyticsCard
      title="Task Breakdown by Product"
      tableData={tableData}
      tableColumns={tableColumns}
      chartData={chartData}
      chartTitle="Tasks by Product"
      colors={["#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]}
    />
  );
};

export default ProductBreakdownCard;
