import React, { useEffect, useState, useMemo } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAppData } from "@/hooks/useAppData";
import { useGenerateMonthBoardMutation } from "@/features/tasks/tasksApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import Sidebar from "@/components/navigation/Sidebar";
import FixedHeader from "@/components/layout/FixedHeader";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import { Icons } from "@/components/icons";


const AuthLayout = () => {
  const { user, canAccess } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get all data from useAppData hook (includes month data + app data)
  const appData = useAppData();
  
  // Admin route protection is handled by router level
  // No need to check admin access here since router already handles it
  
  // Extract what we need for AuthLayout UI and month board generation
  const { monthId, monthName, boardExists, startDate, endDate, daysInMonth, isLoading } = appData || {};
  
  // Month board operations from tasksApi
  const [generateMonthBoard, { isLoading: isGenerating }] = useGenerateMonthBoardMutation();

  // Define functions that will be used in useEffect hooks
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  
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

  // Month data is now automatically loaded by useAppData hook from tasksApi
  // No manual initialization needed - RTK Query handles everything
  
  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader size="xl" text="Loading app data..." fullScreen={true} />
      </div>
    );
  }

  // Month board generation handler (admin only)
  const handleGenerateBoard = async () => {
    if (!canAccess("admin")) {
      showError("You need admin permissions to generate month boards.");
      return;
    }

    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    logger.log("Generating month board", { monthId, monthName });

    try {
      const result = await generateMonthBoard({
        monthId,
        startDate: startDate,
        endDate: endDate,
        daysInMonth: daysInMonth,
        userData: appData.user, // Pass user data from appData
      });

      if (result.data) {
        showSuccess("Month board generated successfully!");
        logger.log("Month board generated successfully", { monthId });
      } else {
        showError(result.error?.data?.message || "Failed to generate month board. Please try again.");
      }
    } catch (error) {
      showError(`An error occurred while generating the month board: ${error.message || error}`);
      logger.error("Month board generation error", { monthId, error: error.message });
    }
  };

  // 🎯 HIGH PRIORITY: Core app loading - show loader while essential data loads
  if (isLoading || !monthId || !monthName) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader size="xl" text="Loading app data..." fullScreen={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Fixed Header */}
      <FixedHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden`}>
          <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Month Board Warning - Global notification */}
          {!boardExists && monthId && monthName && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Icons.buttons.alert className="w-5 h-5 mr-2" />
                    Month Board Not Available
                  </h3>
                  <p className="text-sm">
                    The month board for {monthName} has not been generated yet. 
                    {canAccess("admin") 
                      ? " Generate it to enable task management features." 
                      : " Task creation is disabled until the board is available."
                    }
                  </p>
                </div>
                {canAccess("admin") && (
                  <div className="mt-3 sm:mt-0 sm:ml-4">
                    <DynamicButton
                      onClick={handleGenerateBoard}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                      className="border-white text-white hover:bg-white hover:text-yellow-600"
                    >
                      {isGenerating ? "Generating..." : "Generate Board Now"}
                    </DynamicButton>
                  </div>
                )}
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
