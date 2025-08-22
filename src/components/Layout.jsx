import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DynamicButton from "./button/DynamicButton";
import Skeleton from "./ui/Skeleton";
import WelcomeMessage from "./ui/WelcomeMessage";
import { useNotifications } from "../hooks/useNotifications";

import {
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

const Layout = () => {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, logout, loading, listenerActive } =
    useAuth();
  const { addSuccess } = useNotifications();

  const handleLogout = async () => {
    try {
      await logout();
      addSuccess("Logged out successfully", {
        title: "Goodbye!",
        autoClose: 3000,
        position: "top-center"
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isBooting = !listenerActive && loading.initListener;

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const navigation = [
    ...(role === "admin"
      ? [
          { name: "Admin", href: "/admin", icon: ViewColumnsIcon },
          {
            name: "Analytics",
            href: "/admin/analytics",
            icon: ViewColumnsIcon,
          },
          { name: "Users", href: "/admin/users", icon: ViewColumnsIcon },
        ]
      : [{ name: "My Dashboard", href: "/me", icon: ViewColumnsIcon }]),
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-primary shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <p className="flex-shrink-0">
                <Link to="/" className="text-2xl nav-link !p-0 !m-0 font-bold">
                  Task Tracker
                </Link>
              </p>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex-center nav-link text-sm"
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex-center !mx-0 items-center space-x-4">
              <div className="hidden md:block ">
                <span className="text-sm text-gray-200 capitalize">
                  {user?.name || user?.email}
                </span>
                <span className="ml-2 mx-0 px-3.5 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-primary capitalize">
                  {role}
                </span>
              </div>

              <DynamicButton
                id="logout-nav-btn"
                variant="outline"
                size="sm"
                icon={ArrowRightOnRectangleIcon}
                onClick={handleLogout}
                successMessage="Logged out successfully"
              >
                Logout
              </DynamicButton>
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        {isBooting && (
          <div className="space-y-6">
            <Skeleton variant="title" width="256px" height="32px" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton variant="card" height="96px" />
              <Skeleton variant="card" height="96px" />
            </div>
          </div>
        )}
        <WelcomeMessage />
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
