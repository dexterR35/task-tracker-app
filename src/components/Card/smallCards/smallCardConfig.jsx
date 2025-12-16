import { Icons } from "@/components/icons";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { getWeeksInMonth } from "@/utils/monthUtils";
import { CARD_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";
import { filterTasksByUserAndReporter } from "@/utils/taskFilters";


// Small Card Types
export const SMALL_CARD_TYPES = CARD_SYSTEM.SMALL_CARD_TYPES;

// Small Card Configuration Templates
export const SMALL_CARD_CONFIGS = {
  [SMALL_CARD_TYPES.MONTH_SELECTION]: {
    title: "Month Period",
    subtitle: "View All",
    description: "Months",
    icon: Icons.generic.clock,
    color: "soft_purple",
    getValue: (data) => data.availableMonths?.length || 0,
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "History"),
    getBadge: (data) => ({
      text: data.isCurrentMonth ? "Current" : "History",
      color: "soft_purple",
    }),
    getContent: (data) => (
      <div>
        <SearchableSelectField
          field={{
            name: "selectedMonth",
            type: "select",
            label: "Select Month",
            required: false,
            options:
              data.availableMonths?.map((month) => ({
                value: month.monthId,
                label: `${month.monthName}${month.isCurrent ? " (Current)" : ""}`,
              })) || [],
            placeholder: "Select months...",
          }}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedMonth" && data.selectMonth) {
              data.selectMonth(value);
            }
          }}
          watch={() =>
            data.selectedMonth?.monthId || data.currentMonth?.monthId || ""
          }
          noOptionsMessage="No months available"
          variant="soft_purple"
        />
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.clock,
        label: "Current",
        value: data.isCurrentMonth ? "Yes" : "No",
      },
      {
        icon: Icons.generic.calendar,
        label: "Available",
        value: `${data.availableMonths?.length || 0} months`,
      },
      {
        icon: Icons.generic.clock,
        label: "Period",
        value:
          data.selectedMonth?.monthName ||
          data.currentMonth?.monthName ||
          "None",
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_FILTER]: {
    title: "User Filter",
    subtitle: "View All",
    description: "Users",
    icon: Icons.generic.user,
    color: "soft_purple",
    getValue: (data) => {
      return (data.users?.length || 0).toString();
    },
    getStatus: (data) => {
      if (data.selectedUserId) {
        return data.selectedUserName;
      }
      return "All Users";
    },
    getBadge: (data) => ({
      text: data.selectedUserId ? "Filtered" : "All Users",
      color: "soft_purple",
    }),
    getContent: (data) => (
      <div className=" space-y-3">
        <SearchableSelectField
          field={{
            name: "selectedUser",
            type: "select",
            label: "Select User",
            required: false,
            options:
              data.users?.map((user) => ({
                value: user.userUID,
                label: user.name,
              })) || [],
            placeholder: "Select users...",
          }}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedUser" && data.handleUserSelect) {
              data.handleUserSelect(value);
            }
          }}
          watch={() => data.selectedUserId || ""}
          noOptionsMessage="No users found"
          variant="soft_purple"
        />
      </div>
    ),
    getDetails: (data) => {
      // Only if available
      const totalTasks = data.userFilterTotalTasks ?? 0;
      const totalHours = data.userFilterTotalHours ?? 0;

      return [
        {
          icon: Icons.generic.user,
          label: "Current User",
          value: data.selectedUserId
            ? data.selectedUserName
            : data.currentUser?.name ||
              "Current User",
        },
        {
          icon: Icons.generic.task,
          label: "Total Task",
          value: totalTasks.toString(),
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hr",
          value: `${totalHours.toFixed(1)}h`,
        },
      ];
    },
  },

  [SMALL_CARD_TYPES.REPORTER_FILTER]: {
    title: "Reporter Filter",
    subtitle: "View All",
    description: "Reporters",
    icon: Icons.admin.reporters,
    color: "soft_purple",
    getValue: (data) => {
      return (data.reporters?.length || 0).toString();
    },
    getStatus: (data) => {
      if (data.selectedReporterId) {
        return data.selectedReporterName;
      }
      return "All Reporters";
    },
    getBadge: (data) => ({
      text: data.selectedReporterId
        ? `${data.selectedReporterName}`
        : "All Reporters",
      color: "soft_purple",
    }),
    getContent: (data) => (
      <div className="space-y-1">
        <SearchableSelectField
          field={{
            name: "selectedReporter",
            type: "select",
            label: "Select Reporter",
            required: false,
            options:
              data.reporters?.map((reporter) => ({
                value: reporter.reporterUID,
                label: reporter.name,
              })) || [],
            placeholder: "Search Reporters...",
          }}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedReporter" && data.handleReporterSelect) {
              data.handleReporterSelect(value);
            }
          }}
          watch={() => data.selectedReporterId || ""}
          noOptionsMessage="No reporters found"
          variant="soft_purple"
        />
      </div>
    ),
    getDetails: (data) => {
      // Only if available
      const totalReporterTasks = data.reporterFilterTotalTasks ?? 0;
      const totalHours = data.reporterFilterTotalHours ?? 0;

      return [
        {
          icon: Icons.admin.reporters,
          label: "Selected",
          value: data.selectedReporterId ? data.selectedReporterName : "0",
        },
        {
          icon: Icons.admin.reporters,
          label: "Total Reporters Task",
          value: totalReporterTasks.toString(),
        },
        {
          icon: Icons.generic.clock,
          label: "Total Hr",
          value: `${totalHours.toFixed(1)}h`,
        },
      ];
    },
  },

  [SMALL_CARD_TYPES.USER_PROFILE]: {
    title: "User Profile",
    subtitle: "View All",
    description: "User Tasks",
    icon: Icons.generic.user,
    color: "pink",
    getBadge: (data) => ({
      text: data.currentUser?.role || "user",
      color: "pink",
    }),
    getValue: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return "0";
      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;
      const currentMonthId =
        data.selectedMonth?.monthId || data.currentMonth?.monthId;
      const isUserAdmin =
        data.isUserAdmin || data.currentUser?.role === "admin";
      const currentUserId = data.currentUser?.userUID;

      // Determine target user: selected user or current user (never show all tasks)
      const targetUserId = selectedUserId || currentUserId;

      // Filter by reporter only (user and month filtering done at database level)
      const filteredTasks = filterTasksByUserAndReporter(data.tasks, {
        selectedReporterId,
      });
      return filteredTasks.length.toString();
    },
    getStatus: (data) => (data.currentUser?.role || "user").toLowerCase(),
    getDetails: (data) => {
      const details = [];
      // Show selected user info if user is selected
      if (data.selectedUserId) {
        const selectedUser = data.users?.find(
          (u) => (u.userUID || u.id) === data.selectedUserId
        );
        details.push({
          label: "Selected User",
          value: selectedUser?.name || selectedUser?.email || "Unknown User",
        });
      }
      // Show selected reporter info if reporter is selected
      if (data.selectedReporterId) {
        const selectedReporter = data.reporters?.find(
          (r) => r.reporterUID === data.selectedReporterId
        );
        details.push({
          label: "Selected Reporter",
          value:
            selectedReporter?.name ||
            selectedReporter?.reporterName ||
            "Unknown Reporter",
        });
      }
      details.push({
        label: "Current User",
        value: data.currentUser?.name || data.currentUser?.email || "N/A",
      });

      // Add selected week section (without "All Weeks")
      const monthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
      if (monthId) {
        try {
          // Show selected week
          const selectedWeek = data.selectedWeek;
          details.push({
            label: "Selected Week",
            value: selectedWeek
              ? `Week ${selectedWeek.weekNumber}`
              : "All Weeks",
            icon: Icons.generic.calendar,
          });
        } catch (error) {
          logger.warn("Error getting weeks for USER_PROFILE card:", error);
          details.push({
            label: "Selected Week",
            value: "All Weeks",
            icon: Icons.generic.calendar,
          });
        }
      } else {
        // No month selected, show default
        details.push({
          label: "Selected Week",
          value: "All Weeks",
          icon: Icons.generic.calendar,
        });
      }

      return details;
    },
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Task Statistics",
    subtitle: "View All",
    description: "Total Tasks",
    icon: Icons.buttons.add,
    color: "soft_purple",
    getBadge: (data) => ({
      text: data.selectedWeek
        ? `Week ${data.selectedWeek.weekNumber}`
        : "All Weeks",
      color: "soft_purple",
    }),
    getValue: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return "0";

      const currentMonthId =
        data.selectedMonth?.monthId || data.currentMonth?.monthId;

      // Show ALL tasks for the selected month (no user/reporter filtering)
      const filteredTasks = data.tasks.filter((task) => {
        // Only filter by month, never by user or reporter
        if (currentMonthId && task.monthId !== currentMonthId) return false;
        return true;
      });

      return filteredTasks.length.toString();
    },
    getStatus: (data) => (data.canCreateTasks ? "Active" : "Disabled"),
    getContent: (data) => {
      // Get weeks for the current month
      const monthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
      let weekOptions = [];

      if (monthId) {
        try {
          const weeks = getWeeksInMonth(monthId);
          // "All Weeks" option at the beginning
          weekOptions = [
            { value: "", label: "All Weeks" },
            ...weeks.map((week) => ({
              value: week.weekNumber.toString(),
              label: `Week ${week.weekNumber}`,
            })),
          ];
        } catch (error) {
          logger.warn("Error getting weeks for month:", error);
        }
      }

      return (
 
          <SearchableSelectField
            field={{
              name: "selectedWeek",
              type: "select",
              label: "Filter by Week",
              required: false,
              options: weekOptions,
              placeholder: "Select weeks...",
            }}
            setValue={(fieldName, value) => {
              if (fieldName === "selectedWeek" && data.handleWeekChange) {
                if (!value || value === "") {
                  // Clear week selection - show all weeks
                  data.handleWeekChange(null);
                } else {
                  // Select specific week
                  const weekNumber = parseInt(value);
                  const weeks = getWeeksInMonth(monthId);
                  const week = weeks.find((w) => w.weekNumber === weekNumber);
                  if (week) {
                    data.handleWeekChange(week);
                  }
                }
              }
            }}
            watch={() => {
              if (data.selectedWeek) {
                return data.selectedWeek.weekNumber.toString();
              }
              return ""; // Return empty string to match "All Weeks" option when no week is selected
            }}
            noOptionsMessage="No weeks available"
            variant="soft_purple"
          />
    
      );
    },
    getDetails: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return [];

      const currentMonthId =
        data.selectedMonth?.monthId || data.currentMonth?.monthId;

      // Filter tasks by month first
      let filteredTasks = data.tasks.filter((task) => {
        if (currentMonthId && task.monthId !== currentMonthId) return false;
        return true;
      });

      // If a week is selected, filter by week; otherwise show all tasks for the month
      if (data.selectedWeek && data.selectedWeek.days) {
        const weekTasks = [];
        data.selectedWeek.days.forEach((day) => {
          try {
            const dayDate = day instanceof Date ? day : new Date(day);
            if (isNaN(dayDate.getTime())) return;

            const dayStr = dayDate.toISOString().split("T")[0];
            const dayTasks = filteredTasks.filter((task) => {
              if (!task.createdAt) return false;

              // Handle Firestore Timestamp
              let taskDate;
              if (
                task.createdAt &&
                typeof task.createdAt === "object" &&
                task.createdAt.seconds
              ) {
                taskDate = new Date(task.createdAt.seconds * 1000);
              } else if (
                task.createdAt &&
                typeof task.createdAt === "object" &&
                task.createdAt.toDate
              ) {
                taskDate = task.createdAt.toDate();
              } else {
                taskDate = new Date(task.createdAt);
              }

              if (isNaN(taskDate.getTime())) return false;
              const taskDateStr = taskDate.toISOString().split("T")[0];
              return taskDateStr === dayStr;
            });
            weekTasks.push(...dayTasks);
          } catch (error) {
            logger.warn("Error processing day:", error, day);
          }
        });
        filteredTasks = weekTasks;
      }

      // Apply user and reporter filtering if specified using shared utility
      if (data.selectedUserId || data.selectedReporterId) {
        // Filter by reporter only (user and month filtering done at database level)
        filteredTasks = filterTasksByUserAndReporter(filteredTasks, {
          selectedReporterId: data.selectedReporterId,
        });
      }

      // Only if available
      const totalTasks = data.actionsTotalTasks ?? filteredTasks.length;
      const totalHours = data.actionsTotalHours ?? 0;
      const totalDeliverables = data.actionsTotalDeliverables ?? 0;
      const totalDeliverablesWithVariationsHours =
        data.actionsTotalDeliverablesWithVariationsHours ?? 0;

      return [
        {
          icon: Icons.generic.clock,
          label: "Total Hours Task",
          value: `${totalHours.toFixed(1)}h`,
        },
        {
          icon: Icons.generic.deliverable,
          label: "Total Deliverables",
          value: totalDeliverables.toString(),
        },
        {
          icon: Icons.generic.timer,
          label: "Total Hrs Deliverable + Variation",
          value: `${totalDeliverablesWithVariationsHours.toFixed(1)}h`,
        },
      ];
    },
  },
 
};

export const createCards = (data, mode = "main") => {
  let cardTypes = [];
  if (Array.isArray(mode)) {
    cardTypes = mode;
  } else {
    switch (mode) {
      case "main":
        cardTypes = [
          SMALL_CARD_TYPES.MONTH_SELECTION,
          SMALL_CARD_TYPES.ACTIONS,
          ...(data.isUserAdmin
            ? [SMALL_CARD_TYPES.USER_FILTER, SMALL_CARD_TYPES.REPORTER_FILTER]
            : [SMALL_CARD_TYPES.REPORTER_FILTER]),
          SMALL_CARD_TYPES.USER_PROFILE,
        ];
        break;
      default:
        cardTypes = [];
    }
  }
  return cardTypes
    .map((cardType) => {
      const config = SMALL_CARD_CONFIGS[cardType];
      if (!config) {
        return null;
      }
      try {
        const card = {
          id: `${cardType}-card`,
          title:
            typeof config.title === "function"
              ? config.title(data)
              : config.title,
          subtitle:
            typeof config.subtitle === "function"
              ? config.subtitle(data)
              : config.subtitle,
          description:
            typeof config.description === "function"
              ? config.description(data)
              : config.description,
          icon: config.icon,
          color:
            typeof config.color === "function"
              ? config.color(data)
              : config.color,
          value: config.getValue(data),
          status: config.getStatus(data),
          badge: config.getBadge ? config.getBadge(data) : null,
          content: config.getContent ? config.getContent(data) : null,
          details: config.getDetails ? config.getDetails(data) : [],
        };

        return card;
      } catch (error) {
        return null;
      }
    })
    .filter((card) => card !== null);
};
