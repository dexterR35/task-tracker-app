import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DynamicButton from "./button/DynamicButton";
import Skeleton from "./ui/Skeleton";
import OfflineIndicator from "./ui/OfflineIndicator";

import {
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon,
  ChartBarIcon,
  UsersIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isAuthenticated, logout, loading, listenerActive } =
    useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isBooting = !listenerActive && loading.initListener;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Determine if we're on a dashboard page
  const isDashboardPage =
    location.pathname === "/user" ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  // Navigation items - only for admin
  const getNavigationItems = () => {
    if (role === "admin") {
      return [
        { name: "Admin Dashboard", href: "/admin", icon: ViewColumnsIcon },
        { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
        { name: "Users", href: "/admin/users", icon: UsersIcon },
      ];
    }
    return [];
  };

  const navigation = getNavigationItems();

  return (
    <div className="min-h-screen">
      <OfflineIndicator />

      <nav className="bg-primary shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <p className="flex-shrink-0">
                <Link to="/" className="text-2xl nav-link !p-0 !m-0 font-bold">
                  Task Tracker
                </Link>
              </p>
              {/* Navigation links - only show for admin */}
              {role === "admin" && (
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex-center nav-link text-sm ${
                        location.pathname === item.href
                          ? "text-blue-300 border-b-2 border-blue-300"
                          : ""
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
              {/* User dashboard link - only show for regular users */}
              {role !== "admin" && (
                <div className="hidden md:ml-6 md:flex md:space-x-8">
                  <Link
                    to="/user"
                    className={`flex-center nav-link text-sm ${
                      location.pathname === "/user"
                        ? "text-blue-300 border-b-2 border-blue-300"
                        : ""
                    }`}
                  >
                    <ViewColumnsIcon className="w-5 h-5 mr-2" />
                    My Dashboard
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-center !mx-0 items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5 text-gray-300" />
                  <span className="text-sm text-gray-200 capitalize">
                    {user?.name || user?.email}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {role}
                </span>
              </div>

              <DynamicButton
                id="logout-nav-btn"
                variant="outline"
                size="sm"
                icon={ArrowRightOnRectangleIcon}
                onClick={handleLogout}
              >
                Logout
              </DynamicButton>
            </div>
          </div>
        </div>
      </nav>

      <main
        className={`${isDashboardPage ? "" : "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"} relative`}
      >
        {isBooting && (
          <div className="space-y-6">
            <Skeleton variant="title" width="256px" height="32px" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton variant="card" height="96px" />
              <Skeleton variant="card" height="96px" />
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
