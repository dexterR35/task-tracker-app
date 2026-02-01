/**
 * Single dynamic sidebar for all departments (Design, Food, future).
 * Main menu comes from navConfig (per department); Settings and Departments come from constants (shared).
 */
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSelectedDepartment } from "@/context/SelectedDepartmentContext";
import { Icons } from "@/components/icons";
import { CARD_SYSTEM, NAVIGATION_CONFIG } from "@/constants";
import logo from "@/assets/Logo4.webp";

const SIDEBAR_ICON_SIZE = "w-3.5 h-3.5";
const SIDEBAR_ICON_WRAPPER = "p-1.5 rounded-md";
const LINK_BASE =
  "group flex items-center gap-2.5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50";
const LINK_ACTIVE = "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-200";
const LINK_INACTIVE =
  "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200";
const COLOR_DEFAULT = CARD_SYSTEM?.COLOR_HEX_MAP?.color_default ?? "#312e81";
const ACTIVE_ICON_STYLE = {
  backgroundColor: COLOR_DEFAULT,
  color: "white",
};

/** Shared for all departments – from constants */
const SETTINGS_ITEMS = NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [];
const DEPARTMENTS_ITEM = NAVIGATION_CONFIG.DEPARTMENTS_ITEM ?? null;

function NavIcon({ icon: Icon, active }) {
  return (
    <div className={`${SIDEBAR_ICON_WRAPPER} shrink-0`} style={active ? ACTIVE_ICON_STYLE : undefined}>
      <Icon className={SIDEBAR_ICON_SIZE} />
    </div>
  );
}

/**
 * @param {{
 *   navConfig: {
 *     basePath: string;
 *     slug?: string;
 *     logoHref: string;
 *     logoSubtitle: string;
 *     mainMenuItems: Array<{ name: string; href: string; icon: string; adminOnly?: boolean; subItems?: Array<{ name: string; href: string }> }>;
 *   };
 * }} props
 */
const AppSidebar = ({ navConfig }) => {
  const { canAccess } = useAuth();
  const { viewingDepartment } = useSelectedDepartment();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});

  const {
    basePath,
    logoHref,
    mainMenuItems = [],
    logoSubtitle = "Office R.E.I",
  } = navConfig || {};

  const isActive = (path) => {
    if (!path) return false;
    const current = location.pathname;
    return current === path || current === path.replace(/\/$/, "") || path === current.replace(/\/$/, "");
  };
  const toggleExpanded = (name) => setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
  const showDepartments = DEPARTMENTS_ITEM && canAccess("admin");
  const departmentName = viewingDepartment?.name ?? null;

  const renderItem = (item) => {
    if (item.adminOnly && !canAccess("admin")) return null;
    const Icon = Icons.generic[item.icon] ?? Icons.generic.chart;
    const subItems = item.subItems ?? [];
    const hasSubItems = subItems.length > 0;
    const active = isActive(item.href) || subItems.some((s) => isActive(s.href));
    const linkClass = `${LINK_BASE} px-2 py-1.5 w-full text-left ${active ? LINK_ACTIVE : LINK_INACTIVE}`;

    if (hasSubItems) {
      const isExpanded = expandedItems[item.name] ?? subItems.some((s) => isActive(s.href));
      const ChevronIcon = isExpanded ? Icons.buttons.chevronUp : Icons.buttons.chevronDown;
      const submenuId = `sidebar-submenu-${item.name.replace(/\s+/g, "-").toLowerCase()}`;
      return (
        <div key={item.name} className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              navigate(item.href);
              toggleExpanded(item.name);
            }}
            className={linkClass}
            aria-expanded={isExpanded}
            aria-controls={submenuId}
          >
            <NavIcon icon={Icon} active={active} />
            <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
            <ChevronIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          </button>
          {isExpanded && (
            <div
              id={submenuId}
              className="ml-3 pl-1.5 border-l border-gray-200 dark:border-gray-600 space-y-0.5"
              role="region"
              aria-label={`${item.name} submenu`}
            >
              {subItems.map((subItem) => {
                const subActive = isActive(subItem.href);
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    className={`${LINK_BASE} px-2 py-1.5 ${subActive ? LINK_ACTIVE : LINK_INACTIVE}`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full shrink-0 ${subActive ? "bg-indigo-500" : "bg-gray-400 dark:bg-gray-500"}`}
                    />
                    <span className="text-[12px] font-medium truncate">{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return (
      <Link key={item.name} to={item.href} className={linkClass}>
        <NavIcon icon={Icon} active={active} />
        <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <nav
      className="flex h-full w-full flex-col bg-white dark:bg-smallCard"
      aria-label={basePath ? `${basePath.slice(1)} app navigation` : "App navigation"}
    >
      <div className="shrink-0 px-1.5 py-2 pt-4">
        <Link
          to={logoHref}
          className="flex items-center gap-2.5 rounded-lg py-1.5 -mx-1 px-1 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors"
        >
          <img src={logo} alt="" className="h-7 w-7 shrink-0 object-contain rounded" />
          <div className="min-w-0 flex flex-col">
            <span className="block truncate text-sm font-semibold tracking-tight text-app">XYNC</span>
            <span className="block truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 tracking-tight">
              {logoSubtitle}
            </span>
          </div>
        </Link>
      </div>

      {departmentName && (
        <div className="shrink-0 px-2.5 pt-4 pb-2">
          <div className="rounded-lg border-2 border-indigo-200 dark:border-indigo-700/60 bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Department
            </p>
            <p className="mt-0.5 text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">
              {departmentName}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {mainMenuItems.length > 0 && (
          <>
            <div className="px-2.5 pt-6 pb-1.5">
              <h5 className="text-app-subtle">Main Menu</h5>
            </div>
            <div className="overflow-y-auto px-1.5 py-1.5 space-y-0.5">
              {mainMenuItems.map((item) => renderItem(item))}
            </div>
          </>
        )}
        {showDepartments && (
          <>
            <div className="px-2.5 pt-4 pb-1.5">
              <h5 className="text-app-subtle">Departments</h5>
            </div>
            <div className="px-1.5 py-1.5 space-y-0.5">{renderItem(DEPARTMENTS_ITEM)}</div>
          </>
        )}
        <div className="px-2.5 pt-4 pb-1.5">
          <h5 className="text-app-subtle">Settings</h5>
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
          {SETTINGS_ITEMS.map((item) => renderItem(item))}
        </div>
      </div>
    </nav>
  );
};

export default AppSidebar;
