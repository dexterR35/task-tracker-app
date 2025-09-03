import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams, Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { selectIsAuthChecking } from "../../../features/auth/authSlice";
import { useAuth } from "../../hooks/useAuth";
import { useFetchData } from "../../hooks/useFetchData";
import { useUnifiedLoading } from "../../hooks/useUnifiedLoading";
import { useCacheManagement } from "../../hooks/useCacheManagement";
import { showSuccess, showError, showInfo } from "../../utils/toast";
import { logger } from "../../utils/logger";
import DynamicButton from "../ui/DynamicButton";
import DarkModeToggle from "../ui/DarkModeToggle";
import Loader from "../ui/Loader";
import OptimizedTaskMetricsBoard from "../dashboard/CardsMetrics";
import DashboardTaskTable from "../../task/TaskTable";
import TaskForm from "../../task/TaskForm";
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  HomeIcon,
  UserIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { Icons } from "../../icons";

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get auth functions from useAuth
  const { logout, clearError } = useAuth();
  
  // Get user data from useFetchData
  const { user, canAccess } = useFetchData();
  
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const { clearCacheOnDataChange } = useCacheManagement();

  // Local state for UI controls
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);

  // Determine if we're on a public route
  const isPublicRoute = ["/", "/login", "/unauthorized"].includes(location.pathname);
  const isAuthenticated = !!user;
  const isUserAdmin = canAccess('admin');

  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";
  
  // Derive userId based on context: URL param > current user
  const userId = isUserAdmin ? selectedUserId : user?.uid;

  // Use unified loading hook for data loading (auth is handled by router)
  const {
    isLoading,
    message: loadingMessage,
    progress,
    monthId,
    monthName,
    startDate,
    endDate,
    daysInMonth,
    boardExists,
    isGenerating,
    generateBoard,
    isNewMonth,
    dashboardData
  } = useUnifiedLoading(userId, !!user);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      logger.error("Logout failed:", error);
      clearError();
    }
  };

  // Show notification when new month is detected
  useEffect(() => {
    if (isNewMonth && monthName) {
      showInfo(`New month detected: ${monthName}. Board status will be updated automatically.`);
    }
  }, [isNewMonth, monthName]);

  // Handle user selection (admin only)
  const handleUserSelect = (event) => {
    const userId = event.target.value;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle generate month board (admin only)
  const handleGenerateBoard = async () => {
    if (!canAccess('admin')) {
      showError("You need admin permissions to generate month boards.");
      return;
    }

    if (!monthId) {
      showError("Current month not available. Please refresh the page.");
      return;
    }

    try {
      const result = await generateBoard({
        monthId,
        meta: {
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email,
          monthName: monthName || format(new Date(monthId + "-01"), "MMMM yyyy"),
        },
      });

      clearCacheOnDataChange('tasks', 'create');

      showSuccess(
        `Board for ${monthName || format(new Date(monthId + "-01"), "MMMM yyyy")} created successfully!`
      );
    } catch (error) {
      logger.error("[AppLayout] Error generating month board:", error);
      showError(
        `Failed to create board: ${error?.data?.message || error?.message || "Unknown error"}`
      );
    }
  };

  // Handle create task
  const handleCreateTask = async () => {
    if (!boardExists) {
      showError(
        `Cannot create task: Board for ${monthName || 'current month'} is not created yet. Please create the board first.`
      );
      return;
    }
    setShowCreateModal(true);
  };



  // Derive title based on context
  const title = isUserAdmin && selectedUserId 
    ? `Viewing ${dashboardData?.users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}'s Board`
    : `${user?.name || user?.email}'s - Board`;

  // Derive showCreateBoard - only for admins when board doesn't exist
  const showCreateBoard = isUserAdmin && !boardExists;

  if (isAuthChecking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-primary shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left Side - Logo and Navigation */}
            <div className="flex items-center">
              <Link
                to="/"
                className="uppercase text-2xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                SYNC
              </Link>

              {/* Navigation Links - Show different links based on auth status */}
              {isAuthenticated ? (
                // Authenticated Navigation
                <div className="hidden md:ml-8 md:flex md:space-x-4">
                  <Link
                    to="/dashboard"
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  
                  {canAccess('admin') && (
                    <>
                      <Link
                        to="/management"
                        className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Management
                      </Link>
                      <Link
                        to="/analytics"
                        className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <ChartBarIcon className="w-4 h-4 mr-2" />
                        Analytics
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                // Public Navigation
                <div className="hidden md:ml-8 md:flex md:space-x-4">
                  <Link
                    to="/"
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* Right Side - User Info and Actions */}
            <div className="flex items-center space-x-4">
              <DarkModeToggle />

              {isAuthenticated ? (
                // Authenticated User Info
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Icons.generic.user className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                            {user?.name || user?.email}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${
                        canAccess('admin')
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>

                  <DynamicButton
                    id="logout-nav-btn"
                    variant="outline"
                    size="sm"
                    icon={ArrowRightOnRectangleIcon}
                    onClick={handleLogout}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Logout
                  </DynamicButton>
                </>
              ) : (
                // Public Actions
                <div className="flex items-center space-x-2">
                  <DynamicButton
                    to="/login"
                    variant="primary"
                    size="sm"
                    iconName="login"
                    iconPosition="left"
                  >
                    Get Started
                  </DynamicButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative">
        {/* Render dashboard content when on dashboard route */}
        {location.pathname === "/dashboard" && isAuthenticated ? (
          <div className="container mx-auto px-4 py-6">
            {/* Show unified loading state for data loading */}
            {isLoading ? (
              <Loader 
                size="xl" 
                variant="spinner" 
                text={loadingMessage || "Loading dashboard..."} 
                fullScreen={true}
              />
            ) : dashboardData?.error ? (
              <div className="card">
                <div className="text-center py-8">
                  <h2>Error Loading Dashboard</h2>
                  <p className="text-sm">
                    {dashboardData.error?.message ||
                      "Failed to load dashboard data. Please try refreshing the page."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Dashboard Header */}
                <div className="mt-2 py-2 flex-center flex-col !items-start">
                  <h2 className="capitalize mb-0">{title}</h2>
                  <p className="text-xs font-base soft-white">
                    <span>Month:</span> {monthName || 'Loading...'} ({monthId})
                    {boardExists ? (
                      <span className="ml-2 text-green-success"> • Board ready</span>
                    ) : (
                      <span className="ml-2 text-red-error"> • Board not ready</span>
                    )}
                  </p>
                  {/* Additional month info */}
                  {startDate && endDate && daysInMonth && (
                    <p className="text-xs text-gray-400 mt-1">
                      Period: {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')} ({daysInMonth} days)
                    </p>
                  )}
                </div>

                {/* Board Status Warning if not created */}
                {!boardExists && showCreateBoard && (
                  <div className="card mt-2 border border-red-error text-red-error text-sm rounded-lg">
                    <div className="flex-center !flex-row !items-center !justify-between gap-4">
                      <p className="text-white-dark text-sm">
                        ❌ The board for {monthName || 'current month'}{" "}
                        is not created yet. Please create the board first.
                      </p>
                      <DynamicButton
                        variant="danger"
                        onClick={handleGenerateBoard}
                        loading={isGenerating}
                        size="sm"
                        iconName="generate"
                        iconPosition="left"
                      >
                        {isGenerating ? "Creating..." : "Create Board"}
                      </DynamicButton>
                    </div>
                  </div>
                )}

                {/* User Filter (Admin Only) */}
                {isUserAdmin && (
                  <div className="mt-4 mb-6">
                    <div className="flex items-center space-x-4">
                      <label htmlFor="user-filter" className="text-sm font-medium text-gray-300">
                        View User:
                      </label>
                      <select
                        name="user-filter"
                        id="user-filter"
                        value={selectedUserId}
                        onChange={handleUserSelect}
                        className="border border-gray-600 rounded px-3 py-2 bg-gray-800 text-white"
                      >
                        <option value="">All Users</option>
                        {dashboardData?.users?.map((user) => (
                          <option key={user.userUID || user.id} value={user.userUID || user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Create Task Button - Only show when board exists */}
                {boardExists && (
                  <div className="mb-6">
                    <DynamicButton
                      variant="primary"
                      onClick={handleCreateTask}
                      size="sm"
                      iconName="generate"
                      iconPosition="left"
                    >
                      Create Task
                    </DynamicButton>
                  </div>
                )}

                {/* Main Dashboard Content - Only show when board exists */}
                {boardExists && (
                  <div className="space-y-8">
                    {/* Metrics Board */}
                    <OptimizedTaskMetricsBoard 
                      userId={userId} 
                      showSmallCards={true}
                    />
                    
                    {/* Tasks Table - Integrated into dashboard with toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {isUserAdmin && selectedUserId 
                            ? `Tasks for ${dashboardData?.users?.find(u => (u.userUID || u.id) === selectedUserId)?.name || selectedUserId}`
                            : isUserAdmin 
                            ? "All Tasks" 
                            : "My Tasks"
                          }
                        </h3>
                        <DynamicButton
                          variant="outline"
                          onClick={() => setShowTable(!showTable)}
                          size="sm"
                          iconName={showTable ? "hide" : "show"}
                          iconPosition="left"
                        >
                          {showTable ? "Hide Table" : "Show Table"}
                        </DynamicButton>
                      </div>
                      
                      {showTable && (
                        <DashboardTaskTable
                          userId={userId}
                          hideCreateButton={true}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Board not ready message - shows for non-admin users when board doesn't exist */}
                {!boardExists && !isUserAdmin && (
                  <div className="text-center py-12">
                    <p className="text-gray-400">
                      Board not ready for {monthName || 'current month'}
                      . Please contact an admin to create the board.
                    </p>
                  </div>
                )}

                {/* Create Task Modal */}
                {showCreateModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Create New Task
                        </h2>
                        <DynamicButton
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateModal(false)}
                          iconName="close"
                          iconPosition="center"
                        />
                      </div>
                      <div className="p-6">
                        <TaskForm
                          mode="create"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Render other pages via Outlet */
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default AppLayout;
