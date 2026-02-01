/**
 * Food app layout – office food orders (Order board, Orders, History).
 */
import React from "react";
import { Outlet } from "react-router-dom";
import FoodSidebar from "@/components/layout/navigation/FoodSidebar";
import TopNavbar from "@/components/layout/navigation/TopNavbar";

const FoodLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-primary">
      <aside className="z-40 flex h-full w-52 shrink-0 flex-col overflow-hidden bg-white dark:bg-smallCard">
        <FoodSidebar />
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-primary">
          <div className="px-4 py-6 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FoodLayout;
