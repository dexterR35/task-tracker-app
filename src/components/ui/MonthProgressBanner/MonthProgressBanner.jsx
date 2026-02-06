/**
 * Month Progress Banner - Shows monthly progress metrics per department variant
 * Variant "design" = task completion, "food" = order statistics, "customer-support" = task completion
 */
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
import { useGetOrderBoardsQuery, useGetOrdersQuery } from "@/store/api";
import { Icons } from "@/components/icons";
import Loader from "@/components/ui/Loader/Loader";

const MonthProgressBanner = ({ variant = "design" }) => {
  const { user } = useAuth();
  const { viewingDepartmentId } = useSelectedDepartment();
  const appData = useAppDataContext();

  const now = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  // RTK Query hooks for food variant
  const {
    data: orderBoardsData,
    isLoading: orderBoardsLoading,
  } = useGetOrderBoardsQuery(
    { year: now.year, month: now.month },
    { skip: variant !== "food" || !user?.departmentId }
  );

  const firstBoardId = orderBoardsData?.boards?.[0]?.id;
  const {
    data: ordersData,
    isLoading: ordersLoading,
  } = useGetOrdersQuery(
    firstBoardId ?? '',
    { skip: variant !== "food" || !firstBoardId }
  );

  // Compute progress data
  const data = useMemo(() => {
    if (variant === "food") {
      if (orderBoardsLoading || ordersLoading) return null;
      const orders = ordersData?.orders ?? [];
      if (orders.length === 0 && orderBoardsData?.boards?.length === 0) {
        return { total: 0, completed: 0, pending: 0, completionRate: 0 };
      }
      const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "delivered");
      const pendingOrders = orders.filter((o) => o.status === "pending");
      return {
        total: orders.length,
        completed: completedOrders.length,
        pending: pendingOrders.length,
        completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
      };
    } else {
      // Design/Customer Support: Use tasks from appData
      if (appData?.tasks && Array.isArray(appData.tasks)) {
        const currentMonthTasks = appData.tasks;
        const completedTasks = currentMonthTasks.filter((t) => t.status === "completed" || t.status === "done");
        const pendingTasks = currentMonthTasks.filter((t) => t.status === "todo" || t.status === "in-progress");
        return {
          total: currentMonthTasks.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          completionRate: currentMonthTasks.length > 0 ? Math.round((completedTasks.length / currentMonthTasks.length) * 100) : 0,
        };
      }
      return { total: 0, completed: 0, pending: 0, completionRate: 0 };
    }
  }, [variant, orderBoardsLoading, ordersLoading, orderBoardsData, ordersData, appData?.tasks]);

  const loading = variant === "food" 
    ? (orderBoardsLoading || ordersLoading)
    : false;

  if (loading || !data) {
    return (
      <div className="month-progress-bar mb-6">
        <div className="month-progress-bar-inner">
          <Loader size="sm" text="Loading progress..." variant="spinner" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progressPercentage = data.completionRate;
  const progressColor = variant === "food" ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="month-progress-bar mb-6">
      <div className="month-progress-bar-inner">
        <div className="month-progress-bar-header">
          <h3 className="month-progress-bar-title">
            {variant === "food" ? "Order Progress" : "Task Progress"} - {new Date(now.year, now.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <span className={`month-progress-bar-badge ${variant === "food" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
            {progressPercentage}%
          </span>
        </div>
        <div className="month-progress-bar-track">
          <div
            className={`month-progress-bar-fill ${progressColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="month-progress-bar-footer">
          <span className="month-progress-bar-stat">
            {variant === "food" ? "Orders" : "Tasks"} completed: {data.completed} / {data.total}
          </span>
          <span className="month-progress-bar-stat">
            {variant === "food" ? "Pending" : "In progress"}: {data.pending}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthProgressBanner;
