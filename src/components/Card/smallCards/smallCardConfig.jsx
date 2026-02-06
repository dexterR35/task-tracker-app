import { Icons } from "@/components/icons";
import { CARD_SYSTEM, ROUTES } from "@/constants";
import { logger } from "@/utils/logger";

// Small Card Types
export const SMALL_CARD_TYPES = CARD_SYSTEM.SMALL_CARD_TYPES;

// Small Card Configuration Templates
export const SMALL_CARD_CONFIGS = {
  [SMALL_CARD_TYPES.MONTH_SELECTION]: {
    title: "Month Period",
    subtitle: "View All",
    description: "Months",
    icon: Icons.generic.clock,
    color: "soft_orange",
    getValue: (data) => data.availableMonths?.length || 0,
    getStatus: (data) => (data.isCurrentMonth ? "Current" : "History"),
    getBadge: (data) => ({
      text: data.isCurrentMonth ? "Current" : "History",
      color: "soft_orange",
    }),
    getContent: () => null,
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
    color: "soft_orange",
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
      color: "soft_orange",
    }),
    getContent: () => null,
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
    color: "soft_orange",
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
      color: "soft_orange",
    }),
    getContent: () => null,
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
      return data.tasks.length.toString();
    },
    getStatus: (data) => (data.currentUser?.role || "user").toLowerCase(),
    getDetails: (data) => {
      const details = [];
      details.push({
        label: "Current User",
        value: data.currentUser?.name || data.currentUser?.email || "N/A",
      });

      return details;
    },
  },

  [SMALL_CARD_TYPES.ACTIONS]: (() => {
    const filterTasksBySelectedMonth = (tasks, data) => {
      if (!tasks || !Array.isArray(tasks)) return [];
      const monthId = data.selectedMonth?.monthId || data.currentMonth?.monthId;
      return monthId ? tasks.filter((t) => t.monthId === monthId) : tasks;
    };
    return {
      title: "Task Statistics",
      subtitle: "View All",
      description: "Total Tasks",
      icon: Icons.buttons.add,
      color: "soft_orange",
      getBadge: () => null,
      getValue: (data) => {
        const filtered = filterTasksBySelectedMonth(data.tasks, data);
        return filtered.length.toString();
      },
      getStatus: (data) => (data.canCreateTasks ? "Active" : "Disabled"),
      getContent: () => null,
      getDetails: (data) => {
        const filteredTasks = filterTasksBySelectedMonth(data.tasks, data);
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
    };
  })(),

  [SMALL_CARD_TYPES.PERFORMANCE]: {
    title: "Performance",
    subtitle: "This period",
    description: "Dummy data",
    icon: Icons.generic.chart,
    color: "green",
    getBadge: () => ({ text: "On track", color: "green" }),
    getValue: () => "87%",
    getStatus: () => "Above target",
    getDetails: () => [
      { icon: Icons.generic.target, label: "Target", value: "80%" },
      { icon: Icons.generic.star, label: "Score", value: "4.2/5" },
      { icon: Icons.generic.clock, label: "Avg completion", value: "2.3 days" },
    ],
  },

  [SMALL_CARD_TYPES.EFFICIENCY]: {
    title: "Efficiency",
    subtitle: "This period",
    description: "Dummy data",
    icon: Icons.generic.zap,
    color: "amber",
    getBadge: () => ({ text: "Good", color: "amber" }),
    getValue: () => "94%",
    getStatus: () => "On-time delivery",
    getDetails: () => [
      { icon: Icons.generic.clock, label: "On-time", value: "94%" },
      { icon: Icons.generic.check, label: "Quality", value: "4.6/5" },
      { icon: Icons.generic.users, label: "Satisfaction", value: "4.6/5" },
    ],
  },

  [SMALL_CARD_TYPES.FOOD_ORDER_BOARD]: {
    title: "Order board",
    subtitle: "View",
    description: "Dashboard = order board (month selector)",
    icon: Icons.generic.calendar,
    color: "blue",
    getValue: (data) => (data.boards?.length ?? 0).toString(),
    getStatus: () => "Open",
    getDetails: (data) => [
      { label: "Boards", value: `${data.boards?.length ?? 0} available` },
    ],
    getHref: () => ROUTES.FOOD_DASHBOARD,
  },

  [SMALL_CARD_TYPES.FOOD_ORDERS]: {
    title: "Orders",
    subtitle: "View",
    description: "View and manage orders",
    icon: Icons.buttons.add,
    color: "green",
    getValue: (data) => (data.ordersCount ?? data.orders?.length ?? 0).toString(),
    getStatus: () => "Manage",
    getDetails: () => [{ label: "Section", value: "Orders" }],
    getHref: () => ROUTES.FOOD_ORDERS,
  },

  [SMALL_CARD_TYPES.FOOD_HISTORY]: {
    title: "History",
    subtitle: "View",
    description: "Past orders by period",
    icon: Icons.generic.clock,
    color: "soft_orange",
    getValue: () => "Open",
    getStatus: () => "Past orders",
    getDetails: () => [{ label: "Section", value: "History" }],
    getHref: () => ROUTES.FOOD_HISTORY,
  },

  // Design Department Cards
  [SMALL_CARD_TYPES.TOTAL_TASKS]: {
    title: "Total Tasks",
    subtitle: "This month",
    description: "All tasks",
    icon: Icons.generic.task,
    color: "blue",
    getValue: (data) => (data.tasks?.length ?? 0).toString(),
    getStatus: () => "Current month",
    getDetails: (data) => [
      { label: "Total", value: `${data.tasks?.length ?? 0} tasks` },
    ],
  },

  [SMALL_CARD_TYPES.COMPLETED_TASKS]: {
    title: "Completed Tasks",
    subtitle: "This month",
    description: "Tasks completed",
    icon: Icons.generic.check,
    color: "green",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      return tasks.filter((t) => t.status === "completed" || t.status === "done").length.toString();
    },
    getStatus: () => "Done",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const completed = tasks.filter((t) => t.status === "completed" || t.status === "done");
      return [
        { label: "Completed", value: `${completed.length} tasks` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },

  [SMALL_CARD_TYPES.PENDING_TASKS]: {
    title: "Pending Tasks",
    subtitle: "This month",
    description: "Tasks pending",
    icon: Icons.generic.clock,
    color: "amber",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      return tasks.filter((t) => t.status === "todo" || t.status === "in-progress").length.toString();
    },
    getStatus: () => "Pending",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const pending = tasks.filter((t) => t.status === "todo" || t.status === "in-progress");
      return [
        { label: "Pending", value: `${pending.length} tasks` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },

  [SMALL_CARD_TYPES.ACTIVE_REPORTERS]: {
    title: "Active Reporters",
    subtitle: "This month",
    description: "Reporters assigned",
    icon: Icons.admin.reporters,
    color: "purple",
    getValue: (data) => {
      // Placeholder - would need to count unique reporters from tasks
      const reporterCount = data.reporterCount ?? data.reporters?.length ?? 0;
      return reporterCount.toString();
    },
    getStatus: () => "Active",
    getDetails: (data) => [
      { label: "Reporters", value: `${data.reporterCount ?? data.reporters?.length ?? 0} active` },
    ],
  },

  [SMALL_CARD_TYPES.DELIVERABLES]: {
    title: "Deliverables",
    subtitle: "This month",
    description: "Deliverables linked",
    icon: Icons.generic.deliverable,
    color: "soft_purple",
    getValue: (data) => {
      // Placeholder - would need to count deliverables from tasks
      const deliverableCount = data.deliverableCount ?? data.deliverables?.length ?? 0;
      return deliverableCount.toString();
    },
    getStatus: () => "Linked",
    getDetails: (data) => [
      { label: "Deliverables", value: `${data.deliverableCount ?? data.deliverables?.length ?? 0} linked` },
    ],
  },

  // Food Department Cards
  [SMALL_CARD_TYPES.TOTAL_ORDERS]: {
    title: "Total Orders",
    subtitle: "This month",
    description: "All orders",
    icon: Icons.generic.calendar,
    color: "blue",
    getValue: (data) => (data.orders?.length ?? data.ordersCount ?? 0).toString(),
    getStatus: () => "Current month",
    getDetails: (data) => [
      { label: "Total", value: `${data.orders?.length ?? data.ordersCount ?? 0} orders` },
    ],
  },

  [SMALL_CARD_TYPES.PENDING_ORDERS]: {
    title: "Pending Orders",
    subtitle: "This month",
    description: "Orders pending",
    icon: Icons.generic.clock,
    color: "amber",
    getValue: (data) => {
      const orders = data.orders ?? [];
      return orders.filter((o) => o.status === "pending").length.toString();
    },
    getStatus: () => "Pending",
    getDetails: (data) => {
      const orders = data.orders ?? [];
      const pending = orders.filter((o) => o.status === "pending");
      return [
        { label: "Pending", value: `${pending.length} orders` },
        { label: "Total", value: `${orders.length} orders` },
      ];
    },
  },

  [SMALL_CARD_TYPES.COMPLETED_ORDERS]: {
    title: "Completed Orders",
    subtitle: "This month",
    description: "Orders completed",
    icon: Icons.generic.check,
    color: "green",
    getValue: (data) => {
      const orders = data.orders ?? [];
      return orders.filter((o) => o.status === "completed" || o.status === "delivered").length.toString();
    },
    getStatus: () => "Completed",
    getDetails: (data) => {
      const orders = data.orders ?? [];
      const completed = orders.filter((o) => o.status === "completed" || o.status === "delivered");
      return [
        { label: "Completed", value: `${completed.length} orders` },
        { label: "Total", value: `${orders.length} orders` },
      ];
    },
  },

  [SMALL_CARD_TYPES.MY_ORDERS]: {
    title: "My Orders",
    subtitle: "This month",
    description: "Your orders",
    icon: Icons.generic.user,
    color: "pink",
    getValue: (data) => {
      const orders = data.orders ?? [];
      const currentUserId = data.currentUser?.id;
      if (!currentUserId) return "0";
      return orders.filter((o) => o.userId === currentUserId || o.user_id === currentUserId).length.toString();
    },
    getStatus: () => "Your orders",
    getDetails: (data) => {
      const orders = data.orders ?? [];
      const currentUserId = data.currentUser?.id;
      const myOrders = currentUserId
        ? orders.filter((o) => o.userId === currentUserId || o.user_id === currentUserId)
        : [];
      return [
        { label: "Your orders", value: `${myOrders.length} orders` },
        { label: "Total", value: `${orders.length} orders` },
      ];
    },
  },

  // Customer Support Cards (similar to Design but with different labels)
  [SMALL_CARD_TYPES.OPEN_TICKETS]: {
    title: "Open Tickets",
    subtitle: "All time",
    description: "Tasks with status todo",
    icon: Icons.generic.task,
    color: "red",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      return tasks.filter((t) => t.status === "todo").length.toString();
    },
    getStatus: () => "Open",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const open = tasks.filter((t) => t.status === "todo");
      return [
        { label: "Open", value: `${open.length} tickets` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },

  [SMALL_CARD_TYPES.RESOLVED]: {
    title: "Resolved",
    subtitle: "All time",
    description: "Tasks completed",
    icon: Icons.generic.check,
    color: "green",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      return tasks.filter((t) => t.status === "completed" || t.status === "done").length.toString();
    },
    getStatus: () => "Resolved",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const resolved = tasks.filter((t) => t.status === "completed" || t.status === "done");
      return [
        { label: "Resolved", value: `${resolved.length} tickets` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },

  [SMALL_CARD_TYPES.IN_PROGRESS]: {
    title: "In Progress",
    subtitle: "All time",
    description: "Tasks in progress",
    icon: Icons.generic.clock,
    color: "amber",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      return tasks.filter((t) => t.status === "in-progress").length.toString();
    },
    getStatus: () => "In progress",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const inProgress = tasks.filter((t) => t.status === "in-progress");
      return [
        { label: "In progress", value: `${inProgress.length} tickets` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },

  [SMALL_CARD_TYPES.ASSIGNED_TO_ME]: {
    title: "Assigned to Me",
    subtitle: "All time",
    description: "Your tasks",
    icon: Icons.generic.user,
    color: "pink",
    getValue: (data) => {
      const tasks = data.tasks ?? [];
      const currentUserId = data.currentUser?.id;
      if (!currentUserId) return "0";
      return tasks.filter((t) => t.assigneeId === currentUserId || t.assignee_id === currentUserId).length.toString();
    },
    getStatus: () => "Your tasks",
    getDetails: (data) => {
      const tasks = data.tasks ?? [];
      const currentUserId = data.currentUser?.id;
      const myTasks = currentUserId
        ? tasks.filter((t) => t.assigneeId === currentUserId || t.assignee_id === currentUserId)
        : [];
      return [
        { label: "Your tasks", value: `${myTasks.length} tasks` },
        { label: "Total", value: `${tasks.length} tasks` },
      ];
    },
  },
};

/** Resolve config field: function(data) or static value. */
const getConfigValue = (config, key, data) => {
  const value = config[key];
  return typeof value === "function" ? value(data) : value;
};

/**
 * One SmallCard component; different data per department.
 * createCards(data, mode): mode "main" = Design (tasks, users, efficiency), mode "food" = Food (orders, boards, history).
 */
export const createCards = (data, mode = "main") => {
  let cardTypes = [];
  if (Array.isArray(mode)) {
    cardTypes = mode;
  } else {
    switch (mode) {
      case "main":
        // Design Department Cards (per architecture doc)
        cardTypes = [
          SMALL_CARD_TYPES.TOTAL_TASKS,
          SMALL_CARD_TYPES.COMPLETED_TASKS,
          SMALL_CARD_TYPES.PENDING_TASKS,
          SMALL_CARD_TYPES.ACTIVE_REPORTERS,
          SMALL_CARD_TYPES.DELIVERABLES,
        ];
        break;
      case "food":
        // Food Department Cards (per architecture doc)
        cardTypes = [
          SMALL_CARD_TYPES.TOTAL_ORDERS,
          SMALL_CARD_TYPES.PENDING_ORDERS,
          SMALL_CARD_TYPES.COMPLETED_ORDERS,
          SMALL_CARD_TYPES.MY_ORDERS,
          SMALL_CARD_TYPES.FOOD_HISTORY,
        ];
        break;
      case "customer-support":
        // Customer Support Cards (per architecture doc)
        cardTypes = [
          SMALL_CARD_TYPES.TOTAL_TASKS,
          SMALL_CARD_TYPES.OPEN_TICKETS,
          SMALL_CARD_TYPES.RESOLVED,
          SMALL_CARD_TYPES.IN_PROGRESS,
          SMALL_CARD_TYPES.ASSIGNED_TO_ME,
        ];
        break;
      default:
        cardTypes = [];
    }
  }
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

  return cardTypes
    .map((cardType) => {
      const config = SMALL_CARD_CONFIGS[cardType];
      if (!config) return null;
      try {
        return {
          id: `${cardType}-card`,
          title: getConfigValue(config, "title", data),
          subtitle: getConfigValue(config, "subtitle", data),
          description: getConfigValue(config, "description", data),
          icon: config.icon,
          color: getConfigValue(config, "color", data),
          value: config.getValue ? config.getValue(data) : "",
          status: config.getStatus ? config.getStatus(data) : "",
          badge: config.getBadge ? config.getBadge(data) : null,
          content: config.getContent ? config.getContent(data) : null,
          details: config.getDetails ? config.getDetails(data) : [],
          href: config.getHref ? config.getHref(data) : null,
        };
      } catch (err) {
        if (isDev) {
          logger.warn("[createCards] Failed to build card:", cardType, err);
        }
        return null;
      }
    })
    .filter((card) => card !== null);
};
