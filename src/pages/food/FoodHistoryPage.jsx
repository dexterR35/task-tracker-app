/**
 * Food app – History (past orders by day/month/year).
 */
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";

const FoodHistoryPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app">History</h1>
        <p className="text-sm text-app-subtle mt-1">
          Past office food orders by day, month, or year.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard p-6">
        <p className="text-app-subtle">
          History view – filter by period. Back to <Link to={ROUTES.FOOD_DASHBOARD} className="text-indigo-600 dark:text-indigo-400 hover:underline">Dashboard (order board)</Link> or <Link to={ROUTES.FOOD_ORDERS} className="text-indigo-600 dark:text-indigo-400 hover:underline">Orders</Link>.
        </p>
      </div>
    </div>
  );
};

export default FoodHistoryPage;
