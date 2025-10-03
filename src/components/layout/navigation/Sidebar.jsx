import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icons } from "@/components/icons";
import MidnightCountdown from "@/components/ui/MidnightCountdown/MidnightCountdown";
import DynamicButton from "@/components/ui/Button/DynamicButton";

const Sidebar = () => {
  const { logout, clearError, canAccess } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      clearError();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Icons.generic.home,
      description: "Task management",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: Icons.generic.chart,
      adminOnly: true,
      description: "Data insights",
    },
    {
      name: "Landing Pages",
      href: "/landing-pages",
      icon: Icons.generic.document,
      description: "Landing pages management",
    },
    {
      name: "Management",
      href: "/users",
      icon: Icons.generic.settings,
      adminOnly: true,
      description: "User & Settings management",
    },
  ];

  return (
    <div className="flex flex-col h-full pb-6 ">
      {/* Logo Section */}
      <div className="flex items-center  px-8 border-bottom h-24">
        <Link to="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-default to-btn-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl ">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              SYNC
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Task Tracker
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !canAccess("admin")) return null;

          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-4 py-4 rounded-xl text-sm font-medium  ${
                isActive(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/40 dark:text-gray-200"
                  : "text-white dark:text-gray-200 "
              }`}
            >
              <div
                className={`p-2 rounded-lg  ${
                  isActive(item.href)
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 text-gray-200"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-[10px]">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 pt-4 bordet-top space-y-4">
        <MidnightCountdown />

        <DynamicButton
          onClick={handleLogout}
          variant="outline"
          size="md"
          icon={Icons.buttons.logout}
          iconPosition="left"
          className="w-full "
        >
          Logout
        </DynamicButton>
      </div>
    </div>
  );
};

export default Sidebar;
