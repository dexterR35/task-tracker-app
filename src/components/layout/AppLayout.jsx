import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/navigation/Sidebar";
import { MonthBoardBanner } from "@/utils/monthUtils.jsx";

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-primary">
      <div className="z-40 flex h-full w-44 shrink-0 flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700/60 bg-white dark:bg-smallCard">
        <Sidebar />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <MonthBoardBanner />
        <main className="flex-1 overflow-y-auto bg-primary">
          <div className="px-4 py-6 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
