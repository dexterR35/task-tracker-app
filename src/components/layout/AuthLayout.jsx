import React, { useEffect, useState, useMemo, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAppData } from "@/hooks/useAppData";
import { useGenerateMonthBoardMutation } from "@/features/tasks/tasksApi";
import { showSuccess, showError } from "@/utils/toast";
import { logger } from "@/utils/logger";
import Sidebar from "@/components/navigation/Sidebar";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import { FiMenu } from "react-icons/fi";

// Create context for app data to avoid multiple useAppData calls
const AppDataContext = createContext();

export const useAppDataContext = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within AuthLayout');
  }
  return context;
};


const AuthLayout = () => {
  const { user, canAccess } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get all data from useAppData hook (includes month data + app data)
  const appData = useAppData();
  
  // Extract what we need for AuthLayout UI and month board generation
  const { monthId, monthName, boardExists, startDate, endDate, daysInMonth, isLoading } = appData;
  
  // Month board operations from tasksApi
  const [generateMonthBoard, { isLoading: isGenerating }] = useGenerateMonthBoardMutation();

  // Month data is now automatically loaded by useAppData hook from tasksApi
  // No manual initialization needed - RTK Query handles everything

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
      <AppDataContext.Provider value={appData}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden`}>
              <Sidebar onToggle={toggleSidebar} isOpen={sidebarOpen} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Month Board Warning - Global notification */}
              {!boardExists && monthId && (
                <div className="bg-yellow-600 text-white p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        ⚠️ Month Board Not Available
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

            {/* Floating Toggle Button - Only show when sidebar is closed */}
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label="Show sidebar"
                title="Show sidebar (Ctrl+B)"
              >
                <FiMenu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </AppDataContext.Provider>
  );
};

export default AuthLayout;
