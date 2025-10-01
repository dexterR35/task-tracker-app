import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { getCardColor, getBadgeColor } from "./cardColors";

// Small Card Types
export const SMALL_CARD_TYPES = {
  MONTH_SELECTION: "month-selection",
  USER_FILTER: "user-filter",
  REPORTER_FILTER: "reporter-filter",
  USER_PROFILE: "user-profile",
  ACTIONS: "actions",
};

// Small Card Configuration Templates
export const SMALL_CARD_CONFIGS = {
  [SMALL_CARD_TYPES.MONTH_SELECTION]: {
    title: "Month Period",
    subtitle: (data) => data.currentMonth?.monthName || data.selectedMonth?.monthName || "No month",
    description: "Months",
    icon: Icons.generic.clock,
    color: (data) => getCardColor('month-selection', data),
    getValue: (data) => data.availableMonths?.length || 0,
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "History"),
    getContent: (data) => (
      <div className="mb-6">
        <select
          id="selectedMonth"
          value={
            data.selectedMonth?.monthId || data.currentMonth?.monthId || ""
          }
          onChange={(e) => data.selectMonth?.(e.target.value)}
          className="w-full px-3 py-2 text-sm capitalize"
        >
          {data.availableMonths?.length > 0 ? (
            data.availableMonths.map((month) => (
              <option key={month.monthId} value={month.monthId}>
                {month.monthName} {month.isCurrent ? "(Current)" : ""}
              </option>
            ))
          ) : (
            <option value="">No months available</option>
          )}
        </select>
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.clock,
        label: "Current",
        value: data.isCurrentMonth ? "Yes" : "No",
      },
      {
        icon: Icons.generic.clock,
        label: "Status",
        value: data.isCurrentMonth ? "Current" : "Historical",
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_FILTER]: {
    title: "User Filter",
    subtitle: (data) => `${data.users?.length || 0} users`,
    description: "Users",
    icon: Icons.generic.user,
    color: (data) => getCardColor('user-filter', data),
    getValue: (data) => data.users?.length || 0,
    getStatus: (data) => (data.selectedUserId ? "Filtered" : "All Users"),
    getContent: (data) => (
      <div className="mb-6">
        <select
          id="selectedUser"
          value={data.selectedUserId || ""}
          onChange={(e) => data.handleUserSelect?.(e.target.value)}
          className="w-full py-2 px-3"
        >
          <option value="">All Users</option>
          {data.users?.map((user) => (
            <option
              key={user.userUID || user.id}
              value={user.userUID || user.id}
            >
              {user.name || user.email}
            </option>
          ))}
        </select>
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.user,
        label: "Selected",
        value: data.selectedUserId ? data.selectedUserName : "All Users",
      },
      {
        icon: Icons.buttons.filter,
        label: "Status",
        value: data.selectedUserId ? "Filtered" : "All Users",
      },
    ],
  },

  [SMALL_CARD_TYPES.REPORTER_FILTER]: {
    title: "Reporter Filter",
    subtitle: (data) => `${data.reporters?.length || 0} reporters`,
    description: "Reporters",
    icon: Icons.admin.reporters,
    color: (data) => getCardColor('reporter-filter', data),
    getValue: (data) => data.reporters?.length || 0,
    getStatus: (data) =>
      data.selectedReporterId ? "Filtered" : "All Reporters",
    getContent: (data) => (
      <div className="mb-6">
        <select
          id="selectedReporter"
          value={data.selectedReporterId || ""}
          onChange={(e) => data.handleReporterSelect?.(e.target.value)}
          className="w-full px-3 py-2 text-sm"
        >
          <option value="">All Reporters</option>
          {data.reporters?.map((reporter) => (
            <option
              key={reporter.id || reporter.uid}
              value={reporter.id || reporter.uid}
            >
              {reporter.name || reporter.reporterName}
            </option>
          ))}
        </select>
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
        icon: Icons.buttons.filter,
        label: "Status",
        value: data.selectedReporterId ? "Filtered" : "All Reporters",
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_PROFILE]: {
    title: "User Profile",
    subtitle: "NetBet",
    description:"Tasks",
    icon: Icons.generic.user,
    color: (data) => getCardColor('user-profile', data),
    getValue: (data) => {
      // Calculate total tasks for current user + reporter if selected
      const userUID = data.currentUser?.uid || data.currentUser?.userUID;
      const selectedReporterId = data.selectedReporterId;
      
      if (!data.tasks) return "0";
      
      const userTasks = data.tasks.filter(task => {
        // User's own tasks
        const isUserTask = userUID && (task.userUID === userUID || task.createbyUID === userUID);
        
        // Reporter tasks if reporter is selected
        const isReporterTask = selectedReporterId && (
          task.reporters === selectedReporterId || 
          task.data_task?.reporters === selectedReporterId
        );
        
        return isUserTask || isReporterTask;
      });
      
      return userTasks.length.toString();
    },
    getStatus: (data) => (data.currentUser?.role || "user").toUpperCase(),
    getDetails: (data) => [
      {
        label: "Name",
        value: data.currentUser?.name || "N/A",
      },
      {
        label: "Email",
        value: data.currentUser?.email || "N/A",
      },
      {
        label: "Current Board",
        value: data.selectedMonth?.monthName || data.currentMonth?.monthName || "No board",
      },
      {
        label: "Department", 
        value: data.currentUser?.occupation || "N/A",
      },
      {
        label: "Permissions",
        value: `${data.currentUser?.permissions?.length || 0} granted`,
      },
    ],
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Actions",
    subtitle: (data) =>
      data.canCreateTasks ? "Create available" : "Create restricted",
    description: "Actions",
    icon: Icons.buttons.add,
    color: (data) => getCardColor('actions', data),
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
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          {data.canCreateTasks ? "Add Task" : "Create Disabled"}
        </DynamicButton>
      </div>
    ),
    getDetails: (data) => [
      {
        icon: Icons.generic.task,
        label: "Status",
        value: data.canCreateTasks ? "Active" : "Disabled",
      },
      {
        icon: Icons.generic.clock,
        label: "Permission",
        value: data.canCreateTasks ? "Granted" : "Restricted",
      },
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
