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
    subtitle: "View All",
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
        icon: Icons.generic.calendar,
        label: "Available",
        value: `${data.availableMonths?.length || 0} months`,
      },
      {
        icon: Icons.generic.clock,
        label: "Period",
        value: data.selectedMonth?.monthName || data.currentMonth?.monthName || "None",
      },
    ],
  },

  [SMALL_CARD_TYPES.USER_FILTER]: {
    title: "User Filter",
    subtitle: "View All",
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
        label: "Department", 
        value: data.currentUser?.occupation || "N/A",
      },
    ],
    getContent: (data) => (
      <div className="mb-6">
        <DynamicButton
          onClick={() => {
            // Use React Router navigation to prevent page refresh
            if (data.navigate) {
              data.navigate('/view-my-data');
            } else {
              // Fallback: use history API for client-side navigation
              window.history.pushState({}, '', '/view-my-data');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          iconName="user"
          className="w-full transition-colors uppercase bg-blue-600 hover:bg-blue-700 text-white"
        >
          View My Data
        </DynamicButton>
      </div>
    ),
  },

  [SMALL_CARD_TYPES.ACTIONS]: {
    title: "Actions",
    subtitle: "View All",
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
        icon: Icons.generic.clock,
        label: "Permission",
        value: data.canCreateTasks ? "Granted" : "Restricted",
      },
      {
        icon: Icons.buttons.add,
        label: "Create Status",
        value: data.canCreateTasks ? "Enabled" : "Disabled",
      },
      {
        icon: Icons.generic.task,
        label: "Action Type",
        value: "Task Creation",
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
