/**
 * Single dashboard page for all departments. Same layout: overview cards + board section.
 * Variant "design" = task board + task cards; variant "food" = order board + order cards.
 */
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
import {
  taskBoardsApi,
  tasksApi,
  orderBoardsApi,
  ordersApi,
  getSocket,
} from "@/app/api";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import BoardSection from "@/components/BoardSection";
import Loader from "@/components/ui/Loader/Loader";
import SlidePanel from "@/components/ui/SlidePanel/SlidePanel";
import SectionHeader from "@/components/ui/SectionHeader";
import DynamicDepartmentForm, { getDepartmentFormConfig } from "@/components/forms/DynamicDepartmentForm";
import { DEPARTMENT_FORM_DEPARTMENT } from "@/components/forms/configs/formConstants";
import { showError, showSuccess } from "@/utils/toast";

const TASK_COLUMNS = [
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
  { key: "dueDate", header: "Due date", render: (t) => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "–") },
];

const ORDER_COLUMNS = [
  { key: "orderDate", header: "Date", render: (o) => o.orderDate ?? "–" },
  { key: "summary", header: "Summary", render: (o) => o.summary ?? "–" },
  {
    key: "status",
    header: "Status",
    render: (o) => (
      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-app">
        {o.status}
      </span>
    ),
  },
];

const DASHBOARD_CONFIG = {
  design: {
    boardsApi: taskBoardsApi,
    itemsApi: tasksApi,
    columns: TASK_COLUMNS,
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
    boardsApi: orderBoardsApi,
    itemsApi: ordersApi,
    columns: ORDER_COLUMNS,
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

export default function DashboardPage({ variant = "design" }) {
  const config = DASHBOARD_CONFIG[variant] ?? DASHBOARD_CONFIG.design;
  const { canAccess, user } = useAuth();
  const { viewingDepartmentId } = useSelectedDepartment();
  const isUserAdmin = canAccess("admin");
  const appData = useAppDataContext();

  const [boards, setBoards] = useState([]);
  const [items, setItems] = useState([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
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

  // Fetch boards
  useEffect(() => {
    if (!user?.departmentId) {
      setBoardsLoading(false);
      return;
    }
    let cancelled = false;
    setBoardsLoading(true);
    config.boardsApi
      .list({ year, month })
      .then((data) => {
        if (cancelled) return;
        const list = data.boards ?? [];
        setBoards(list);
        setSelectedBoardId(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setBoards([]);
        if (!cancelled) setSelectedBoardId(null);
      })
      .finally(() => {
        if (!cancelled) setBoardsLoading(false);
      });
    return () => { cancelled = true; };
  }, [year, month, user?.departmentId, variant]);

  // Fetch items for selected board
  useEffect(() => {
    if (!selectedBoardId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setItemsLoading(true);
    config.itemsApi
      .list(selectedBoardId)
      .then((data) => {
        if (!cancelled) setItems(config.getItems(data));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBoardId, variant]);

  // Real-time: refetch items on socket event
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedBoardId) return;
    const handler = ({ boardId }) => {
      if (boardId !== selectedBoardId) return;
      config.itemsApi.list(selectedBoardId).then((data) => setItems(config.getItems(data)));
    };
    socket.on(config.socketEvent, handler);
    return () => socket.off(config.socketEvent, handler);
  }, [selectedBoardId, variant]);

  const efficiencyData = {
    averageTaskCompletion: 2.3,
    productivityScore: 87,
    qualityRating: 4.2,
    onTimeDelivery: 94,
    clientSatisfaction: 4.6,
  };

  const cardCacheRef = useRef(new Map());

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
    return newCards.map((newCard) => {
      const cacheKey = `${newCard.id}-${newCard.color}-${newCard.value}-${newCard.title}-${newCard.subtitle}-${JSON.stringify(newCard.details)}-${JSON.stringify(newCard.badge)}`;
      const cached = cardCacheRef.current.get(cacheKey);
      if (
        cached &&
        cached.id === newCard.id &&
        cached.color === newCard.color &&
        cached.value === newCard.value &&
        cached.title === newCard.title &&
        cached.subtitle === newCard.subtitle &&
        JSON.stringify(cached.details) === JSON.stringify(newCard.details) &&
        JSON.stringify(cached.badge) === JSON.stringify(newCard.badge)
      ) {
        return cached;
      }
      cardCacheRef.current.set(cacheKey, newCard);
      return newCard;
    });
  }, [variant, user, boards, items, users, isUserAdmin]);

  // Design needs AppData initialized
  if (variant === "design") {
    if (!appData || !appData.isInitialized) {
      return (
        <div className="min-h-screen flex-center">
          <Loader size="lg" text="Initializing application data..." variant="spinner" />
        </div>
      );
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

      <BoardSection
        title={config.boardTitle}
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={setSelectedBoardId}
        items={items}
        itemsLoading={itemsLoading}
        columns={config.columns}
        emptyBoardsMessage={config.emptyBoardsMessage}
        emptyItemsMessage={config.emptyItemsMessage}
        loadingMessage={config.loadingMessage}
        boardsLoading={boardsLoading}
        addButtonLabel={config.addButtonLabel}
        onAdd={() => setAddPanelOpen(true)}
        exportButtonLabel="Export"
        onExport={() => showError("Export coming soon")}
      />

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
