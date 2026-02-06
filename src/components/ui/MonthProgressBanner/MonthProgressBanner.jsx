/**
 * Month Progress Banner - Shows monthly progress metrics per department variant
 * Variant "design" = task completion, "food" = order statistics, "customer-support" = task completion
 */
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
// APIs imported dynamically to avoid circular dependencies
import { Icons } from "@/components/icons";
import Loader from "@/components/ui/Loader/Loader";

const MonthProgressBanner = ({ variant = "design" }) => {
  const { user } = useAuth();
  const { viewingDepartmentId } = useSelectedDepartment();
  const appData = useAppDataContext();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const now = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  // Fetch progress data based on variant
  React.useEffect(() => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchProgress = async () => {
      try {
        if (variant === "food") {
          // Food: Fetch order boards for current month, then orders
          try {
            const { orderBoardsApi, ordersApi: ordersApiImport } = await import("@/app/api");
            const boardsData = await orderBoardsApi.list({ year: now.year, month: now.month });
            const boards = boardsData?.boards ?? [];
            
            if (boards.length === 0) {
              if (!cancelled) {
                setData({ total: 0, completed: 0, pending: 0, completionRate: 0 });
                setLoading(false);
              }
              return;
            }

            // Fetch orders from first board
            const boardId = boards[0].id;
            const ordersData = await ordersApiImport.list(boardId);
            const orders = ordersData?.orders ?? [];
            const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "delivered");
            const pendingOrders = orders.filter((o) => o.status === "pending");
            
            if (!cancelled) {
              setData({
                total: orders.length,
                completed: completedOrders.length,
                pending: pendingOrders.length,
                completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
              });
            }
          } catch (err) {
            console.error("Error fetching food progress:", err);
            if (!cancelled) {
              setData({ total: 0, completed: 0, pending: 0, completionRate: 0 });
            }
          }
        } else {
          // Design/Customer Support: Use tasks from appData or fetch from boards
          if (appData?.tasks && Array.isArray(appData.tasks)) {
            const currentMonthTasks = appData.tasks;
            const completedTasks = currentMonthTasks.filter((t) => t.status === "completed" || t.status === "done");
            const pendingTasks = currentMonthTasks.filter((t) => t.status === "todo" || t.status === "in-progress");
            
            if (!cancelled) {
              setData({
                total: currentMonthTasks.length,
                completed: completedTasks.length,
                pending: pendingTasks.length,
                completionRate: currentMonthTasks.length > 0 ? Math.round((completedTasks.length / currentMonthTasks.length) * 100) : 0,
              });
            }
          } else {
            // Fallback: use empty data
            if (!cancelled) {
              setData({
                total: 0,
                completed: 0,
                pending: 0,
                completionRate: 0,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
        if (!cancelled) {
          setData({
            total: 0,
            completed: 0,
            pending: 0,
            completionRate: 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProgress();
    return () => { cancelled = true; };
  }, [variant, user?.departmentId, now.year, now.month, appData?.tasks]);

  if (loading) {
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
