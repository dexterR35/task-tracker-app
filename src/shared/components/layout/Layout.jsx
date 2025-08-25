import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import DynamicButton from "../ui/DynamicButton";
import GlobalLoader from "../ui/GlobalLoader";
import { logger } from "../../utils/logger";

import {
  ArrowRightOnRectangleIcon,
  ViewColumnsIcon,
  ChartBarIcon,
  UsersIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const ReauthModal = ({ isOpen, onClose, onReauth, error }) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    try {
      await onReauth(password);
      setPassword("");
      onClose();
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Session Expired</h3>
        <p className="text-gray-300 mb-4">
          Your session has expired. Please enter your password to continue.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <DynamicButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </DynamicButton>
            <DynamicButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!password.trim()}
              className="flex-1"
            >
              Continue
            </DynamicButton>
          </div>
        </form>
      </div>
    </div>
  );
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    role, 
    isAuthenticated, 
    logout, 
    isLoading,
    isAuthChecking,
    reauthRequired,
    reauthMessage,
    handleReauth,
    error,
    clearReauthRequirement
  } = useAuth();
  
  const [showReauthModal, setShowReauthModal] = useState(false);

  // Show reauth modal when reauth is required
  useEffect(() => {
    if (reauthRequired && !showReauthModal) {
      setShowReauthModal(true);
    }
  }, [reauthRequired, showReauthModal]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      logger.error("Logout failed:", error);
    }
  };

  const handleReauthSubmit = async (password) => {
    try {
      await handleReauth(password);
      setShowReauthModal(false);
      clearReauthRequirement();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleReauthClose = () => {
    setShowReauthModal(false);
    // Force logout if user cancels reauth
    logout();
  };

  // If not authenticated and not loading/checking auth, show outlet without nav
  if (!isAuthenticated && !isLoading && !isAuthChecking) {
    return (
      <GlobalLoader>
        <Outlet />
      </GlobalLoader>
    );
  }

  // If auth is loading or checking, show GlobalLoader
  if (isLoading || isAuthChecking) {
    return <GlobalLoader><Outlet /></GlobalLoader>;
  }

  // Determine if we're on a dashboard page
  const isDashboardPage =
    location.pathname === "/user" ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/preview/");

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
    <GlobalLoader>
      <div className="min-h-screen">
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
          <Outlet />
        </main>
        <ReauthModal
          isOpen={showReauthModal}
          onClose={handleReauthClose}
          onReauth={handleReauthSubmit}
          error={error}
        />
      </div>
    </GlobalLoader>
  );
};

export default Layout;
