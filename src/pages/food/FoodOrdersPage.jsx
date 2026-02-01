/**
 * Food app – Orders list (all orders for current user or board).
 */
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";

const FoodOrdersPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app">Orders</h1>
        <p className="text-sm text-app-subtle mt-1">
          View and manage your office food orders.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard p-6">
        <p className="text-app-subtle">
          Orders overview. Use <Link to={ROUTES.FOOD_DASHBOARD} className="text-indigo-600 dark:text-indigo-400 hover:underline">Dashboard</Link> for monthly order boards, or <Link to={ROUTES.FOOD_HISTORY} className="text-indigo-600 dark:text-indigo-400 hover:underline">History</Link> for past orders.
        </p>
      </div>
    </div>
  );
};

export default FoodOrdersPage;
