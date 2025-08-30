import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSelector } from "react-redux";
import { selectIsAuthChecking } from "../../../features/auth/authSlice";
import DynamicButton from "../ui/DynamicButton";
import DarkModeToggle from "../ui/DarkModeToggle";
import { logger } from "../../utils/logger";
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { Icons } from "../../icons";

const PublicLayout = () => {
  const navigate = useNavigate();
  const { user, canAccess, logout, clearError } = useAuth();
  const isAuthChecking = useSelector(selectIsAuthChecking);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      logger.error("Logout failed:", error);
      clearError();
    }
  };

  if (isAuthChecking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      <nav className="bg-white dark:bg-primary shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-2xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Task Tracker
              </Link>

              {/* Navigation Links - Only show for authenticated users */}
              {user && (
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
              )}
            </div>

            <div className="flex items-center space-x-4">
              <DarkModeToggle />

              {/* User Info - Only show for authenticated users */}
              {user && (
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
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
