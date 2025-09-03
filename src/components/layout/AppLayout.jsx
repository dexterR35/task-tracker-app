import React from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthChecking } from "@/features/auth";
import { useAuth } from "@/features/auth";
import { useFetchData } from "@/hooks/useFetchData";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists 
} from "@/features/currentMonth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Icons } from "@/components/icons";

const AppLayout = () => {
  const navigate = useNavigate();
  
  // Get auth functions from useAuth
  const { logout, clearError, canAccess } = useAuth();
  
  // Get user data from useFetchData
  const { user } = useFetchData();
  
  // Get month data directly from Redux store (no hook calls)
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const boardExists = useSelector(selectBoardExists);
  
  const isAuthChecking = useSelector(selectIsAuthChecking);

  const isAuthenticated = !!user;
  const isUserAdmin = canAccess('admin');

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      clearError();
    }
  };

  if (isAuthChecking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-primary">
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
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
