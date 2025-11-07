import React, { useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import {
  SkeletonCard,
  SkeletonHeader,
} from "@/components/ui/Skeleton/Skeleton";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { formatDate, normalizeTimestamp } from "@/utils/dateUtils";
import { differenceInDays } from "date-fns";
import { Icons } from "@/components/icons";
import { CARD_SYSTEM } from "@/constants";
import {
  useDeliverablesOptions,
  useDeliverableCalculation,
} from "@/features/deliverables/DeliverablesManager";
import { convertMarketsToBadges } from "@/components/Card/smallCards/smallCardConfig";

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUserAdmin = user?.role === "admin";
  const { tasks, isLoading, deliverables } = useAppDataContext();

  // Get query parameters
  const userId = searchParams.get("user");
  const monthId = searchParams.get("monthId");

  // Find the task in the current tasks data
  const task = tasks?.find((t) => t.id === taskId);

  // Get deliverables options and calculate deliverable details
  const { deliverablesOptions } = useDeliverablesOptions();
  const deliverablesUsed = task?.data_task?.deliverablesUsed || [];
  const { deliverablesList, totalTime: deliverablesTotalTime } =
    useDeliverableCalculation(deliverablesUsed, deliverablesOptions);

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  // Determine what to show
  const shouldShowLoading = isLoading;
  const shouldShowNotFound = !isLoading && !task;

  // Calculate days between start and end dates
  const getDaysBetweenDates = () => {
    if (!task || !task.data_task) return "Unknown";

    const startDate = task.data_task?.startDate;
    const endDate = task.data_task?.endDate;

    if (!startDate || !endDate) return "Unknown";

    try {
      // Use date utilities for consistent date handling
      const start = normalizeTimestamp(startDate);
      const end = normalizeTimestamp(endDate);

      if (!start || !end) return "Invalid dates";

      // Use date-fns for accurate day calculation
      const diffDays = differenceInDays(end, start);
      return `${Math.abs(diffDays)} days`;
    } catch {
      return "Invalid dates";
    }
  };

  const daysBetween = getDaysBetweenDates();

  // Helper function to format array values
  const formatArrayValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return value || "Not specified";
  };

  // Helper function to format JSON values
  const formatJsonValue = (value) => {
    if (value && typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return value || "None";
  };

  // Create task detail cards using SmallCard pattern
  const taskDetailCards = useMemo(() => {
    if (!task) return [];

    const totalHours =
      (task?.data_task?.timeInHours || 0) + (task?.data_task?.aiTime || 0);

    return [
      {
        id: "task-basic-info",
        title: "Basic Information",
        subtitle: "Task Details",
        description: "Core task information",
        icon: Icons.generic.task,
        color: "blue",
        value: task?.data_task?.taskName || "Unnamed Task",
        badge: {
          text: task?.isVip ? "VIP" : "Regular",
          color: task?.isVip ? "amber" : "blue",
        },
        details: [
          {
            label: "Task ID",
            value: task?.id || "Not specified",
          },
          {
            label: "Department",
            value: formatArrayValue(task?.data_task?.departments),
          },
          {
            label: "Products",
            value: formatArrayValue(task?.data_task?.products),
          },
          {
            label: "Markets",
            value: task?.data_task?.markets?.length || 0,
            badges: convertMarketsToBadges(task?.data_task?.markets),
          },
          {
            label: "Reporter",
            value: task?.data_task?.reporterName || "Not specified",
          },
          {
            label: "User",
            value:
              task?.createdByName ||
              task?.data_task?.userName ||
              task?.userName ||
              "Not specified",
          },
        ],
      },
      {
        id: "task-time-info",
        title: "Time Information",
        subtitle: "Duration & Hours",
        description: "Time tracking details",
        icon: Icons.generic.clock,
        color: "green",
        value: `${totalHours}h`,
        badge: {
          text: daysBetween,
          color: "green",
        },
        details: [
          {
            label: "Task Hours",
            value: `${task?.data_task?.timeInHours || 0}h`,
          },
          {
            label: "AI Time",
            value: `${task?.data_task?.aiTime || 0}h`,
          },
          {
            label: "Total Hours",
            value: `${totalHours}h`,
          },
          {
            label: "Duration",
            value: daysBetween,
          },
        ],
      },
      {
        id: "task-ai-info",
        title: "AI Information",
        subtitle: "AI Usage",
        description: "Artificial intelligence details",
        icon: Icons.generic.chart,
        color: "purple",
        value: task?.data_task?.aiTime || 0,
        badge: {
          text: task?.data_task?.usedAIEnabled ? "Enabled" : "Disabled",
          color: task?.data_task?.usedAIEnabled ? "green" : "red",
        },
        details: [
          {
            label: "AI Models",
            value: formatArrayValue(task?.data_task?.aiModels),
          },
          {
            label: "AI Time",
            value: `${task?.data_task?.aiTime || 0}h`,
          },
          {
            label: "AI Enabled",
            value: task?.data_task?.usedAIEnabled ? "Yes" : "No",
          },
        ],
      },
      {
        id: "task-deliverables",
        title: "Deliverables",
        subtitle: "Task Deliverables",
        description: "Deliverable information",
        icon: Icons.generic.deliverable,
        color: "amber",
        value: deliverablesUsed.length || 0,
        badge: {
          text: `${deliverablesTotalTime.toFixed(1)}h total`,
          color: "amber",
        },
        details: (() => {
          const details = [
            {
              label: "Total Deliverables",
              value: deliverablesUsed.length || 0,
            },
            {
              label: "Total Deliverables Time",
              value: `${deliverablesTotalTime.toFixed(1)}h (${((deliverablesTotalTime * 60) / 480).toFixed(2)} days)`,
            },
          ];

          // Add detailed deliverable information
          if (deliverablesList && deliverablesList.length > 0) {
            deliverablesList.forEach((deliverable, index) => {
              const variationsQty = deliverable.variationsQuantity || 0;
              const variationsTime = deliverable.variationsTime || 0;
              const variationsTimeUnit =
                deliverable.variationsTimeUnit || "min";
              const hasVariations = variationsQty > 0 && variationsTime > 0;

              details.push({
                label: `Deliverable ${index + 1}: ${deliverable.name}`,
                value: `${deliverable.quantity}x`,
              });

              // Show calculation
              if (hasVariations) {
                details.push({
                  label: `  Calculation`,
                  value: `${deliverable.timePerUnit}${deliverable.timeUnit} × ${deliverable.quantity} + ${variationsQty} × ${variationsTime}${variationsTimeUnit}`,
                });
                details.push({
                  label: `  Variations`,
                  value: `${variationsQty} × ${variationsTime}${variationsTimeUnit}`,
                });
              } else {
                details.push({
                  label: `  Calculation`,
                  value: `${deliverable.timePerUnit}${deliverable.timeUnit} × ${deliverable.quantity}`,
                });
                details.push({
                  label: `  Variations`,
                  value: "None",
                });
              }

              details.push({
                label: `  Total Time`,
                value: `${deliverable.time.toFixed(1)}h (${deliverable.timeInDays.toFixed(2)} days)`,
              });
            });
          } else if (deliverablesUsed.length > 0) {
            // Show basic info if calculation not available
            deliverablesUsed.forEach((deliverable, index) => {
              details.push({
                label: `Deliverable ${index + 1}`,
                value: deliverable.name || "Unknown",
              });
              details.push({
                label: `  Quantity`,
                value: deliverable.count || 1,
              });
              details.push({
                label: `  Variations Count`,
                value:
                  deliverable.variationsCount ||
                  deliverable.variationsQuantity ||
                  0,
              });
              details.push({
                label: `  Variations Enabled`,
                value: deliverable.variationsEnabled ? "Yes" : "No",
              });
            });
          }

          return details;
        })(),
      },
      {
        id: "task-observations",
        title: "Observations",
        subtitle: "Task Notes",
        description: "Additional observations and notes",
        icon: Icons.generic.message || Icons.generic.document,
        color: "blue",
        value: task?.data_task?.observations ? "Has Notes" : "No Notes",
        badge: {
          text: task?.data_task?.observations ? "Present" : "Empty",
          color: task?.data_task?.observations ? "blue" : "gray",
        },
        details: [
          {
            label: "Observations",
            value: task?.data_task?.observations || "No observations recorded",
          },
        ],
      },
      {
        id: "task-dates",
        title: "Dates & Timeline",
        subtitle: "Task Timeline",
        description: "Date information",
        icon: Icons.generic.calendar,
        color: "crimson",
        value: task?.data_task?.startDate
          ? formatDate(task.data_task.startDate, "dd MMM yyyy", true)
          : "Not set",
        badge: {
          text: task?.data_task?.endDate
            ? formatDate(task.data_task.endDate, "dd MMM yyyy", true)
            : "Not set",
          color: "crimson",
        },
        details: [
          {
            label: "Start Date",
            value: task?.data_task?.startDate
              ? formatDate(task.data_task.startDate, "dd MMM yyyy", true)
              : "Not specified",
          },
          {
            label: "End Date",
            value: task?.data_task?.endDate
              ? formatDate(task.data_task.endDate, "dd MMM yyyy", true)
              : "Not specified",
          },
          {
            label: "Created At",
            value: task?.createdAt
              ? formatDate(task.createdAt, "MMM dd, yyyy HH:mm", true)
              : "Not specified",
          },
          {
            label: "Created By",
            value: task?.createdByName || "Not specified",
          },
          {
            label: "Month ID",
            value: task?.monthId || "Not specified",
          },
        ],
      },
      {
        id: "task-status",
        title: "Task Status",
        subtitle: "Status Information",
        description: "Task status details",
        icon: Icons.generic.check,
        color: "green",
        value: task?.reworked ? "Reworked" : "Original",
        badge: {
          text: task?.reworked ? "Reworked" : "Original",
          color: task?.reworked ? "amber" : "green",
        },
        details: [
          {
            label: "Task Status",
            value: task?.isVip ? "VIP Task" : "Regular Task",
          },
          {
            label: "Reworked",
            value: task?.reworked ? "Yes" : "No",
          },
          {
            label: "Task ID",
            value: task?.id || "Not specified",
          },
          {
            label: "Month ID",
            value: task?.monthId || "Not specified",
          },
        ],
      },
    ];
  }, [
    task,
    daysBetween,
    deliverablesList,
    deliverablesTotalTime,
    deliverablesUsed,
  ]);

  return (
    <div className="min-h-screen  ">
      {shouldShowLoading ? (
        <div className="  mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <SkeletonHeader />

          {/* Task Detail Cards Skeleton Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <SkeletonCard key={index} className="h-80" />
            ))}
          </div>
        </div>
      ) : shouldShowNotFound ? (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Task Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The requested task could not be found.
            </p>
            <DynamicButton
              onClick={handleGoBack}
              variant="primary"
              size="md"
              iconName="arrowLeft"
              iconPosition="left"
            >
              Back to Dashboard
            </DynamicButton>
          </div>
        </div>
      ) : (
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <DynamicButton
                onClick={handleGoBack}
                variant="secondary"
                size="sm"
                iconName="arrowLeft"
                iconPosition="left"
              >
                Back to Dashboard
              </DynamicButton>

              {/* Jira Button */}
              {task?.data_task?.taskName && (
                <DynamicButton
                  onClick={() =>
                    window.open(
                      `https://gmrd.atlassian.net/browse/${task.data_task.taskName}`,
                      "_blank"
                    )
                  }
                  variant="primary"
                  size="sm"
                  iconName="externalLink"
                  iconPosition="right"
                >
                  Open in Jira
                </DynamicButton>
              )}
            </div>

  
            <div className="card  ">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold ">
                    {task?.data_task?.taskName || "Unnamed Task"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Task ID: {task?.id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task?.isVip && (
                    <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-sm font-medium">
                      VIP Task
                    </span>
                  )}
                  {task?.reworked && (
                    <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium">
                      Reworked
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Task Detail Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskDetailCards.map((card) => (
              <SmallCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;
