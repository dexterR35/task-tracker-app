import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { CARD_SYSTEM } from "@/constants";


// Color mapping for different card types with better colors
export const getCardColor = (cardType, data = {}) => {
  switch (cardType) {


    case "actions":
      return "pink";

    case "user-filter":
      return "pink";

    case "reporter-filter":
      return "pink";

    case "month-selection":
      return "pink";

      case "user-profile":
        return "pink";

    default:
      return CARD_SYSTEM.COLORS.DEFAULT;
  }
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
    getValue: (data) => data.users?.length || 0,
    getStatus: (data) => (data.selectedUserId ? "Filtered" : "All Users"),
    getContent: (data) => (
      <div className="mb-6">
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
      {
        icon: Icons.buttons.filter,
        label: "Filter Status",
        value: data.selectedUserId ? "Active" : "Inactive",
      },
    ],
  },

  [SMALL_CARD_TYPES.REPORTER_FILTER]: {
    title: "Reporter Filter",
    subtitle: "View All",
    description: "Reporters",
    icon: Icons.admin.reporters,
    color: (data) => getCardColor("reporter-filter", data),
    getValue: (data) => data.reporters?.length || 0,
    getStatus: (data) =>
      data.selectedReporterId ? "Filtered" : "All Reporters",
    getContent: (data) => (
      <div className="mb-6">
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
      {
        icon: Icons.buttons.filter,
        label: "Filter Status",
        value: data.selectedReporterId ? "Active" : "Inactive",
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_PROFILE]: {
    title: "User Profile",
    subtitle: "View All",
    description: "Tasks",
    icon: Icons.generic.user,
    color: (data) => getCardColor("user-profile", data),
    getValue: (data) => {
      if (!data.tasks) return "0";

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

      // Show filter status
      details.push({
        label: "Filter Status",
        value:
          data.selectedUserId || data.selectedReporterId
            ? "Filtered"
            : "All Tasks",
      });

      return details;
    },
    getContent: (data) => (
      <div className="mb-6">
        <DynamicButton
          onClick={() => {
            // Navigate to coming soon page
            if (data.navigate) {
              data.navigate("/coming-soon");
            } else {
              // Fallback: use history API for client-side navigation
              window.history.pushState({}, "", "/coming-soon");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
          }}
          iconName="view"
          className="w-full transition-colors uppercase bg-blue-600 hover:bg-blue-700 text-white"
        >
          {(() => {
            // Determine button text based on context
            if (data.selectedUserId && data.currentUser?.role === "admin") {
              const selectedUser = data.users?.find(
                (u) => u.userUID === data.selectedUserId
              );
              return selectedUser
                ? `VIEW ${selectedUser.name?.toUpperCase() || selectedUser.email?.toUpperCase() || "USER"} DATA`
                : "VIEW USER DATA";
            }
            return "VIEW MY DATA";
          })()}
        </DynamicButton>
      </div>
    ),
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Actions",
    subtitle: "View All",
    description: "------",
    icon: Icons.buttons.add,
    color: (data) => getCardColor("actions", data),
    getValue: (data) => (data.canCreateTasks ? "1" : "0"),
    getStatus: (data) => (data.canCreateTasks ? "Active" : "Disabled"),
    getContent: (data) => (
      <div className="mb-6">
        <DynamicButton
          onClick={data.handleCreateTask}
          disabled={!data.canCreateTasks}
          iconName="add"
          className={`w-full transition-colors uppercase ${
            data.canCreateTasks
              ? "bg-btn-primary "
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          {data.canCreateTasks ? "ADD TASK" : "CREATE DISABLED"}
        </DynamicButton>
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.clock,
        label: "Permission",
        value: data.canCreateTasks ? "Granted" : "Restricted",
      },
      {
        icon: Icons.buttons.add,
        label: "Create Status",
        value: data.canCreateTasks ? "Enabled" : "Disabled",
      },
      // {
      //   icon: Icons.generic.task,
      //   label: "Action Type",
      //   value: "Task Creation",
      // },
      
    ],
  },
};

// Create small cards with data
export const createSmallCards = (data) => {
  const cardTypes = [
    SMALL_CARD_TYPES.MONTH_SELECTION,
    // Show filters based on user role
    ...(data.isUserAdmin
      ? [SMALL_CARD_TYPES.USER_FILTER, SMALL_CARD_TYPES.REPORTER_FILTER] // Admin sees all filters
      : [SMALL_CARD_TYPES.REPORTER_FILTER]), // Regular users see only reporter filter
    SMALL_CARD_TYPES.ACTIONS,
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
