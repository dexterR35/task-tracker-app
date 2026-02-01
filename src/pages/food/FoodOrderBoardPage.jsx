/**
 * Food app – Order board (monthly board for office food orders).
 * User is always in Food department when on this page (route guarded).
 */
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { orderBoardsApi, ordersApi } from "@/app/api";
import { DEPARTMENT_APP } from "@/constants";
import Loader from "@/components/ui/Loader/Loader";

const FoodOrderBoardPage = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    orderBoardsApi
      .list({ year: currentYear, month: currentMonth })
      .then((data) => {
        if (!cancelled) {
          setBoards(data.boards ?? []);
          const first = (data.boards ?? [])[0];
          if (first) setSelectedBoardId(first.id);
        }
      })
      .catch(() => {
        if (!cancelled) setBoards([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentYear, currentMonth, user?.departmentId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader size="md" text="Loading order board..." variant="spinner" />
      </div>
    );
  }

  const currentBoard = boards.find((b) => b.id === selectedBoardId) ?? boards[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-app">Order board</h1>
        <p className="text-sm text-app-subtle mt-1">
          Office food orders – {DEPARTMENT_APP.FOOD_BASE} app. Monthly board: {currentYear}-{String(currentMonth).padStart(2, "0")}.
        </p>
      </div>

      {boards.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard p-6 text-center text-app-subtle">
          No order board for this month. Create one via API or add a "Get or create board" action here.
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBoardId(b.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  selectedBoardId === b.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-app hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {b.year}-{String(b.month).padStart(2, "0")} {b.name ? `– ${b.name}` : ""}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <Loader size="sm" variant="spinner" />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-app-subtle uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-app-subtle uppercase">Summary</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-app-subtle uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-app-subtle text-sm">
                        No orders yet for this board.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="bg-white dark:bg-smallCard">
                        <td className="px-4 py-2 text-sm text-app">{o.orderDate ?? "–"}</td>
                        <td className="px-4 py-2 text-sm text-app">{o.summary ?? "–"}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-app">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FoodOrderBoardPage;
