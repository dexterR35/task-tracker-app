import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import Sidebar from "@/components/layout/navigation/Sidebar";
import FixedHeader from "@/components/layout/navigation/FixedHeader";
import MonthBoardBanner from "@/components/layout/components/MonthBoardBanner";
import Loader from "@/components/ui/Loader/Loader";

const AuthLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const appData = useAppData();
  const { isLoading } = appData || {};

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Keyboard shortcut for toggling sidebar (Ctrl/Cmd + B)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Auto-hide sidebar on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full ">
        <Loader size="xl" text="Loading app data..." fullScreen={true}  />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <FixedHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${sidebarOpen ? 'w-72' : 'w-0'}`}>
          <div className={`w-72 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
          </div>
        </div>

        {/* Main Content Area - Only this scrolls */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month Board Warning Banner */}
          <MonthBoardBanner />

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;