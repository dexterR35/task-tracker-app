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


  return (
    <div className="h-screen flex flex-col bg-gray-700/20">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-300/50 dark:border-gray-700/50">
        <FixedHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      </header>
      
      <div className="flex flex-1 pt-12 overflow-hidden">
        {/* Fixed Sidebar */}
        <aside className={`fixed left-0 top-12 bottom-0 z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden`}>
          <div className={`w-72 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
          </div>
        </aside>

        {/* Main Content Area - Only this scrolls */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
          {/* Month Board Warning Banner */}
          <MonthBoardBanner />

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-primary">
            <div className="px-18 py-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;