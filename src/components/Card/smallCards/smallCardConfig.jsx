import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { getWeeksInMonth } from "@/utils/monthUtils";
import { CARD_SYSTEM } from "@/constants";



// Color assignment for icons - uses colors from CARD_SYSTEM.COLOR_HEX_MAP
export const getCardColor = (cardType, data = {}) => {
  // Use the same color for all small cards
  return 'select_badge';
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
    color: (data) => getCardColor("month-selection", data),
    getValue: (data) => data.availableMonths?.length || 0,
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "History"),
    getBadge: (data) => {
      const cardColor = getCardColor("month-selection", data);
      const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];
      return {
        text: data.isCurrentMonth ? "Current" : "History",
        color: cardColor,
        colorHex: colorHex
      };
    },
    getContent: (data) => (
      <div className="mb-6">
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
    color: (data) => getCardColor("user-filter", data),
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
    getBadge: (data) => {
      const cardColor = getCardColor("user-filter", data);
      const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];
      return {
        text: data.selectedUserId ? "Filtered" : "All Users",
        color: cardColor,
        colorHex: colorHex
      };
    },
    getContent: (data) => (
      <div className="mb-6 space-y-3">
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
        />
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.user,
        label: "Selected",
        value: data.selectedUserId ? data.selectedUserName : "All Users",
      },
      {
        icon: Icons.generic.users,
        label: "Total Users",
        value: `${data.users?.length || 0} users`,
      },
    ],
  },

  [SMALL_CARD_TYPES.REPORTER_FILTER]: {
    title: "Reporter Filter",
    subtitle: "View All",
    description: "Reporters",
    icon: Icons.admin.reporters,
    color: (data) => getCardColor("reporter-filter", data),
    getValue: (data) => {
      // Show total number of reporters, not tasks
      return (data.reporters?.length || 0).toString();
    },
    getStatus: (data) => {
      if (data.selectedReporterId) {
        return data.selectedReporterName;
      }
      return "All Reporters";
    },
    getBadge: (data) => {
      const cardColor = getCardColor("reporter-filter", data);
      const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];
      return {
        text: data.selectedReporterId ? "Filtered" : "All Reporters",
        color: cardColor,
        colorHex: colorHex
      };
    },
    getContent: (data) => (
      <div className="mb-6 space-y-3">
        <SearchableSelectField
          field={{
            name: "selectedReporter",
            type: "select",
            label: "Select Reporter",
            required: false,
            options:
              data.reporters?.map((reporter) => ({
                value: reporter.reporterUID || reporter.id || reporter.uid,
                label: reporter.name || reporter.reporterName,
              })) || [],
            placeholder: "Search reporters...",
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
        />
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.admin.reporters,
        label: "Selected",
        value: data.selectedReporterId
          ? data.selectedReporterName
          : "All Reporters",
      },
      {
        icon: Icons.admin.reporters,
        label: "Total Reporters",
        value: `${data.reporters?.length || 0} reporters`,
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_PROFILE]: {
    title: "User Profile",
    subtitle: "View All",
    description: "Tasks",
    icon: Icons.generic.user,
    color: (data) => getCardColor("user-profile", data),
    getBadge: (data) => {
      const cardColor = getCardColor("user-profile", data);
      const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];
      return {
        text: (data.currentUser?.role || "user").toLowerCase(),
        color: cardColor,
        colorHex: colorHex
      };
    },
    getValue: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return "0";

      const selectedUserId = data.selectedUserId;
      const selectedReporterId = data.selectedReporterId;
      const currentMonthId =
        data.selectedMonth?.monthId || data.currentMonth?.monthId;

      // Filter tasks based on selections
      const filteredTasks = data.tasks.filter((task) => {
        // Always filter by month first
        if (currentMonthId && task.monthId !== currentMonthId) return false;

        // If both user and reporter are selected, show tasks that match BOTH
        if (selectedUserId && selectedReporterId) {
          const matchesUser =
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId;
          const matchesReporter =
            task.reporterUID === selectedReporterId ||
            task.data_task?.reporterUID === selectedReporterId;
          return matchesUser && matchesReporter;
        }

        // If only user is selected, show tasks for that user
        if (selectedUserId && !selectedReporterId) {
          return (
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId
          );
        }

        // If only reporter is selected, show tasks for that reporter
        if (selectedReporterId && !selectedUserId) {
          return (
            task.reporterUID === selectedReporterId ||
            task.data_task?.reporterUID === selectedReporterId
          );
        }

        // If no selections, show current user's tasks
        const userUID = data.currentUser?.userUID;
        return (
          userUID && (task.userUID === userUID || task.createbyUID === userUID)
        );
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
          (r) => (r.id || r.uid) === data.selectedReporterId
        );
        details.push({
          label: "Selected Reporter",
          value:
            selectedReporter?.name ||
            selectedReporter?.reporterName ||
            "Unknown Reporter",
        });
      }

      // Show current user info
      details.push({
        label: "Current User",
        value: data.currentUser?.name || data.currentUser?.email || "N/A",
      });


      return details;
    },
    getContent: (data) => (
      <div className="mb-6">
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
              const userName = selectedUser?.name || selectedUser?.email || 'Unknown';
              params.set('user', userName);
            } else {
              // Always show current user's data by default
              const userName = data.currentUser?.name || data.currentUser?.email || 'My Data';
              params.set('user', userName);
            }
            // If only reporter is selected (no user), don't set user parameter
            
            // Handle reporter selection
            if (data.selectedReporterId) {
              const selectedReporter = data.reporters?.find(
                (r) => (r.id || r.uid) === data.selectedReporterId
              );
              const reporterName = selectedReporter?.name || selectedReporter?.reporterName || 'Unknown Reporter';
              params.set('reporter', reporterName);
            }
            
            // Handle week selection - only set week parameter if a specific week is selected
            if (data.selectedWeek) {
              params.set('week', data.selectedWeek.weekNumber.toString());
            }
            // If no week selected (All Weeks), don't set week parameter
            
            // Handle month selection
            if (data.selectedMonth?.monthId) {
              params.set('month', data.selectedMonth.monthId);
            } else if (data.currentMonth?.monthId) {
              params.set('month', data.currentMonth.monthId);
            }
            
            const url = `/analytics-detail?${params.toString()}`;
            
            if (data.navigate) {
              data.navigate(url);
            } else {
              // Use React Router navigation instead of window.location.href
              window.history.pushState({}, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          iconName="view"
          variant="primary"
          size="sm"
          className="w-full uppercase"
        >
          {(() => {
            // Determine button text based on context and selections
            const parts = [];
            
            // User part - always show current user data
            if (data.selectedUserId && data.currentUser?.role === "admin") {
              // Admin viewing specific user
              const selectedUser = data.users?.find(
                (u) => u.userUID === data.selectedUserId
              );
              const userName = selectedUser?.name?.toUpperCase() || selectedUser?.email?.toUpperCase() || "USER";
              parts.push(userName);
            } else {
              // Always show current user data
              const currentUserName = data.currentUser?.name?.toUpperCase() || data.currentUser?.email?.toUpperCase() || "MY";
              parts.push(currentUserName);
            }
            
            // Reporter part - only add if both user and reporter are selected
            if (data.selectedReporterId && data.selectedUserId) {
              const selectedReporter = data.reporters?.find(
                (r) => (r.id || r.uid) === data.selectedReporterId
              );
              const reporterName = selectedReporter?.name?.toUpperCase() || selectedReporter?.reporterName?.toUpperCase() || "REPORTER";
              parts.push(reporterName);
            }
            
            // Week part - show week if selected, otherwise show "ALL WEEKS"
            if (data.selectedWeek) {
              parts.push(`WEEK ${data.selectedWeek.weekNumber}`);
            } else {
              parts.push("ALL WEEKS");
            }
            
            // Build final text
            if (parts.length === 1) {
              return `VIEW ${parts[0]} DATA`;
            } else {
              return `VIEW ${parts.join(" + ")} DATA`;
            }
          })()}
        </DynamicButton>
        
        {/* Second button for all data tasks - no filters */}
        <DynamicButton
          onClick={() => {
            // Build URL parameters for ALL data tasks (no filters at all)
            const params = new URLSearchParams();
            
            // Don't set any parameters - this will show all data from all months/weeks/users/reporters
            // This will show all tasks in the system without any filtering
            
            const url = `/analytics-detail?${params.toString()}`;
            
            if (data.navigate) {
              data.navigate(url);
            } else {
              // Use React Router navigation instead of window.location.href
              window.history.pushState({}, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          iconName="users"
          variant="primary"
          size="sm"
          className="w-full mt-2 uppercase"
        >
          VIEW ALL DATA
        </DynamicButton>
      </div>
    ),
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Task Statistics",
    subtitle: "View All",
    description: "Total Tasks",
    icon: Icons.buttons.add,
    color: (data) => getCardColor("actions", data),
    getBadge: (data) => {
      const cardColor = getCardColor("actions", data);
      const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];
      return {
        text: data.selectedWeek ? `Week ${data.selectedWeek.weekNumber}` : "All Weeks",
        color: cardColor,
        colorHex: colorHex
      };
    },
    getValue: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return "0";
      
      const currentMonthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
      
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
            }))
          ];
        } catch (error) {
          console.warn('Error getting weeks for month:', error);
        }
      }

      return (
        <div className="mb-6">
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
                  const week = weeks.find(w => w.weekNumber === weekNumber);
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
          />
        </div>
      );
    },
    getDetails: (data) => {
      if (!data.tasks || !Array.isArray(data.tasks)) return [];
      
      const currentMonthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
      
      // Filter tasks by month first
      let filteredTasks = data.tasks.filter((task) => {
        if (currentMonthId && task.monthId !== currentMonthId) return false;
        return true;
      });
      
      // If a week is selected, filter by week; otherwise show all tasks for the month
      if (data.selectedWeek && data.selectedWeek.days) {
        const weekTasks = [];
        data.selectedWeek.days.forEach(day => {
          try {
            const dayDate = day instanceof Date ? day : new Date(day);
            if (isNaN(dayDate.getTime())) return;
            
            const dayStr = dayDate.toISOString().split('T')[0];
            const dayTasks = filteredTasks.filter(task => {
              if (!task.createdAt) return false;
              
              // Handle Firestore Timestamp
              let taskDate;
              if (task.createdAt && typeof task.createdAt === 'object' && task.createdAt.seconds) {
                taskDate = new Date(task.createdAt.seconds * 1000);
              } else if (task.createdAt && typeof task.createdAt === 'object' && task.createdAt.toDate) {
                taskDate = task.createdAt.toDate();
              } else {
                taskDate = new Date(task.createdAt);
              }
              
              if (isNaN(taskDate.getTime())) return false;
              const taskDateStr = taskDate.toISOString().split('T')[0];
              return taskDateStr === dayStr;
            });
            weekTasks.push(...dayTasks);
          } catch (error) {
            console.warn('Error processing day:', error, day);
          }
        });
        filteredTasks = weekTasks;
      }
      // If no week selected (selectedWeek is null), show all tasks for the month
      
      // Apply user and reporter filtering if specified
      if (data.selectedUserId || data.selectedReporterId) {
        filteredTasks = filteredTasks.filter((task) => {
          // If both user and reporter are selected, show tasks that match BOTH
          if (data.selectedUserId && data.selectedReporterId) {
            const matchesUser = task.userUID === data.selectedUserId || task.createbyUID === data.selectedUserId;
            const matchesReporter = task.reporterUID === data.selectedReporterId || task.data_task?.reporterUID === data.selectedReporterId;
            return matchesUser && matchesReporter;
          }
          
          // If only user is selected, show tasks for that user
          if (data.selectedUserId && !data.selectedReporterId) {
            return task.userUID === data.selectedUserId || task.createbyUID === data.selectedUserId;
          }
          
          // If only reporter is selected, show tasks for that reporter
          if (data.selectedReporterId && !data.selectedUserId) {
            return task.reporterUID === data.selectedReporterId || task.data_task?.reporterUID === data.selectedReporterId;
          }
          
          return true;
        });
      }
      
      // Calculate statistics
      const totalTasks = filteredTasks.length;
      const totalHours = filteredTasks.reduce((sum, task) => {
        const hours = task.data_task?.timeInHours || task.timeInHours || 0;
        return sum + (typeof hours === 'number' ? hours : 0);
      }, 0);
      
      const totalDeliverables = filteredTasks.reduce((sum, task) => {
        const deliverables = task.data_task?.deliverablesUsed || task.deliverablesUsed || [];
        return sum + deliverables.reduce((delSum, del) => {
          return delSum + (del.count || 1);
        }, 0);
      }, 0);
      
      const declinedQuantity = filteredTasks.reduce((sum, task) => {
        // Count tasks that are marked as declined or reworked
        const isDeclined = task.data_task?.reworked || task.reworked || false;
        return sum + (isDeclined ? 1 : 0);
      }, 0);
      
      return [
        {
          icon: Icons.generic.clock,
          label: "Total Hours",
          value: `${totalHours.toFixed(1)}h`,
        },
        {
          icon: Icons.generic.deliverable,
          label: "Total Deliverables",
          value: totalDeliverables.toString(),
        },
        {
          icon: Icons.generic.warning,
          label: "Variation Name",
          value: declinedQuantity.toString(),
        },
      ];
    },
  },

  // Analytics card configurations
  [SMALL_CARD_TYPES.ANALYTICS_TASK_OVERVIEW]: {
    title: 'Task Overview',
    subtitle: (data) => data.userName || data.reporterName || 'Total Tasks',
    description: 'Total Tasks',
    icon: Icons.generic.task,
    color: (data) => getCardColor('analytics-task-overview', data),
    getValue: (data) => data.totalTasksThisMonth?.toString() || '0',
    getStatus: (data) => `${data.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.totalHours || 0}h`,
      color: getCardColor('analytics-task-overview', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.clock,
        label: 'Total Hours This Month',
        value: `${data.totalHours || 0}h`,
      },
      {
        icon: Icons.generic.calendar,
        label: 'Total Tasks (3 Months)',
        value: (data.totalTasksMultipleMonths || 0).toString(),
      },
      {
        icon: Icons.generic.target,
        label: 'Weekly Average',
        value: `${Math.round((data.weeklyTasks || []).reduce((a, b) => a + b, 0) / 7)} tasks`,
      },
      {
        icon: Icons.generic.timer,
        label: 'Daily Average Hours',
        value: `${((data.dailyHours || []).reduce((a, b) => a + b, 0) / 7).toFixed(1)}h`,
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DELIVERABLES]: {
    title: 'Deliverables',
    subtitle: 'NB Stats',
    description: 'deliverables',
    icon: Icons.generic.deliverable,
    color: (data) => getCardColor('analytics-deliverables', data),
    getValue: (data) => (data.totalDeliverables || 0).toString(),
    getStatus: (data) => `${data.totalVariations || 0} variations`,
    getBadge: (data) => ({
      text: `${data.totalVariations || 0} var`,
      color: getCardColor('analytics-deliverables', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.package,
        label: 'Total Deliverables',
        value: (data.totalDeliverables || 0).toString(),
      },
      {
        icon: Icons.generic.warning,
        label: 'Total Variations',
        value: (data.totalVariations || 0).toString(),
      },
      {
        icon: Icons.generic.target,
        label: 'Deliverables per Task',
        value: data.totalTasksThisMonth > 0 ? `${((data.totalDeliverables || 0) / data.totalTasksThisMonth).toFixed(1)}` : '0',
      },
      {
        icon: Icons.generic.star,
        label: 'Variation Rate',
        value: data.totalDeliverables > 0 ? `${(((data.totalVariations || 0) / data.totalDeliverables) * 100).toFixed(1)}%` : '0%',
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_MARKETING]: {
    title: 'Marketing',
    subtitle: 'Marketing Tasks',
    description: 'CRM Tasks',
    icon: Icons.generic.target,
    color: (data) => getCardColor('analytics-marketing', data),
    getValue: (data) => (data.marketingData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.marketingData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.marketingData?.totalHours || 0}h`,
      color: getCardColor('analytics-marketing', data)
    }),
    getDetails: (data) => {
      const marketingData = data.marketingData || {};
      const details = [];
      
      // Add each marketing subcategory
      Object.entries(marketingData).forEach(([subcategory, info]) => {
        if (subcategory !== 'totalTasks' && subcategory !== 'totalHours') {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges: info.markets && Object.keys(info.markets).length > 0 
              ? info.markets 
              : null
          });
        }
      });
      
      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_ACQUISITION]: {
    title: 'Acquisition',
    subtitle: 'Acquisition Tasks',
    description: 'ACQ Tasks ',
    icon: Icons.generic.users,
    color: (data) => getCardColor('analytics-acquisition', data),
    getValue: (data) => (data.acquisitionData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.acquisitionData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.acquisitionData?.totalHours || 0}h`,
      color: getCardColor('analytics-acquisition', data)
    }),
    getDetails: (data) => {
      const acquisitionData = data.acquisitionData || {};
      const details = [];
      
      // Add each acquisition subcategory
      Object.entries(acquisitionData).forEach(([subcategory, info]) => {
        if (subcategory !== 'totalTasks' && subcategory !== 'totalHours') {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges: info.markets && Object.keys(info.markets).length > 0 
              ? info.markets 
              : null
          });
        }
      });
      
      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_PRODUCT]: {
    title: 'Product',
    subtitle: 'Product Tasks',
    description: 'Product Analysis',
    icon: Icons.generic.package,
    color: (data) => getCardColor('analytics-product', data),
    getValue: (data) => (data.productData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.productData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.productData?.totalHours || 0}h`,
      color: getCardColor('analytics-product', data)
    }),
    getDetails: (data) => {
      const productData = data.productData || {};
      const details = [];
      
      // Add total hours first
      if (productData.totalHours) {
        details.push({
          icon: Icons.generic.clock,
          label: 'Total Hours',
          value: `${productData.totalHours}h`,
        });
      }
      
      // Add each product subcategory
      Object.entries(productData).forEach(([subcategory, info]) => {
        if (subcategory !== 'totalTasks' && subcategory !== 'totalHours') {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges: info.markets && Object.keys(info.markets).length > 0 
              ? info.markets 
              : null
          });
        }
      });
      
      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_MISC]: {
    title: 'Misc',
    subtitle: 'Miscellaneous Tasks',
    description: 'Misc Analysis',
    icon: Icons.generic.document,
    color: (data) => getCardColor('analytics-misc', data),
    getValue: (data) => (data.miscData?.totalTasks || 0).toString(),
    getStatus: (data) => `${data.miscData?.totalHours || 0}h`,
    getBadge: (data) => ({
      text: `${data.miscData?.totalHours || 0}h`,
      color: getCardColor('analytics-misc', data)
    }),
    getDetails: (data) => {
      const miscData = data.miscData || {};
      const details = [];
      
      // Add total hours first
      if (miscData.totalHours) {
        details.push({
          icon: Icons.generic.clock,
          label: 'Total Hours',
          value: `${miscData.totalHours}h`,
        });
      }
      
      // Add each misc subcategory
      Object.entries(miscData).forEach(([subcategory, info]) => {
        if (subcategory !== 'totalTasks' && subcategory !== 'totalHours') {
          details.push({
            icon: Icons.generic.task,
            label: subcategory,
            value: `${info.tasks} tasks`,
            badges: info.markets && Object.keys(info.markets).length > 0 
              ? info.markets 
              : null
          });
        }
      });
      
      return details;
    },
  },

  [SMALL_CARD_TYPES.ANALYTICS_EFFICIENCY]: {
    title: 'Performance',
    subtitle: 'Quality Metrics',
    description: 'Performance',
    icon: Icons.generic.chart,
    color: (data) => getCardColor('analytics-efficiency', data),
    getValue: (data) => `${data.efficiency?.productivityScore || 0}%`,
    getStatus: (data) => `${data.efficiency?.productivityScore || 0}%`,
    getBadge: (data) => ({
      text: `${data.efficiency?.productivityScore || 0}%`,
      color: getCardColor('analytics-efficiency', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.target,
        label: 'Productivity Score',
        value: `${data.efficiency?.productivityScore || 0}%`,
      },
      {
        icon: Icons.generic.clock,
        label: 'Avg Task Completion',
        value: `${data.efficiency?.averageTaskCompletion || 0} days`,
      },
      {
        icon: Icons.generic.star,
        label: 'Quality Rating',
        value: `${data.efficiency?.qualityRating || 0}/5`,
      },
      {
        icon: Icons.generic.check,
        label: 'On-Time Delivery',
        value: `${data.efficiency?.onTimeDelivery || 0}%`,
      },
    ],
  },

  // Daily task cards
  [SMALL_CARD_TYPES.ANALYTICS_DAILY_MONDAY]: {
    title: 'Monday',
    subtitle: 'Daily Tasks',
    description: 'Tasks & Hours',
    icon: Icons.generic.calendar,
    color: (data) => getCardColor('analytics-daily-monday', data),
    getValue: (data) => (data.weeklyTasks?.[0] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
      color: getCardColor('analytics-daily-monday', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: 'Tasks',
        value: (data.weeklyTasks?.[0] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: 'Hours',
        value: `${(data.dailyHours?.[0] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: 'Avg Task',
        value: data.weeklyTasks?.[0] > 0 
          ? `${(data.dailyHours?.[0] / data.weeklyTasks?.[0]).toFixed(1)}h`
          : '0.0h',
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_TUESDAY]: {
    title: 'Tuesday',
    subtitle: 'Daily Tasks',
    description: 'Tasks & Hours',
    icon: Icons.generic.calendar,
    color: (data) => getCardColor('analytics-daily-tuesday', data),
    getValue: (data) => (data.weeklyTasks?.[1] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
      color: getCardColor('analytics-daily-tuesday', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: 'Tasks',
        value: (data.weeklyTasks?.[1] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: 'Hours',
        value: `${(data.dailyHours?.[1] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: 'Avg Task',
        value: data.weeklyTasks?.[1] > 0 
          ? `${(data.dailyHours?.[1] / data.weeklyTasks?.[1]).toFixed(1)}h`
          : '0.0h',
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_WEDNESDAY]: {
    title: 'Wednesday',
    subtitle: 'Daily Tasks',
    description: 'Tasks & Hours',
    icon: Icons.generic.calendar,
    color: (data) => getCardColor('analytics-daily-wednesday', data),
    getValue: (data) => (data.weeklyTasks?.[2] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
      color: getCardColor('analytics-daily-wednesday', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: 'Tasks',
        value: (data.weeklyTasks?.[2] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: 'Hours',
        value: `${(data.dailyHours?.[2] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: 'Avg Task',
        value: data.weeklyTasks?.[2] > 0 
          ? `${(data.dailyHours?.[2] / data.weeklyTasks?.[2]).toFixed(1)}h`
          : '0.0h',
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_THURSDAY]: {
    title: 'Thursday',
    subtitle: 'Daily Tasks',
    description: 'Tasks & Hours',
    icon: Icons.generic.calendar,
    color: (data) => getCardColor('analytics-daily-thursday', data),
    getValue: (data) => (data.weeklyTasks?.[3] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
      color: getCardColor('analytics-daily-thursday', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: 'Tasks',
        value: (data.weeklyTasks?.[3] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: 'Hours',
        value: `${(data.dailyHours?.[3] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: 'Avg Task',
        value: data.weeklyTasks?.[3] > 0 
          ? `${(data.dailyHours?.[3] / data.weeklyTasks?.[3]).toFixed(1)}h`
          : '0.0h',
      },
    ],
  },

  [SMALL_CARD_TYPES.ANALYTICS_DAILY_FRIDAY]: {
    title: 'Friday',
    subtitle: 'Daily Tasks',
    description: 'Tasks & Hours',
    icon: Icons.generic.calendar,
    color: (data) => getCardColor('analytics-daily-friday', data),
    getValue: (data) => (data.weeklyTasks?.[4] || 0).toString(),
    getStatus: (data) => `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
    getBadge: (data) => ({
      text: `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
      color: getCardColor('analytics-daily-friday', data)
    }),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: 'Tasks',
        value: (data.weeklyTasks?.[4] || 0).toString(),
      },
      {
        icon: Icons.generic.clock,
        label: 'Hours',
        value: `${(data.dailyHours?.[4] || 0).toFixed(1)}h`,
      },
      {
        icon: Icons.generic.target,
        label: 'Avg Task',
        value: data.weeklyTasks?.[4] > 0 
          ? `${(data.dailyHours?.[4] / data.weeklyTasks?.[4]).toFixed(1)}h`
          : '0.0h',
      },
    ],
  },
};

// Create small cards with data
export const createSmallCards = (data) => {
  const cardTypes = [
    SMALL_CARD_TYPES.MONTH_SELECTION,
    SMALL_CARD_TYPES.ACTIONS, // Task Statistics after month
    SMALL_CARD_TYPES.WEEK_SELECTOR,
    // Show filters based on user role
    ...(data.isUserAdmin
      ? [SMALL_CARD_TYPES.USER_FILTER, SMALL_CARD_TYPES.REPORTER_FILTER] // Admin sees user first, then reporter
      : [SMALL_CARD_TYPES.REPORTER_FILTER]), // Regular users see only reporter filter
    SMALL_CARD_TYPES.USER_PROFILE,
  ];

  return cardTypes
    .map((cardType) => {
      const config = SMALL_CARD_CONFIGS[cardType];
      if (!config) {
        return null;
      }

      try {
        const card = {
          id: `${cardType}-card`,
          title: config.title,
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

// Create analytics cards using the centralized system
export const createAnalyticsCards = (data) => {
  const cardTypes = [
    SMALL_CARD_TYPES.ANALYTICS_TASK_OVERVIEW,
    SMALL_CARD_TYPES.ANALYTICS_DELIVERABLES,
    SMALL_CARD_TYPES.ANALYTICS_MARKETING,
    SMALL_CARD_TYPES.ANALYTICS_ACQUISITION,
    SMALL_CARD_TYPES.ANALYTICS_EFFICIENCY,
    SMALL_CARD_TYPES.ANALYTICS_PRODUCT,
    SMALL_CARD_TYPES.ANALYTICS_MISC,
  ];

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

// Create daily task cards using the centralized system
export const createDailyTaskCards = (data) => {
  const cardTypes = [
    SMALL_CARD_TYPES.ANALYTICS_DAILY_MONDAY,
    SMALL_CARD_TYPES.ANALYTICS_DAILY_TUESDAY,
    SMALL_CARD_TYPES.ANALYTICS_DAILY_WEDNESDAY,
    SMALL_CARD_TYPES.ANALYTICS_DAILY_THURSDAY,
    SMALL_CARD_TYPES.ANALYTICS_DAILY_FRIDAY,
  ];

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
