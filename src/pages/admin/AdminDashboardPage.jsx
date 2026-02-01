/**
 * Design department – Dashboard = Overview cards + Task board (shared BoardSection).
 * Same layout/buttons as Food order board; different data (tasks) and column config.
 */
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
import { taskBoardsApi, tasksApi } from "@/app/api";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError } from "@/utils/toast";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import BoardSection from "@/components/BoardSection";
import Loader from "@/components/ui/Loader/Loader";

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

const AdminDashboardPage = () => {
  const { canAccess, user } = useAuth();
  const { viewingDepartmentId } = useSelectedDepartment();
  const isUserAdmin = canAccess("admin");

  const appData = useAppDataContext();
  const {
    users: allUsers = [],
    isInitialLoading,
    error,
    isInitialized,
  } = appData || {};

  const users = useMemo(
    () =>
      viewingDepartmentId
        ? allUsers.filter((u) => u.departmentId === viewingDepartmentId)
        : allUsers,
    [allUsers, viewingDepartmentId]
  );

  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (!user?.departmentId) {
      setBoardsLoading(false);
      return;
    }
    let cancelled = false;
    setBoardsLoading(true);
    taskBoardsApi
      .list({ year, month })
      .then((data) => {
        if (cancelled) return;
        const list = data.boards ?? [];
        setBoards(list);
        const first = list[0];
        if (first) setSelectedBoardId(first.id);
        else setSelectedBoardId(null);
      })
      .catch(() => {
        if (!cancelled) setBoards([]);
        if (!cancelled) setSelectedBoardId(null);
      })
      .finally(() => {
        if (!cancelled) setBoardsLoading(false);
      });
    return () => { cancelled = true; };
  }, [year, month, user?.departmentId]);

  useEffect(() => {
    if (!selectedBoardId) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    setTasksLoading(true);
    tasksApi
      .list(selectedBoardId)
      .then((data) => {
        if (!cancelled) setTasks(data.tasks ?? []);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBoardId]);

  const efficiencyData = {
    averageTaskCompletion: 2.3,
    productivityScore: 87,
    qualityRating: 4.2,
    onTimeDelivery: 94,
    clientSatisfaction: 4.6,
  };

  const cardCacheRef = useRef(new Map());

  const smallCards = useMemo(() => {
    const newCards = createCards({
      tasks,
      users,
      periodName: "Dashboard",
      periodId: "dashboard",
      isUserAdmin,
      currentUser: user,
      efficiency: efficiencyData,
      actionsTotalTasks: tasks.length,
      actionsTotalHours: 0,
      actionsTotalDeliverables: 0,
      actionsTotalDeliverablesWithVariationsHours: 0,
    }, "main");

    return newCards.map((newCard) => {
      const cacheKey = `${newCard.id}-${newCard.color}-${newCard.value}-${newCard.title}-${newCard.subtitle}-${JSON.stringify(newCard.details)}-${JSON.stringify(newCard.badge)}`;
      const cachedCard = cardCacheRef.current.get(cacheKey);

      if (
        cachedCard &&
        cachedCard.id === newCard.id &&
        cachedCard.color === newCard.color &&
        cachedCard.value === newCard.value &&
        cachedCard.title === newCard.title &&
        cachedCard.subtitle === newCard.subtitle &&
        JSON.stringify(cachedCard.details) === JSON.stringify(newCard.details) &&
        JSON.stringify(cachedCard.badge) === JSON.stringify(newCard.badge)
      ) {
        return cachedCard;
      }

      cardCacheRef.current.set(cacheKey, newCard);
      return newCard;
    });
  }, [users, isUserAdmin, user, tasks]);

  if (!appData || !isInitialized) {
    return (
      <div className="min-h-screen flex-center">
        <Loader size="lg" text="Initializing application data..." variant="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-4 py-6 text-center text-red-error">
        Error loading data: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Overview and progress
        </p>
      </div>

      <section className="mb-6" aria-label="Dashboard overview">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Overview
          </span>
          <span className="h-px flex-1 max-w-[2rem] bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isInitialLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : smallCards.map((card) => <SmallCard key={card.id} card={card} />)}
        </div>
      </section>

      <BoardSection
        title="Task board"
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={setSelectedBoardId}
        items={tasks}
        itemsLoading={tasksLoading}
        columns={TASK_COLUMNS}
        emptyBoardsMessage="No task board for this month. Create one via API or add a Get or create board action."
        emptyItemsMessage="No tasks yet for this board."
        loadingMessage="Loading tasks…"
        boardsLoading={boardsLoading}
        addButtonLabel="Add a task"
        onAdd={() => showError("Add a task coming soon")}
        exportButtonLabel="Export"
        onExport={() => showError("Export coming soon")}
      />
    </div>
  );
};

export default AdminDashboardPage;
