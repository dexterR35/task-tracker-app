import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppDataContext } from "@/context/AppDataContext";
import { Icons } from "@/components/icons";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import logo from "@/assets/Logo4.webp";
import Avatar from "@/components/ui/Avatar/Avatar";
import UserBadge from "@/features/experience/components/UserBadge";
import LevelProgressBar from "@/features/experience/components/LevelProgressBar";
import { calculateLevel } from "@/features/experience/experienceConfig";
import { useAllUserTasks } from "@/features/tasks/tasksApi";
import { calculateCompleteExperienceFromTasks } from "@/features/experience/experienceCalculator";
import { getUserUID } from "@/features/utils/authUtils";

const FixedHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, canAccess, logout, clearError } = useAuth();
  const { deliverables } = useAppDataContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Get user UID for fetching tasks
  const userUID = getUserUID(user);

  // Fetch all user tasks across all months (real-time listener)
  const { tasks: allTasks = [], isLoading: tasksLoading } = useAllUserTasks(userUID);

  // Transform deliverables to options format for time calculations
  const deliverablesOptions = useMemo(() => {
    if (!deliverables || deliverables.length === 0) return [];
    return deliverables.map((deliverable) => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || "min",
    }));
  }, [deliverables]);

  // Calculate experience from all tasks (same as ExperienceSystemPage)
  // Always calculate from tasks - never use stored experience to avoid inconsistencies
  const calculatedExperience = useMemo(() => {
    // Don't show anything until tasks are loaded to avoid flickering
    if (tasksLoading || !user || !userUID) {
      return null;
    }

    // If no tasks yet, return empty experience (will show 0 points, level 1)
    if (!allTasks || allTasks.length === 0) {
      const level = calculateLevel(0);
      return {
        points: 0,
        level: level.level,
        levelName: level.name,
      };
    }

    const calculated = calculateCompleteExperienceFromTasks(
      allTasks,
      deliverablesOptions,
      userUID
    );

    const level = calculateLevel(calculated.points);

    return {
      ...calculated,
      level: level.level,
      levelName: level.name,
    };
  }, [allTasks, deliverablesOptions, tasksLoading, userUID, user]);

  // Always use calculated experience (never stored experience to avoid inconsistencies)
  const displayExperience = calculatedExperience;

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      // Navigate to home page after logout
      navigate('/', { replace: true });
    } catch (error) {
      clearError();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className="flex items-center justify-between h-full px-4 bg-white dark:bg-smallCard ">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Icons.buttons.menu className="w-5 h-5" />
        </button>

        {/* SYNC Logo */}
        <div className="flex items-center space-x-2">
          <img src={logo} alt="SYNC Logo" className="w-7 h-7 object-contain" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            SYNC
          </h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        {/* <button className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105">
          <Icons.generic.clock className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-error rounded-full"></span>
        </button> */}

        {/* Level Progress Bar - Real-time experience tracking */}
        <div className="hidden md:flex items-center gap-3">
          {tasksLoading || !user || !userUID ? (
            // Loading skeleton for level progress bar
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
              {/* Badge skeleton */}
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
              {/* Progress bar skeleton */}
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-8 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="w-1/3 h-full bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-12 h-2.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-16 h-2.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ) : displayExperience ? (
            <LevelProgressBar experience={displayExperience} compact={true} />
          ) : null}
        </div>

        {/* Dark Mode Toggle */}
        <div className="hidden sm:block">
          <DarkModeToggle />
        
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <Avatar 
              user={user}
              size="sm"
            
              showName={false}
              className="flex-shrink-0"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {canAccess("admin") ? "Administrator" : "User"}
              </p>
            </div>
            <Icons.buttons.chevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 rounded-md shadow-lg  py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              {/* User Badge/Level Display */}
              {displayExperience && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <UserBadge experience={displayExperience} showProgress={true} size="small" />
                </div>
              )}
              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/how-to-use");
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icons.generic.help className="w-4 h-4 inline mr-3" />
                  How to Use
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Icons.buttons.logout className="w-4 h-4 inline mr-3" />
                  Sign Out
                </button>
                
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Icons.buttons.menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixedHeader;
