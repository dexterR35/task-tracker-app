import React, { useMemo, useRef } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { showError } from "@/utils/toast";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import Loader from "@/components/ui/Loader/Loader";

const AdminDashboardPage = () => {
  const { canAccess, user } = useAuth();
  const isUserAdmin = canAccess("admin");

  const appData = useAppDataContext();
  const {
    users,
    isLoading,
    isInitialLoading,
    error,
    isInitialized,
  } = appData || {};

  const handleAddTask = () => {
    showError("Add task coming soon");
  };

  const handleExport = () => {
    showError("Export coming soon");
  };

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
      tasks: [],
      users,
      periodName: "Dashboard",
      periodId: "dashboard",
      isUserAdmin,
      currentUser: user,
      efficiency: efficiencyData,
      actionsTotalTasks: 0,
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
  }, [users, isUserAdmin, user]);

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
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview and progress
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DynamicButton
            onClick={handleAddTask}
            variant="primary"
            size="sm"
            iconName="add"
            iconPosition="left"
            iconCategory="buttons"
            className="!text-xs !px-3 !py-1.5"
          >
            Add Task
          </DynamicButton>
          <DynamicButton
            onClick={handleExport}
            variant="secondary"
            size="sm"
            iconName="download"
            iconPosition="left"
            iconCategory="buttons"
            className="!text-xs !px-3 !py-1.5"
          >
            Export
          </DynamicButton>
        </div>
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
    </div>
  );
};

export default AdminDashboardPage;
