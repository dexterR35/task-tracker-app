import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {  useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

import DynamicButton from "../ui/DynamicButton";
import DarkModeToggle from "../ui/DarkModeToggle";
import { logger } from "../../utils/logger";

import {
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon,
  ChartBarIcon,
  UsersIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Icons } from "../../icons";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isLoading,
    isAuthChecking,
    isAdmin,
    logout,
    clearError,
  } = useAuth();


  // Debug auth state changes
  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      logger.log("Auth state changed:", {
        isAuthenticated,
        user: user?.email,
        isLoading,
        isAuthChecking,
      });
    }
  }, [isAuthenticated, user, isLoading, isAuthChecking]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      logger.error("Logout failed:", error);
      clearError();
    }
  };





  // If auth is loading or checking, show loading state
  if (isLoading || isAuthChecking) {
    return <Outlet />;
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!isAuthenticated || !user) return [];

    if (isAdmin) {
      return [
        {
          name: "Dashboard",
          href: "/admin",
          icon: ViewColumnsIcon,
          current: location.pathname === "/admin",
        },
        {
          name: "Users",
          href: "/admin/users",
          icon: UsersIcon,
          current: location.pathname === "/admin/users",
        },
        {
          name: "Reporters",
          href: "/admin/reporters",
          icon: UserGroupIcon,
          current: location.pathname === "/admin/reporters",
        },
        {
          name: "Analytics",
          href: "/admin/analytics",
          icon: ChartBarIcon,
          current: location.pathname === "/admin/analytics",
        },
      ];
    } else {
      return [
        {
          name: "My Dashboard",
          href: "/user",
          icon: HomeIcon,
          current: location.pathname === "/user",
        },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      {/* Navigation - Always visible */}
      <nav className="bg-white dark:bg-primary shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Task Tracker
              </Link>

              {/* Navigation Links - Only show when authenticated */}
              {isAuthenticated && user && (
                <div className="hidden md:ml-8 md:flex md:space-x-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        item.current
                          ? "bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side Menu */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle - Always visible */}
              <DarkModeToggle />

              {/* User Menu - Only show when authenticated */}
              {isAuthenticated && user && (
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Icons.profile.user className="w-4 h-4 text-white" />
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

                    {/* Role Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shadow-sm ${
                        isAdmin
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
              )}

              {/* Login Button - Only show when not authenticated */}
              {/* {!isAuthenticated && !isLoading && !isAuthChecking && (
                <DynamicButton
                  to="/login"
                  variant="primary"
                  size="md"
                  iconName="login"
                  iconPosition="left"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Login
                </DynamicButton>
              )} */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        <Outlet />
      </main>


    </div>
  );
};

export default Layout;
