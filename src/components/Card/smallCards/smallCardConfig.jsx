import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { getWeeksInMonth } from "@/utils/monthUtils";
import { CARD_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";

export const getCardColor = (cardType, data = {}) => {
  const palette = [
    "green",
    "blue",
    "purple",
    "amber",
    "pink",
    "red",
    "yellow",
    "orange",
    "crimson",
  ].filter((key) => Boolean(CARD_SYSTEM.COLOR_HEX_MAP[key]));
  // Fallback if palette is somehow empty
  if (palette.length === 0) return "color_default";
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  const index = hashString(String(cardType)) % palette.length;
  return palette[index];
};

/**
 * Convert markets array to badges object format for SmallCard
 * This is the shared function used across all cards that need to display market badges
 *
 * @param {Array|Object|string} markets - Markets data (array, object already in badges format, or string)
 * @param {number} defaultCount - Default count for each market when converting from array (default: 1)
 * @returns {Object|null} - Badges object with market names as keys and counts as values, or null if no markets
 *
 * @example
 * // Array input - converts to object with count 1 for each
 * convertMarketsToBadges(["UK", "US"]) // Returns: {UK: 1, US: 1}
 *
 * // Object input (already in badges format) - returns as-is
 * convertMarketsToBadges({UK: 5, US: 3}) // Returns: {UK: 5, US: 3}
 *
 * // String input - splits by comma and converts to object
 * convertMarketsToBadges("UK, US") // Returns: {UK: 1, US: 1}
 */
export const convertMarketsToBadges = (markets, defaultCount = 1) => {
  if (!markets) return null;

  // If already an object (badges format), return as-is (same as smallCardConfig pattern)
  if (typeof markets === "object" && !Array.isArray(markets)) {
    const keys = Object.keys(markets);
    return keys.length > 0 ? markets : null;
  }

  // Handle array - convert to object format
  let marketsArray = [];
  if (Array.isArray(markets)) {
    marketsArray = markets;
  } else if (typeof markets === "string") {
    // Handle comma-separated string
    marketsArray = markets
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  } else {
    return null;
  }

  if (marketsArray.length === 0) return null;

  // Convert array to object with default count for each market (same pattern as analytics configs)
  const badgesObj = {};
  marketsArray.forEach((market) => {
    if (market) {
      const marketKey =
        typeof market === "string" ? market.trim() : String(market);
      if (marketKey) {
        badgesObj[marketKey] = defaultCount;
      }
    }
  });

  return Object.keys(badgesObj).length > 0 ? badgesObj : null;
};

// Small Card Types
export const SMALL_CARD_TYPES = CARD_SYSTEM.SMALL_CARD_TYPES;

// Small Card Configuration Templates
export const SMALL_CARD_CONFIGS = {
  [SMALL_CARD_TYPES.MONTH_SELECTION]: {
    title: "Month Period",
    subtitle: "View All",
    description: "Months",
    icon: Icons.generic.clock,
    color: "green",
    getValue: (data) => data.availableMonths?.length || 0,
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "History"),
    getBadge: (data) => ({
      text: data.isCurrentMonth ? "Current" : "History",
      color: "green",
    }),
    getContent: (data) => (
      <div className="">
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
            placeholder: "Search months...",
          }}
          register={() => {}} // Not needed for this use case
          errors={{}}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedMonth" && data.selectMonth) {
              data.selectMonth(value);
            }
          }}
          watch={() =>
            data.selectedMonth?.monthId || data.currentMonth?.monthId || ""
          }
          trigger={() => {}}
          clearErrors={() => {}}
          formValues={{}}
          noOptionsMessage="No months available"
          variant="green"
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
    color: "blue",
    getValue: (data) => {
      // Show total number of users, not tasks
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
      color: "blue",
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
                value: user.userUID || user.id,
                label: user.name || user.email,
              })) || [],
            placeholder: "Search users...",
          }}
          register={() => {}} // Not needed for this use case
          errors={{}}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedUser" && data.handleUserSelect) {
              data.handleUserSelect(value);
            }
          }}
          watch={() => data.selectedUserId || ""}
          trigger={() => {}}
          clearErrors={() => {}}
          formValues={{}}
          noOptionsMessage="No users found"
          variant="blue"
        />
      </div>
    ),
    getDetails: (data) => {
      // Calculate total tasks and hours for selected user, or logged-in user if none selected
      let totalTasks = 0;
      let totalHours = 0;
      
      if (data.tasks && Array.isArray(data.tasks)) {
        const currentMonthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
        const targetUserId = data.selectedUserId || data.currentUser?.userUID;
        
        // Filter tasks by month if specified
        let filteredTasks = data.tasks;
        if (currentMonthId) {
          filteredTasks = filteredTasks.filter((task) => task.monthId === currentMonthId);
        }
        
        // Filter by target user (selected user or logged-in user)
        if (targetUserId) {
          filteredTasks = filteredTasks.filter((task) => {
            return task.userUID === targetUserId || task.createbyUID === targetUserId;
          });
        }
        
        totalTasks = filteredTasks.length;
        
        // Calculate total hours
        totalHours = filteredTasks.reduce((sum, task) => {
          const hours = task.data_task?.timeInHours || task.timeInHours || 0;
          return sum + (typeof hours === "number" ? hours : 0);
        }, 0);
      }
      
      return [
        {
          icon: Icons.generic.user,
          label: "Current User",
          value: data.selectedUserId 
            ? data.selectedUserName 
            : (data.currentUser?.name || data.currentUser?.email || "Current User"),
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
    color: "orange",
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
      color: "orange",
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
                label: reporter.name || reporter.reporterName,
              })) || [],
            placeholder: "Search Reporters...",
          }}
          register={() => {}} // Not needed for this use case
          errors={{}}
          setValue={(fieldName, value) => {
            if (fieldName === "selectedReporter" && data.handleReporterSelect) {
              data.handleReporterSelect(value);
            }
          }}
          watch={() => data.selectedReporterId || ""}
          trigger={() => {}}
          clearErrors={() => {}}
          formValues={{}}
          noOptionsMessage="No reporters found"
          variant="purple"
        />
      </div>
    ),
    getDetails: (data) => {
      // Calculate total tasks and hours for selected reporter only
      let totalReporterTasks = 0;
      let totalHours = 0;
      
      // Only calculate if a reporter is selected
      if (data.selectedReporterId && data.tasks && Array.isArray(data.tasks)) {
        const currentMonthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
        
        // Filter tasks by month if specified
        let filteredTasks = data.tasks;
        if (currentMonthId) {
          filteredTasks = filteredTasks.filter((task) => task.monthId === currentMonthId);
        }
        
        // Filter by selected reporter
        filteredTasks = filteredTasks.filter((task) => {
          // Check multiple possible reporter ID fields
          const taskReporterId = 
            task.data_task?.reporters || 
            task.data_task?.reporterUID || 
            task.reporters || 
            task.reporterUID;
          
          // Compare task reporter ID with selected reporter ID
          return taskReporterId && String(taskReporterId) === String(data.selectedReporterId);
        });
        
        totalReporterTasks = filteredTasks.length;
        
        // Calculate total hours
        totalHours = filteredTasks.reduce((sum, task) => {
          const hours = task.data_task?.timeInHours || task.timeInHours || 0;
          return sum + (typeof hours === "number" ? hours : 0);
        }, 0);
      }
      
      return [
        {
          icon: Icons.admin.reporters,
          label: "Selected",
          value: data.selectedReporterId
            ? data.selectedReporterName
            : "0",
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
      color: 'pink'
    }),
    getValue: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return "0";
      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;
      const currentMonthId =
        data.selectedMonth?.monthId || data.currentMonth?.monthId;
      const isUserAdmin = data.isUserAdmin || data.currentUser?.role === "admin";
      const currentUserId = data.currentUser?.userUID;
      
      // Determine target user: selected user or current user (never show all tasks)
      const targetUserId = selectedUserId || currentUserId;
      
      // Helper function to get reporter ID (matches TaskTable logic)
      const getTaskReporterId = (task) => {
        return task.data_task?.reporters || task.reporters;
      };
      
      // Helper function to check if task matches user
      const matchesUser = (task, userId) => {
        return task.userUID === userId || task.createbyUID === userId;
      };
      
      // Filter tasks based on selections - always filter by user (selected or current)
      const filteredTasks = data.tasks.filter((task) => {
        // Always filter by month first
        if (currentMonthId && task.monthId !== currentMonthId) return false;
        
        // Always filter by target user (selected user or current user)
        if (targetUserId && !matchesUser(task, targetUserId)) return false;
        
        // If reporter is selected, also filter by reporter
        if (selectedReporterId) {
          const taskReporterId = getTaskReporterId(task);
          if (!taskReporterId) return false;
          // Compare task reporter ID directly with selectedReporterId (exact match)
          return String(taskReporterId) === String(selectedReporterId);
        }
        
        return true;
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
    getContent: (data) => (
      <div className="mt-2">
        <DynamicButton
          onClick={() => {
            // Build URL parameters based on current selections
            const params = new URLSearchParams();
            // Handle user selection - always show current user's data by default
            if (data.selectedUserId && data.currentUser?.role === "admin") {
              // Admin viewing specific user
              const selectedUser = data.users?.find(
                (u) => u.userUID === data.selectedUserId
              );
              const userName =
                selectedUser?.name || selectedUser?.email || "Unknown";
              params.set("user", userName);
            } else {
              // Always show current user's data by default
              const userName =
                data.currentUser?.name || data.currentUser?.email || "My Data";
              params.set("user", userName);
            }
            // Handle reporter selection
            if (data.selectedReporterId) {
              const selectedReporter = data.reporters?.find(
                (r) => r.reporterUID === data.selectedReporterId
              );
              const reporterName =
                selectedReporter?.name ||
                selectedReporter?.reporterName ||
                "Unknown Reporter";
              params.set("reporter", reporterName);
            }
            // Week selection logic is REMOVED

            // Handle month selection
            if (data.selectedMonth?.monthId) {
              params.set("month", data.selectedMonth.monthId);
            } else if (data.currentMonth?.monthId) {
              params.set("month", data.currentMonth.monthId);
            }
            const url = `/analytics-detail?${params.toString()}`;
            if (data.navigate) {
              data.navigate(url);
            } else {
              window.history.pushState({}, "", url);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          }}
          iconName="view"
          variant="primary"
          size="sm"
          className="w-full uppercase"
        >
          {(() => {
            const parts = [];
            // User part - always show current user data
            if (data.selectedUserId && data.currentUser?.role === "admin") {
              // Admin viewing specific user
              const selectedUser = data.users?.find(
                (u) => u.userUID === data.selectedUserId
              );
              const userName =
                selectedUser?.name?.toUpperCase() ||
                selectedUser?.email?.toUpperCase() ||
                "USER";
              parts.push(userName);
            } else {
              // Always show current user data
              const currentUserName =
                data.currentUser?.name?.toUpperCase() ||
                data.currentUser?.email?.toUpperCase() ||
                "MY";
              parts.push(currentUserName);
            }
            // Reporter part - only add if both user and reporter are selected
            if (data.selectedReporterId && data.selectedUserId) {
              const selectedReporter = data.reporters?.find(
                (r) => r.reporterUID === data.selectedReporterId
              );
              const reporterName =
                selectedReporter?.name?.toUpperCase() ||
                selectedReporter?.reporterName?.toUpperCase() ||
                "REPORTER";
              parts.push(reporterName);
            }
            // Build final text
            if (parts.length === 0) {
              // Fallback if somehow no user data is available
              return `VIEW DATA`;
            } else if (parts.length === 1) {
              return ` ${parts[0]} Task`;
            } else {
              return ` ${parts.join(" + ")} Tasks`;
            }
          })()}
        </DynamicButton>

        {/* Second button for all data tasks - admin only */}
        {data.isUserAdmin && (
          <DynamicButton
            onClick={() => {
              // Build URL parameters for ALL data tasks with selected month
              const params = new URLSearchParams();
              // Handle month selection - use selected month or current month
              if (data.selectedMonth?.monthId) {
                params.set("month", data.selectedMonth.monthId);
              } else if (data.currentMonth?.monthId) {
                params.set("month", data.currentMonth.monthId);
              }
              const url = `/analytics-detail?${params.toString()}`;
              if (data.navigate) {
                data.navigate(url);
              } else {
                window.history.pushState({}, "", url);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }}
            iconName="users"
            variant="primary"
            size="sm"
            className="w-full mt-2 uppercase"
          >
            VIEW ALL TASKS
          </DynamicButton>
        )}
      </div>
    ),
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Task Statistics",
    subtitle: "View All",
    description: "Total Tasks",
    icon: Icons.buttons.add,
    color: "amber",
    getBadge: (data) => ({
      text: data.selectedWeek
        ? `Week ${data.selectedWeek.weekNumber}`
        : "All Weeks",
      color: "amber",
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
          // Add "All Weeks" option at the beginning
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
        <div className="">
          <SearchableSelectField
            field={{
              name: "selectedWeek",
              type: "select",
              label: "Filter by Week",
              required: false,
              options: weekOptions,
              placeholder: "Search weeks...",
            }}
            register={() => {}} // Not needed for this use case
            errors={{}}
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
              return ""; // Return empty string when no week is selected
            }}
            trigger={() => {}}
            clearErrors={() => {}}
            formValues={{}}
            noOptionsMessage="No weeks available"
            variant="amber"
          />
        </div>
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

      // Apply user and reporter filtering if specified
      if (data.selectedUserId || data.selectedReporterId) {
        filteredTasks = filteredTasks.filter((task) => {
          // If both user and reporter are selected, show tasks that match BOTH
          if (data.selectedUserId && data.selectedReporterId) {
            const matchesUser =
              task.userUID === data.selectedUserId ||
              task.createbyUID === data.selectedUserId;
            const matchesReporter =
              task.reporterUID === data.selectedReporterId ||
              task.data_task?.reporterUID === data.selectedReporterId;
            return matchesUser && matchesReporter;
          }

          // If only user is selected, show tasks for that user
          if (data.selectedUserId && !data.selectedReporterId) {
            return (
              task.userUID === data.selectedUserId ||
              task.createbyUID === data.selectedUserId
            );
          }

          // If only reporter is selected, show tasks for that reporter
          if (data.selectedReporterId && !data.selectedUserId) {
            return (
              task.reporterUID === data.selectedReporterId ||
              task.data_task?.reporterUID === data.selectedReporterId
            );
          }

          return true;
        });
      }

      // Calculate statistics
      const totalTasks = filteredTasks.length;
      const totalHours = filteredTasks.reduce((sum, task) => {
        const hours = task.data_task?.timeInHours || task.timeInHours || 0;
        return sum + (typeof hours === "number" ? hours : 0);
      }, 0);

      const totalDeliverables = filteredTasks.reduce((sum, task) => {
        const deliverables =
          task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
        return (
          sum +
          deliverables.reduce((delSum, del) => {
            return delSum + (del.count || 1);
          }, 0)
        );
      }, 0);

      // Calculate total hours for deliverables + variations
      let totalDeliverablesWithVariationsHours = 0;
      
      // Get deliverables options from data if available, or transform from deliverables array
      let deliverablesOptions = data.deliverablesOptions || [];
      if (!deliverablesOptions.length && data.deliverables && Array.isArray(data.deliverables)) {
        deliverablesOptions = data.deliverables.map(deliverable => ({
          value: deliverable.name,
          label: deliverable.name,
          department: deliverable.department,
          timePerUnit: deliverable.timePerUnit,
          timeUnit: deliverable.timeUnit,
          requiresQuantity: deliverable.requiresQuantity,
          variationsTime: deliverable.variationsTime,
          variationsTimeUnit: deliverable.variationsTimeUnit || 'min',
          declinariTime: deliverable.declinariTime,
          declinariTimeUnit: deliverable.declinariTimeUnit
        }));
      }

      // Calculate deliverables hours with variations
      if (deliverablesOptions.length > 0) {
        filteredTasks.forEach(task => {
          const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
          if (!deliverables || deliverables.length === 0) return;

          deliverables.forEach(deliverable => {
            const deliverableName = deliverable?.name;
            const quantity = deliverable?.count || 1;
            const variationsQuantity = deliverable?.variationsCount || deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;

            if (!deliverableName) return;

            // Find deliverable in options
            const deliverableOption = deliverablesOptions.find(d =>
              d.value && d.value.toLowerCase().trim() === deliverableName.toLowerCase().trim()
            );

            if (deliverableOption) {
              const timePerUnit = deliverableOption.timePerUnit || 1;
              const timeUnit = deliverableOption.timeUnit || 'hr';
              const requiresQuantity = deliverableOption.requiresQuantity || false;

              // Convert base time to hours
              let baseTimeInHours = timePerUnit;
              if (timeUnit === 'min') baseTimeInHours = timePerUnit / 60;
              else if (timeUnit === 'hr') baseTimeInHours = timePerUnit;
              else if (timeUnit === 'day') baseTimeInHours = timePerUnit * 8;

              // Calculate base time for this deliverable (quantity × timePerUnit)
              const deliverableBaseHours = baseTimeInHours * quantity;

              // Calculate variations time if applicable
              let variationsTimeInHours = 0;
              if (requiresQuantity && variationsQuantity > 0) {
                const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
                const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';

                let variationsTimePerUnitInHours = variationsTime;
                if (variationsTimeUnit === 'min') variationsTimePerUnitInHours = variationsTime / 60;
                else if (variationsTimeUnit === 'hr') variationsTimePerUnitInHours = variationsTime;
                else if (variationsTimeUnit === 'day') variationsTimePerUnitInHours = variationsTime * 8;

                variationsTimeInHours = variationsTimePerUnitInHours * variationsQuantity;
              }

              // Total time with variations
              const totalWithVariations = deliverableBaseHours + variationsTimeInHours;
              totalDeliverablesWithVariationsHours += totalWithVariations;
            }
          });
        });
      }

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

  // Analytics card configurations
  [SMALL_CARD_TYPES.ANALYTICS_TASK_OVERVIEW]: {
    title: "Task Overview",
    subtitle: (data) => data.userName || data.reporterName || "Total Tasks",
    description: "Total Tasks",
    icon: Icons.generic.task,
    color: "blue",
    getValue: (data) => data.totalTasksThisMonth?.toString() || "0",
    getStatus: (data) => `${data.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.totalHours || 0}h`,
      color: "blue",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.clock,
        label: "Total Hours This Month",
        value: `${data.totalHours || 0}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Weekly Average",
        value: `${Math.round((data.weeklyTasks || []).reduce((a, b) => a + b, 0) / 7)} tasks`,
      },
      {
        icon: Icons.generic.timer,
        label: "Daily Average Hours",
        value: `${((data.dailyHours || []).reduce((a, b) => a + b, 0) / 7).toFixed(1)}h`,
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DELIVERABLES]: {
    title: "Deliverables",
    subtitle: "NB Stats",
    description: "deliverables",
    icon: Icons.generic.deliverable,
    color: "orange",
    getValue: (data) => (data.totalDeliverables || 0).toString(),
    getStatus: (data) => `${data.totalVariations || 0} variations`,
    getBadge: (data) => ({
      text: `${data.totalVariations || 0} var`,
      color: "orange",
    }),
    getDetails: (data) => {
      const baseHours = data.totalDeliverablesHours || 0;
      const totalHours = data.totalDeliverablesWithVariationsHours || 0;
      const variationsHours = totalHours - baseHours;

      return [
        {
          icon: Icons.generic.package,
          label: "Total Deliverables",
          value: (data.totalDeliverables || 0).toString(),
        },
        {
          icon: Icons.generic.warning,
          label: "Total Variations",
          value: (data.totalVariations || 0).toString(),
        },
        {
          icon: Icons.generic.clock,
          label: "Base Hours (Deliverables Only)",
          value: `${baseHours.toFixed(1)}h`,
        },
        {
          icon:
            variationsHours > 0 ? Icons.generic.warning : Icons.generic.clock,
          label: "Variations Hours",
          value: `${variationsHours.toFixed(1)}h`,
        },
        {
          icon: Icons.generic.timer,
          label: "Total Hours (Deliverables + Variations)",
          value: `${totalHours.toFixed(1)}h`,
        },
      ];
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_MARKETING]: {
    title: "Marketing",
    subtitle: "Marketing Tasks",
    description: "CRM Tasks",
    icon: Icons.generic.target,
    color: "purple",
    getValue: (data) => (data.marketingData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.marketingData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.marketingData?.totalHours || 0}h`,
      color: "purple",
    }),
    getDetails: (data) => {
      const marketingData = data.marketingData || {};
      const details = [];

      // Add each marketing subcategory
      Object.entries(marketingData).forEach(([subcategory, info]) => {
        if (subcategory !== "totalTasks" && subcategory !== "totalHours") {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges:
              info.markets && Object.keys(info.markets).length > 0
                ? info.markets
                : null,
          });
        }
      });

      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_ACQUISITION]: {
    title: "Acquisition",
    subtitle: "Acquisition Tasks",
    description: "ACQ Tasks ",
    icon: Icons.generic.users,
    color: "yellow",
    getValue: (data) => (data.acquisitionData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.acquisitionData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.acquisitionData?.totalHours || 0}h`,
      color: "yellow",
    }),
    getDetails: (data) => {
      const acquisitionData = data.acquisitionData || {};
      const details = [];

      // Add each acquisition subcategory
      Object.entries(acquisitionData).forEach(([subcategory, info]) => {
        if (subcategory !== "totalTasks" && subcategory !== "totalHours") {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges:
              info.markets && Object.keys(info.markets).length > 0
                ? info.markets
                : null,
          });
        }
      });

      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_PRODUCT]: {
    title: "Product",
    subtitle: "Product Tasks",
    description: "Product Analysis",
    icon: Icons.generic.package,
    color: "orange",
    getValue: (data) => (data.productData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.productData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.productData?.totalHours || 0}h`,
      color: "orange",
    }),
    getDetails: (data) => {
      const productData = data.productData || {};
      const details = [];

      // Add total hours first
      if (productData.totalHours) {
        details.push({
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${productData.totalHours}h`,
        });
      }

      // Add each product subcategory
      Object.entries(productData).forEach(([subcategory, info]) => {
        if (subcategory !== "totalTasks" && subcategory !== "totalHours") {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges:
              info.markets && Object.keys(info.markets).length > 0
                ? info.markets
                : null,
          });
        }
      });

      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_MISC]: {
    title: "Misc",
    subtitle: "Miscellaneous Tasks",
    description: "Misc Analysis",
    icon: Icons.generic.document,
    color: "gray",
    getValue: (data) => (data.miscData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.miscData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.miscData?.totalHours || 0}h`,
      color: "gray",
    }),
    getDetails: (data) => {
      const miscData = data.miscData || {};
      const details = [];

      // Add total hours first
      if (miscData.totalHours) {
        details.push({
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${miscData.totalHours}h`,
        });
      }

      // Add each misc subcategory
      Object.entries(miscData).forEach(([subcategory, info]) => {
        if (subcategory !== "totalTasks" && subcategory !== "totalHours") {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges:
              info.markets && Object.keys(info.markets).length > 0
                ? info.markets
                : null,
          });
        }
      });

      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_EFFICIENCY]: {
    title: "Performance",
    subtitle: "Quality Metrics",
    description: "Performance",
    icon: Icons.generic.chart,
    color: "crimson",
    getValue: (data) => `${data.efficiency?.productivityScore || 0}%`,
    getStatus: (data) => `${data.efficiency?.productivityScore || 0}%`,
    getBadge: (data) => ({
      text: `${data.efficiency?.productivityScore || 0}%`,
      color: "crimson",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.target,
        label: "Productivity Score",
        value: `${data.efficiency?.productivityScore || 0}%`,
      },
      {
        icon: Icons.generic.clock,
        label: "Avg Task Completion",
        value: `${data.efficiency?.averageTaskCompletion || 0} days`,
      },
      {
        icon: Icons.generic.star,
        label: "Quality Rating",
        value: `${data.efficiency?.qualityRating || 0}/5`,
      },
      {
        icon: Icons.generic.check,
        label: "On-Time Delivery",
        value: `${data.efficiency?.onTimeDelivery || 0}%`,
      },
    ],
  },

  // Daily task cards
  [SMALL_CARD_TYPES.ANALYTICS_DAILY_MONDAY]: {
    title: "Monday",
    subtitle: "Daily Tasks",
    description: "Tasks & Hours",
    icon: Icons.generic.calendar,
    color: "blue",
    getValue: (data) => (data.weeklyTasks?.[0] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
      color: "blue",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Tasks",
        value: (data.weeklyTasks?.[0] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: "Hours",
        value: `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Avg Task",
        value:
          data.weeklyTasks?.[0] > 0
            ? `${(data.dailyHours?.[0] / data.weeklyTasks?.[0]).toFixed(1)}h`
            : "0.0h",
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_TUESDAY]: {
    title: "Tuesday",
    subtitle: "Daily Tasks",
    description: "Tasks & Hours",
    icon: Icons.generic.calendar,
    color: "green",
    getValue: (data) => (data.weeklyTasks?.[1] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
      color: "green",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Tasks",
        value: (data.weeklyTasks?.[1] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: "Hours",
        value: `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Avg Task",
        value:
          data.weeklyTasks?.[1] > 0
            ? `${(data.dailyHours?.[1] / data.weeklyTasks?.[1]).toFixed(1)}h`
            : "0.0h",
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_WEDNESDAY]: {
    title: "Wednesday",
    subtitle: "Daily Tasks",
    description: "Tasks & Hours",
    icon: Icons.generic.calendar,
    color: "purple",
    getValue: (data) => (data.weeklyTasks?.[2] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
      color: "purple",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Tasks",
        value: (data.weeklyTasks?.[2] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: "Hours",
        value: `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Avg Task",
        value:
          data.weeklyTasks?.[2] > 0
            ? `${(data.dailyHours?.[2] / data.weeklyTasks?.[2]).toFixed(1)}h`
            : "0.0h",
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_THURSDAY]: {
    title: "Thursday",
    subtitle: "Daily Tasks",
    description: "Tasks & Hours",
    icon: Icons.generic.calendar,
    color: "orange",
    getValue: (data) => (data.weeklyTasks?.[3] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
      color: "orange",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Tasks",
        value: (data.weeklyTasks?.[3] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: "Hours",
        value: `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Avg Task",
        value:
          data.weeklyTasks?.[3] > 0
            ? `${(data.dailyHours?.[3] / data.weeklyTasks?.[3]).toFixed(1)}h`
            : "0.0h",
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_FRIDAY]: {
    title: "Friday",
    subtitle: "Daily Tasks",
    description: "Tasks & Hours",
    icon: Icons.generic.calendar,
    color: "yellow",
    getValue: (data) => (data.weeklyTasks?.[4] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
      color: "yellow",
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Tasks",
        value: (data.weeklyTasks?.[4] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: "Hours",
        value: `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: "Avg Task",
        value:
          data.weeklyTasks?.[4] > 0
            ? `${(data.dailyHours?.[4] / data.weeklyTasks?.[4]).toFixed(1)}h`
            : "0.0h",
      },
    ],
  },
};

export const createCards = (data, mode = "main") => {
  let cardTypes = [];
  // Allow passing a custom list of types as the second argument
  if (Array.isArray(mode)) {
    cardTypes = mode;
  } else {
    switch (mode) {
      case "main":
        cardTypes = [
          SMALL_CARD_TYPES.MONTH_SELECTION,
          SMALL_CARD_TYPES.ACTIONS,
          SMALL_CARD_TYPES.WEEK_SELECTOR,
          ...(data.isUserAdmin
            ? [SMALL_CARD_TYPES.USER_FILTER, SMALL_CARD_TYPES.REPORTER_FILTER]
            : [SMALL_CARD_TYPES.REPORTER_FILTER]),
          SMALL_CARD_TYPES.USER_PROFILE,
        ];
        break;
      case "analytics":
        cardTypes = [
          SMALL_CARD_TYPES.ANALYTICS_TASK_OVERVIEW,
          SMALL_CARD_TYPES.ANALYTICS_DELIVERABLES,
          SMALL_CARD_TYPES.ANALYTICS_MARKETING,
          SMALL_CARD_TYPES.ANALYTICS_ACQUISITION,
          SMALL_CARD_TYPES.ANALYTICS_PRODUCT,
          SMALL_CARD_TYPES.ANALYTICS_MISC,
        ];
        break;
      case "daily":
        cardTypes = [
          SMALL_CARD_TYPES.ANALYTICS_DAILY_MONDAY,
          SMALL_CARD_TYPES.ANALYTICS_DAILY_TUESDAY,
          SMALL_CARD_TYPES.ANALYTICS_DAILY_WEDNESDAY,
          SMALL_CARD_TYPES.ANALYTICS_DAILY_THURSDAY,
          SMALL_CARD_TYPES.ANALYTICS_DAILY_FRIDAY,
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
