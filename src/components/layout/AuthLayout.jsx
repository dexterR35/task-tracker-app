import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/navigation/Sidebar";
import FixedHeader from "@/components/layout/navigation/FixedHeader";
import MonthBoardBanner from "@/components/layout/components/MonthBoardBanner";

const AuthLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col color-primary">
      <header className="relative z-50 border-bottom h-14 border-bottom">
        <FixedHeader
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
      </header>

      <div className="flex  overflow-hidden h-[calc(100vh-3.5em)]">
        <aside
          className={`relative z-40 bg-secondary  border-right   ${sidebarOpen ? "w-72" : "w-0"} overflow-hidden`}
        >
          <div
            className={`w-full h-full  ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
          </div>
        </aside>
        <div
          className={`w-full flex flex-col overflow-hidden  ${sidebarOpen ? "ml-0" : "ml-0"}`}
        >
          <MonthBoardBanner />
          <main className=" overflow-y-auto bg-primary ">
            <div className="px-6 py-6 ">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
