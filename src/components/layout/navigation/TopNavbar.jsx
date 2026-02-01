import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import Avatar from "@/components/ui/Avatar/Avatar";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import { NAVIGATION_CONFIG } from "@/constants";

/** Derive page title from pathname using nav config (exact path wins, then parent item name). */
function getPageTitle(pathname) {
  const items = NAVIGATION_CONFIG.ITEMS ?? [];
  for (const item of items) {
    if (item.href === pathname) return item.name;
    const subItems = item.subItems ?? [];
    for (const sub of subItems) {
      if (sub.href === pathname) return sub.name;
    }
  }
  // Fallbacks for known routes
  const fallbacks = {
    "/profile": "Profile",
    "/coming-soon": "Coming Soon",
    "/preview": "Preview",
  };
  for (const [path, title] of Object.entries(fallbacks)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  // Last resort: capitalize first segment
  const segment = pathname.replace(/^\//, "").split("/")[0] || "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

const TopNavbar = () => {
  const { logout, clearError, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      clearError();
    }
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6 bg-white dark:bg-smallCard"
      aria-label="Top navigation"
    >
      <h1 className="text-lg font-semibold text-app truncate">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2">
        <DarkModeToggle />
        {user ? (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
              title="Account settings"
            >
              <Avatar
                user={user}
                size="xs"
                showName={false}
                showEmail={false}
                className="shrink-0"
              />
              <div className="hidden min-w-0 sm:block">
                <p className="text-xs font-medium text-app truncate max-w-[120px]">
                  {user.name || "User"}
                </p>
              </div>
              <Icons.buttons.chevronRight className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
            </Link>
            <DynamicButton
              variant="secondary"
              size="xs"
              icon={Icons.buttons.logout}
              iconPosition="left"
              onClick={handleLogout}
              className="!py-1.5"
            >
              Sign out
            </DynamicButton>
          </>
        ) : null}
      </div>
    </header>
  );
};

export default TopNavbar;
