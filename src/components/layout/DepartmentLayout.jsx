/**
 * Department layout + guard (component only). Wrong app → /unauthorized.
 * Otherwise: sidebar + TopNavbar + main content. Nav from config/navConfig.
 */
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/layout/navigation/AppSidebar";
import TopNavbar from "@/components/layout/navigation/TopNavbar";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import { designNavConfig, NAV_CONFIG_BY_PATH } from "@/config/navConfig";

const DepartmentLayout = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { isFoodApp, loginRedirectPath } = useDepartmentApp();

  if (isFoodApp && pathname.startsWith("/design")) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          reason: "department",
          attemptedApp: "Design",
          userApp: "Food",
          toDashboard: loginRedirectPath,
        }}
      />
    );
  }
  if (!isFoodApp && pathname.startsWith("/food")) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{
          reason: "department",
          attemptedApp: "Food",
          userApp: "Design",
          toDashboard: loginRedirectPath,
        }}
      />
    );
  }

  const base = pathname.split("/")[1];
  const navConfig = NAV_CONFIG_BY_PATH[base] ?? designNavConfig;

  return (
    <div className="flex h-screen overflow-hidden bg-primary">
      <aside className="z-40 flex h-full w-52 shrink-0 flex-col overflow-hidden bg-white dark:bg-smallCard">
        <AppSidebar navConfig={navConfig} />
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

export default DepartmentLayout;
