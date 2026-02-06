/**
 * Single dashboard page for all departments. Same layout: overview cards + board (tabs + table).
 * Variant "design" = task board + task cards; variant "food" = order board + order cards.
 */
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { useDispatch } from "react-redux";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
import { getSocket } from "@/app/api";
import {
  useGetTaskBoardsQuery,
  useGetTasksQuery,
  useGetOrderBoardsQuery,
  useGetOrdersQuery,
  api,
} from "@/store/api";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import AppLoader from "@/components/ui/AppLoader";
import Loader from "@/components/ui/Loader/Loader";
import SlidePanel from "@/components/ui/SlidePanel/SlidePanel";
import SectionHeader from "@/components/ui/SectionHeader";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import TanStackTable from "@/components/Table/TanStackTable";
import DynamicDepartmentForm, { getDepartmentFormConfig } from "@/components/forms/DynamicDepartmentForm";
import { DEPARTMENT_FORM_DEPARTMENT } from "@/components/forms/configs/formConstants";
import { showError, showSuccess } from "@/utils/toast";
import MonthProgressBanner from "@/components/ui/MonthProgressBanner";

const columnHelper = createColumnHelper();
const BOARD_TAB_ACTIVE =
  "px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white";
const BOARD_TAB_INACTIVE =
  "px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-app hover:bg-gray-200 dark:hover:bg-gray-600";

function toTanStackColumns(columns) {
  return columns.map((col) =>
    columnHelper.accessor(col.key, {
      header: col.header,
      cell: ({ row }) => col.render(row.original),
    })
  );
}

// Helper function to create task columns with user lookup
const createTaskColumns = (users = []) => {
  const getUserName = (userId) => {
    if (!userId) return "–";
    const user = users.find((u) => u.id === userId);
    return user?.name || user?.username || user?.email || "–";
  };

  return [
    { key: "title", header: "Title", render: (t) => t.title ?? "–" },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-app">
          {t.status ?? "todo"}
        </span>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (t) => getUserName(t.assigneeId || t.assignee_id),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (t) => {
        const date = t.dueDate || t.due_date;
        return date ? new Date(date).toLocaleDateString() : "–";
      },
    },
    {
      key: "reporters",
      header: "Reporters",
      render: (t) => {
        // Placeholder - reporters would come from task_reporters junction table
        // For now, return placeholder or count if available
        const count = t.reporters?.length || t.reporterCount || 0;
        return count > 0 ? `${count} reporter${count !== 1 ? "s" : ""}` : "–";
      },
    },
    {
      key: "deliverables",
      header: "Deliverables",
      render: (t) => {
        // Placeholder - deliverables would come from task_deliverables junction table
        const count = t.deliverables?.length || t.deliverableCount || 0;
        return count > 0 ? `${count} deliverable${count !== 1 ? "s" : ""}` : "–";
      },
    },
  ];
};

// Helper function to create order columns
const createOrderColumns = (users = []) => {
  const getUserName = (userId) => {
    if (!userId) return "–";
    const user = users.find((u) => u.id === userId);
    return user?.name || user?.username || user?.email || "–";
  };

  return [
    {
      key: "orderDate",
      header: "Date",
      render: (o) => {
        const date = o.orderDate || o.order_date;
        return date ? new Date(date).toLocaleDateString() : "–";
      },
    },
    { key: "summary", header: "Summary", render: (o) => o.summary ?? "–" },
    {
      key: "items",
      header: "Items",
      render: (o) => {
        const items = o.items;
        if (!items) return "–";
        if (Array.isArray(items)) {
          return items.length > 0 ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "–";
        }
        if (typeof items === "string") {
          try {
            const parsed = JSON.parse(items);
            return Array.isArray(parsed) ? `${parsed.length} item${parsed.length !== 1 ? "s" : ""}` : "–";
          } catch {
            return items;
          }
        }
        return "–";
      },
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-app">
          {o.status ?? "pending"}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (o) => getUserName(o.userId || o.user_id),
    },
  ];
};

/** Hardcoded board for current month when API returns none. */
function getHardcodedBoardForMonth(year, month) {
  return {
    id: `demo-${year}-${String(month).padStart(2, "0")}`,
    year,
    month,
    name: "Demo",
  };
}

/** Hardcoded tasks for demo board (this month). */
const HARDCODED_TASKS = [
  { id: "demo-task-1", title: "Review design mockups", status: "in-progress", dueDate: new Date().toISOString().slice(0, 10) },
  { id: "demo-task-2", title: "Update component library", status: "todo", dueDate: null },
  { id: "demo-task-3", title: "Fix responsive layout", status: "done", dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
];

/** Hardcoded orders for demo board (this month). */
const HARDCODED_ORDERS = [
  { id: "demo-order-1", orderDate: new Date().toISOString().slice(0, 10), summary: "Team lunch – 4 people", status: "pending" },
  { id: "demo-order-2", orderDate: new Date().toISOString().slice(0, 10), summary: "Coffee & pastries", status: "delivered" },
];

const DASHBOARD_CONFIG = {
  design: {
    createColumns: createTaskColumns, // Function to create columns with user context
    boardTitle: "Task board",
    emptyBoardsMessage: "No task board for this month. Create one via API or add a Get or create board action.",
    emptyItemsMessage: "No tasks yet for this board.",
    loadingMessage: "Loading tasks…",
    addButtonLabel: "Add a task",
    socketEvent: "task:updated",
    getItems: (data) => data.tasks ?? [],
    formDepartmentKey: DEPARTMENT_FORM_DEPARTMENT.DESIGN,
    formKey: "addTask",
    cardMode: "main",
  },
  food: {
    createColumns: createOrderColumns, // Function to create columns with user context
    boardTitle: "Order board",
    emptyBoardsMessage: "No order board for this month. Create one via API or add a Get or create board action.",
    emptyItemsMessage: "No orders yet for this board.",
    loadingMessage: "Loading orders…",
    addButtonLabel: "Send food",
    socketEvent: "order:updated",
    getItems: (data) => data.orders ?? [],
    formDepartmentKey: DEPARTMENT_FORM_DEPARTMENT.FOOD,
    formKey: "addOrder",
    cardMode: "food",
  },
};

const CARD_CACHE_MAX_SIZE = 50;

export default function DashboardPage({ variant = "design" }) {
  const dispatch = useDispatch();
  const config = useMemo(
    () => DASHBOARD_CONFIG[variant] ?? DASHBOARD_CONFIG.design,
    [variant]
  );
  const { canAccess, user } = useAuth();
  const { viewingDepartmentId } = useSelectedDepartment();
  const isUserAdmin = canAccess("admin");
  const appData = useAppDataContext();

  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const users = useMemo(
    () =>
      appData?.users && viewingDepartmentId
        ? appData.users.filter((u) => u.departmentId === viewingDepartmentId)
        : appData?.users ?? [],
    [appData?.users, viewingDepartmentId]
  );

  // RTK Query hooks for boards (conditional based on variant)
  const {
    data: taskBoardsData,
    isLoading: taskBoardsLoading,
    error: taskBoardsError,
  } = useGetTaskBoardsQuery(
    { year, month },
    { skip: variant !== 'design' || !user?.departmentId }
  );

  const {
    data: orderBoardsData,
    isLoading: orderBoardsLoading,
    error: orderBoardsError,
  } = useGetOrderBoardsQuery(
    { year, month },
    { skip: variant !== 'food' || !user?.departmentId }
  );

  // Determine which boards data to use
  const boardsData = variant === 'food' ? orderBoardsData : taskBoardsData;
  const boardsLoading = variant === 'food' ? orderBoardsLoading : taskBoardsLoading;
  const boardsError = variant === 'food' ? orderBoardsError : taskBoardsError;

  // Process boards and set selected board
  const boards = useMemo(() => {
    if (boardsLoading || !user?.departmentId) return [];
    const list = boardsData?.boards ?? [];
    if (list.length === 0) {
      const demoBoard = getHardcodedBoardForMonth(year, month);
      return [demoBoard];
    }
    return list;
  }, [boardsData, boardsLoading, user?.departmentId, year, month]);

  // Set selected board when boards change
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0]?.id ?? null);
    }
  }, [boards, selectedBoardId]);

  // RTK Query hooks for items (conditional based on variant and selectedBoardId)
  const demoBoardId = getHardcodedBoardForMonth(year, month).id;
  const isDemoBoard = selectedBoardId === demoBoardId;

  const {
    data: tasksData,
    isLoading: tasksLoading,
  } = useGetTasksQuery(
    selectedBoardId ?? '',
    { skip: variant !== 'design' || !selectedBoardId || isDemoBoard }
  );

  const {
    data: ordersData,
    isLoading: ordersLoading,
  } = useGetOrdersQuery(
    selectedBoardId ?? '',
    { skip: variant !== 'food' || !selectedBoardId || isDemoBoard }
  );

  // Determine which items data to use
  const itemsData = variant === 'food' ? ordersData : tasksData;
  const itemsLoading = variant === 'food' ? ordersLoading : tasksLoading;

  // Process items
  const items = useMemo(() => {
    if (isDemoBoard) {
      return variant === "food" ? HARDCODED_ORDERS : HARDCODED_TASKS;
    }
    if (!selectedBoardId || itemsLoading) return [];
    return config.getItems(itemsData ?? {});
  }, [isDemoBoard, variant, selectedBoardId, itemsLoading, itemsData, config]);

  // Real-time: invalidate cache on socket event
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedBoardId) return;
    const handler = ({ boardId }) => {
      if (boardId !== selectedBoardId) return;
      // Invalidate the relevant cache to trigger refetch
      if (variant === 'food') {
        dispatch(api.util.invalidateTags([{ type: 'Orders', id: boardId }, 'Orders']));
      } else {
        dispatch(api.util.invalidateTags([{ type: 'Tasks', id: boardId }, 'Tasks']));
      }
    };
    socket.on(config.socketEvent, handler);
    return () => socket.off(config.socketEvent, handler);
  }, [dispatch, config, selectedBoardId, variant]);

  const efficiencyData = {
    averageTaskCompletion: 2.3,
    productivityScore: 87,
    qualityRating: 4.2,
    onTimeDelivery: 94,
    clientSatisfaction: 4.6,
  };

  const cardCacheRef = useRef({ map: new Map(), order: [] });

  const smallCards = useMemo(() => {
    if (variant === "food") {
      return createCards(
        {
          currentUser: user,
          tasks: [],
          boards,
          orders: items,
          ordersCount: items.length,
        },
        "food"
      );
    }
    const newCards = createCards(
      {
        tasks: items,
        users,
        periodName: "Dashboard",
        periodId: "dashboard",
        isUserAdmin,
        currentUser: user,
        efficiency: efficiencyData,
        actionsTotalTasks: items.length,
        actionsTotalHours: 0,
        actionsTotalDeliverables: 0,
        actionsTotalDeliverablesWithVariationsHours: 0,
      },
      "main"
    );
    const cache = cardCacheRef.current;
    return newCards.map((newCard) => {
      const detailsLen = Array.isArray(newCard.details) ? newCard.details.length : 0;
      const badgeText = newCard.badge?.text ?? '';
      const cacheKey = `${newCard.id}-${newCard.color}-${String(newCard.value)}-${String(newCard.title)}-${String(newCard.subtitle)}-${detailsLen}-${badgeText}`;
      const cached = cache.map.get(cacheKey);
      const hasDetails = (arr) => Array.isArray(arr) && arr.length > 0;
      const detailsMatch = hasDetails(cached?.details) && hasDetails(newCard.details)
        ? cached.details.length === newCard.details.length &&
          cached.details.every((d, i) => d?.label === newCard.details[i]?.label && d?.value === newCard.details[i]?.value)
        : !hasDetails(cached?.details) && !hasDetails(newCard.details);
      const badgeMatch = (cached?.badge?.text ?? '') === (newCard.badge?.text ?? '') &&
        (cached?.badge?.color ?? '') === (newCard.badge?.color ?? '');
      if (cached && cached.id === newCard.id && cached.color === newCard.color && cached.value === newCard.value &&
          cached.title === newCard.title && cached.subtitle === newCard.subtitle && detailsMatch && badgeMatch) {
        return cached;
      }
      if (cache.map.size >= CARD_CACHE_MAX_SIZE && !cache.map.has(cacheKey)) {
        const oldest = cache.order.shift();
        if (oldest != null) cache.map.delete(oldest);
      }
      cache.map.set(cacheKey, newCard);
      if (!cache.order.includes(cacheKey)) {
        cache.order.push(cacheKey);
      }
      return newCard;
    });
  }, [variant, user, boards, items, users, isUserAdmin]);

  // Create table columns with user context
  const tableColumns = useMemo(() => {
    const columns = config.createColumns ? config.createColumns(users) : config.columns || [];
    return toTanStackColumns(columns);
  }, [config, users]);

  // Design needs AppData initialized
  if (variant === "design") {
    if (!appData || !appData.isInitialized) {
      return <AppLoader text="Initializing application data..." />;
    }
    if (appData.error) {
      return (
        <div className="mx-auto px-4 py-6 text-center text-red-error">
          Error loading data: {appData.error?.message || "Unknown error"}
        </div>
      );
    }
  }

  const cardsLoading = variant === "design" ? appData?.isInitialLoading : boardsLoading && boards.length === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Overview and progress</p>
      </div>

      {/* Month Progress Banner */}
      <MonthProgressBanner variant={variant} />

      <section className="mb-6" aria-label="Dashboard overview">
        <SectionHeader label="Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cardsLoading
            ? Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)
            : smallCards.map((card) =>
                card.href ? (
                  <Link key={card.id} to={card.href} className="block h-full">
                    <SmallCard card={card} />
                  </Link>
                ) : (
                  <SmallCard key={card.id} card={card} />
                )
              )}
        </div>
      </section>

      {/* Board – title, tabs, table */}
      <section className="mb-6" aria-label={config.boardTitle}>
        {boardsLoading && boards.length === 0 ? (
          <>
            <SectionHeader label={config.boardTitle} />
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader size="md" text={config.loadingMessage} variant="spinner" />
            </div>
          </>
        ) : (
          <>
            <SectionHeader label={config.boardTitle}>
              <DynamicButton
                onClick={() => setAddPanelOpen(true)}
                variant="primary"
                size="sm"
                iconName="add"
                iconPosition="left"
                iconCategory="buttons"
                className="!text-xs !px-3 !py-1.5"
              >
                {config.addButtonLabel}
              </DynamicButton>
              <DynamicButton
                onClick={() => showError("Export coming soon")}
                variant="secondary"
                size="sm"
                iconName="download"
                iconPosition="left"
                iconCategory="buttons"
                className="!text-xs !px-3 !py-1.5"
              >
                Export
              </DynamicButton>
            </SectionHeader>

            {boards.length === 0 ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard p-6 text-center text-app-subtle">
                {config.emptyBoardsMessage}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard overflow-hidden">
                <div className="flex gap-2 flex-wrap p-4 pb-0">
                  {boards.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBoardId(b.id)}
                      className={
                        selectedBoardId === b.id ? BOARD_TAB_ACTIVE : BOARD_TAB_INACTIVE
                      }
                    >
                      {b.year}-{String(b.month).padStart(2, "0")}
                      {b.name ? ` – ${b.name}` : ""}
                    </button>
                  ))}
                </div>
                <div className="p-4 pt-4">
                  <TanStackTable
                    data={items}
                    columns={tableColumns}
                    isLoading={itemsLoading}
                    emptyMessage={config.emptyItemsMessage}
                    showFilters={true}
                    showColumnToggle={true}
                    showPagination={true}
                    pageSize={10}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <SlidePanel
        isOpen={addPanelOpen}
        onClose={() => setAddPanelOpen(false)}
        title={getDepartmentFormConfig(config.formDepartmentKey, config.formKey)?.title}
        width="max-w-lg"
        closeOnBackdropClick={false}
      >
        <DynamicDepartmentForm
          departmentKey={config.formDepartmentKey}
          formKey={config.formKey}
          hideTitle
          onSubmit={async () => {
            showSuccess("Form submitted. API integration coming soon.");
            setAddPanelOpen(false);
          }}
        />
      </SlidePanel>
    </div>
  );
}
