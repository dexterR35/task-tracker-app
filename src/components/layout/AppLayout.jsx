import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/navigation/Sidebar";
import TopNavbar from "@/components/layout/navigation/TopNavbar";

const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-primary">
      <aside className="z-40 flex h-full w-52 shrink-0 flex-col overflow-hidden bg-white dark:bg-smallCard">
        <Sidebar />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto bg-primary">
          <div className="layout-content-padding">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
