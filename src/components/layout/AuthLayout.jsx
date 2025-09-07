import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "@/features/auth";
import { initializeCurrentMonth } from "@/features/currentMonth";
import Sidebar from "@/components/navigation/Sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

const AuthLayout = () => {
  const dispatch = useDispatch();
  const hasInitializedMonth = useRef(false);
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Centralized month initialization - runs when user is authenticated and month needs initialization
  // This ensures month data is available across all pages without duplication
  useEffect(() => {
    if (user && !hasInitializedMonth.current) {
      hasInitializedMonth.current = true;
      dispatch(initializeCurrentMonth());
    }
  }, [user, dispatch]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden`}>
          <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Floating Toggle Button - Only show when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Show sidebar"
            title="Show sidebar (Ctrl+B)"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
