import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthChecking } from "@/features/auth";
import { useAuth } from "@/features/auth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";

import {
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const AppLayout = () => {
  const { user } = useAuth();
  const isAuthChecking = useSelector(selectIsAuthChecking);

  if (isAuthChecking) {
    return null;
  }

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white dark:bg-primary transition-colors duration-300">
      {/* Public Navigation - Only show for non-authenticated users */}
      {!isAuthenticated && (
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

                {/* Public Navigation Links */}
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
              </div>

              {/* Right Side - Public Actions */}
              <div className="flex items-center space-x-4">
                <DarkModeToggle />
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
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
