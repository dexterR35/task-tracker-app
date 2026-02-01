/**
 * Food department – Dashboard = Overview cards + Order board (shared BoardSection).
 * Same layout/buttons as Design task board; different data (orders) and column config.
 */
import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { orderBoardsApi, ordersApi } from "@/app/api";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { SkeletonCard } from "@/components/ui/Skeleton/Skeleton";
import BoardSection from "@/components/BoardSection";
import { showError } from "@/utils/toast";

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

const FoodDashboardPage = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    orderBoardsApi
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
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [year, month, user?.departmentId]);

  useEffect(() => {
    if (!selectedBoardId) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    ordersApi
      .list(selectedBoardId)
      .then((data) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBoardId]);

  const cardData = useMemo(
    () => ({
      currentUser: user,
      tasks: [],
      boards,
      orders,
      ordersCount: orders.length,
    }),
    [user, boards, orders]
  );

  const smallCards = useMemo(() => createCards(cardData, "food"), [cardData]);

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
          {loading && boards.length === 0
            ? Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : smallCards.map((card) =>
                card.href ? (
                  <Link key={card.id} to={card.href} className="block">
                    <SmallCard card={card} />
                  </Link>
                ) : (
                  <SmallCard key={card.id} card={card} />
                )
              )}
        </div>
      </section>

      <BoardSection
        title="Order board"
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelectBoard={setSelectedBoardId}
        items={orders}
        itemsLoading={ordersLoading}
        columns={ORDER_COLUMNS}
        emptyBoardsMessage="No order board for this month. Create one via API or add a Get or create board action."
        emptyItemsMessage="No orders yet for this board."
        loadingMessage="Loading orders…"
        boardsLoading={loading}
        addButtonLabel="Send food"
        onAdd={() => showError("Send food coming soon")}
        exportButtonLabel="Export"
        onExport={() => showError("Export coming soon")}
      />
    </div>
  );
};

export default FoodDashboardPage;
