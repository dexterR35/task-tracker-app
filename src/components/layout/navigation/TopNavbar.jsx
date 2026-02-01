import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiHelpCircle, FiLogOut, FiUser } from "react-icons/fi";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkModeProvider";
import Avatar from "@/components/ui/Avatar/Avatar";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import { CARD_SYSTEM, NAVIGATION_CONFIG } from "@/constants";

/** Path using menu names from nav config, e.g. "Dashboard" or "Settings / Users". */
function getBreadcrumbPath(pathname) {
  const items = NAVIGATION_CONFIG.ITEMS ?? [];
  for (const item of items) {
    if (item.href === pathname) return item.name;
    const subItems = item.subItems ?? [];
    for (const sub of subItems) {
      if (sub.href === pathname) return item.name + " / " + sub.name;
    }
  }
  // Fallbacks
  const fallbacks = { "/profile": "Profile", "/coming-soon": "Coming Soon", "/preview": "Preview" };
  for (const [path, title] of Object.entries(fallbacks)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  // Last resort: capitalize URL segments
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length === 0) return "";
  const labels = segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "));
  return labels.join(" / ");
}

const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-app transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50";

const TopNavbar = () => {
  const { logout, clearError, user } = useAuth();
  const { isDarkMode, isTransitioning, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const breadcrumbPath = getBreadcrumbPath(pathname);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      clearError();
    }
  };

  return (
    <header
      className="flex h-24 shrink-0 items-center justify-between px-4 md:px-6 bg-transparent mb-8"
      aria-label="Top navigation"
    >
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400 truncate" aria-label="Current path">
          {breadcrumbPath}
        </span>
        <span className="flex items-center gap-0.5 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden>
          <FiChevronLeft className="w-4 h-4" />
          <FiChevronRight className="w-4 h-4" />
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!user && <DarkModeToggle />}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              <Avatar
                user={user}
                size="xs"
                showName={false}
                showEmail={false}
                className="shrink-0"
              />
              <div className="hidden min-w-0 sm:block text-left">
                <p className="text-xs font-medium text-app truncate max-w-[140px]">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {user.email || ""}
                </p>
              </div>
              <FiChevronDown
                className={`w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard py-1 shadow-lg"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-app truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email || ""}
                  </p>
                </div>
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    UI mode
                  </p>
                  <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => isDarkMode && !isTransitioning && toggleDarkMode()}
                      disabled={isTransitioning}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 dark:focus:ring-gray-500 disabled:opacity-50 ${
                        !isDarkMode
                          ? "bg-white dark:bg-gray-600 text-app shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-app"
                      }`}
                      title="Light"
                    >
                      <IoSunnyOutline className="w-4 h-4 text-amber-500" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => !isDarkMode && !isTransitioning && toggleDarkMode()}
                      disabled={isTransitioning}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 dark:focus:ring-gray-500 disabled:opacity-50 ${
                        isDarkMode
                          ? "bg-white dark:bg-gray-600 text-app shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-app"
                      }`}
                      title="Dark"
                    >
                      <IoMoonOutline className="w-4 h-4 text-indigo-400" />
                      Dark
                    </button>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className={menuItemClass}
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FiUser className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
                  Profile
                </Link>
                <Link
                  to="/help"
                  className={menuItemClass}
                  role="menuitem"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FiHelpCircle className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
                  Help
                </Link>
                <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                <button
                  type="button"
                  className={`${menuItemClass} w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <FiLogOut className="w-4 h-4 shrink-0" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default TopNavbar;
