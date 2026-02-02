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
        cardTypes = [
          SMALL_CARD_TYPES.USER_PROFILE,
          SMALL_CARD_TYPES.ACTIONS,
          SMALL_CARD_TYPES.USER_FILTER,
          SMALL_CARD_TYPES.PERFORMANCE,
          SMALL_CARD_TYPES.EFFICIENCY,
        ];
        break;
      case "food":
        cardTypes = [
          SMALL_CARD_TYPES.USER_PROFILE,
          SMALL_CARD_TYPES.FOOD_ORDER_BOARD,
          SMALL_CARD_TYPES.FOOD_ORDERS,
          SMALL_CARD_TYPES.FOOD_HISTORY,
          SMALL_CARD_TYPES.PERFORMANCE,
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
