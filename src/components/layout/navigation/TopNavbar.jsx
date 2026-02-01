import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiChevronRight, FiHelpCircle, FiLogOut, FiUser } from "react-icons/fi";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkModeProvider";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import Avatar from "@/components/ui/Avatar/Avatar";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import { NAVIGATION_CONFIG } from "@/constants";

/** Friendly labels for path segments (design/food and settings). */
const SEGMENT_LABELS = {
  design: "Design",
  food: "Food",
  dashboard: "Dashboard",
  profile: "Profile",
  analytics: "Analytics",
  "order-board": "Order board",
  orders: "Orders",
  history: "History",
  settings: "Settings",
  users: "Users",
  departments: "Departments",
  "ui-showcase": "UI Showcase",
  "coming-soon": "Coming Soon",
  "by-users": "By users",
  "reporter-overview": "Reporter overview",
  "month-comparison": "Month comparison",
  marketing: "Marketing",
  acquisition: "Acquisition",
  product: "Product",
  misc: "Misc",
};

/** Breadcrumb segments with label and href for clickable routing. */
function getBreadcrumbSegments(pathname) {
  const fallbacks = {
    "/profile": "Profile",
    "/coming-soon": "Coming Soon",
    "/preview": "Preview",
  };
  for (const [path, title] of Object.entries(fallbacks)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return [{ label: title, href: pathname, current: true }];
    }
  }

  const parts = pathname.replace(/^\//, "").split("/").filter(Boolean);
  if (parts.length === 0) return [];

  const base = parts[0];
  let segments = [];

  if (base === "design" || base === "food") {
    const appLabel = SEGMENT_LABELS[base] || base;
    const appHref = `/${base}/dashboard`;
    if (parts.length === 1) {
      return [{ label: appLabel, href: appHref, current: false }, { label: "Dashboard", href: appHref, current: true }];
    }
    const segs = [{ label: appLabel, href: appHref, current: false }];
    let href = `/${base}`;
    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i];
      href += `/${seg}`;
      const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      segs.push({ label, href, current: i === parts.length - 1 });
    }
    return segs;
  }

  if (base === "settings") {
    const main = NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [];
    const dept = NAVIGATION_CONFIG.DEPARTMENTS_ITEM ? [NAVIGATION_CONFIG.DEPARTMENTS_ITEM] : [];
    const items = [...main, ...dept];
    for (const item of items) {
      if (item.href === pathname) {
        return [{ label: item.name, href: item.href, current: true }];
      }
      const subItems = item.subItems ?? [];
      for (const sub of subItems) {
        if (sub.href === pathname) {
          return [
            { label: item.name, href: item.href, current: false },
            { label: sub.name, href: sub.href, current: true },
          ];
        }
      }
    }
  }

  const main = NAVIGATION_CONFIG.MAIN_MENU_ITEMS ?? [];
  const dept = NAVIGATION_CONFIG.DEPARTMENTS_ITEM ? [NAVIGATION_CONFIG.DEPARTMENTS_ITEM] : [];
  const settings = NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [];
  const items = [...main, ...dept, ...settings];
  for (const item of items) {
    if (item.href === pathname) {
      return [{ label: item.name, href: item.href, current: true }];
    }
    const subItems = item.subItems ?? [];
    for (const sub of subItems) {
      if (sub.href === pathname) {
        return [
          { label: item.name, href: item.href, current: false },
          { label: sub.name, href: sub.href, current: true },
        ];
      }
    }
  }

  let href = "";
  return parts.map((segment, i) => {
    href += (href ? "/" : "/") + segment;
    const label = SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { label, href, current: i === parts.length - 1 };
  });
}

const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-app transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50";

const TopNavbar = () => {
  const { logout, clearError, user } = useAuth();
  const { isDarkMode, isTransitioning, toggleDarkMode } = useDarkMode();
  const { basePath } = useDepartmentApp();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const breadcrumbSegments = getBreadcrumbSegments(pathname);
  const profileHref = basePath ? `${basePath}/profile` : "/profile";
  const homeHref = basePath ? `${basePath}/dashboard` : "/";
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
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-primary px-4 md:px-6"
      aria-label="Top navigation"
    >
      <nav className="flex min-w-0 flex-1 items-center gap-1.5" aria-label="Breadcrumb">
        <Link
          to={homeHref}
          className="top-nav-home text-sm font-medium text-gray-500 transition-colors hover:text-app dark:text-gray-400 dark:hover:text-gray-100"
        >
          Home
        </Link>
        {breadcrumbSegments.length > 0 && (
          <>
            {breadcrumbSegments.map((seg, i) => (
              <span key={seg.href + i} className="flex items-center gap-1.5 shrink-0">
                <FiChevronRight
                  className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                  aria-hidden
                />
                {seg.current ? (
                  <span
                    className="top-nav-current text-sm font-semibold text-app truncate max-w-[140px] sm:max-w-[200px]"
                    aria-current="page"
                  >
                    {seg.label}
                  </span>
                ) : (
                  <Link
                    to={seg.href}
                    className="text-sm font-medium text-gray-500 transition-colors hover:text-app dark:text-gray-400 dark:hover:text-gray-100 truncate max-w-[120px] sm:max-w-[180px]"
                  >
                    {seg.label}
                  </Link>
                )}
              </span>
            ))}
          </>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {!user && (
          <div className="flex items-center">
            <DarkModeToggle />
          </div>
        )}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="top-nav-user-btn flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 transition-colors hover:bg-gray-100 hover:border-gray-200 dark:hover:bg-gray-700/50 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
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
              <div className="hidden min-w-0 text-left sm:block">
                <p className="text-xs font-medium text-app truncate max-w-[140px]">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {user.email || ""}
                </p>
              </div>
              <FiChevronDown
                className={`w-4 h-4 shrink-0 text-gray-400 transition-transform dark:text-gray-500 ${dropdownOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {dropdownOpen && (
              <div
                className="top-nav-dropdown absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-smallCard"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/80">
                  <p className="text-sm font-semibold text-app truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email || ""}
                  </p>
                </div>
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/80">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    UI mode
                  </p>
                  <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700/50">
                    <button
                      type="button"
                      onClick={() => isDarkMode && !isTransitioning && toggleDarkMode()}
                      disabled={isTransitioning}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400 dark:focus:ring-gray-500 disabled:opacity-50 ${
                        !isDarkMode
                          ? "bg-white text-app shadow-sm dark:bg-gray-600"
                          : "text-gray-500 hover:text-app dark:text-gray-400 dark:hover:text-gray-100"
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
                          ? "bg-white text-app shadow-sm dark:bg-gray-600"
                          : "text-gray-500 hover:text-app dark:text-gray-400 dark:hover:text-gray-100"
                      }`}
                      title="Dark"
                    >
                      <IoMoonOutline className="w-4 h-4 text-indigo-400" />
                      Dark
                    </button>
                  </div>
                </div>
                <Link
                  to={profileHref}
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
                <div className="my-1 border-t border-gray-100 dark:border-gray-700/80" />
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
