import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import Avatar from "@/components/ui/Avatar/Avatar";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import { APP_CONFIG, CARD_SYSTEM, NAVIGATION_CONFIG } from "@/constants";
import logo from "@/assets/Logo4.webp";

const SIDEBAR_ICON_SIZE = "w-3.5 h-3.5";
const SIDEBAR_ICON_WRAPPER = "p-1.5 rounded-md";
const LINK_BASE =
  "group flex items-center gap-2.5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50";
const LINK_ACTIVE = "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-200";
const LINK_INACTIVE =
  "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200";
const ACTIVE_ICON_STYLE = {
  backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
  color: "white",
};

function NavIcon({ icon: Icon, active }) {
  return (
    <div
      className={`${SIDEBAR_ICON_WRAPPER} shrink-0`}
      style={active ? ACTIVE_ICON_STYLE : undefined}
    >
      <Icon className={SIDEBAR_ICON_SIZE} />
    </div>
  );
}

const Sidebar = () => {
  const { logout, clearError, canAccess, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      clearError();
    }
  };

  const isActive = (path) => location.pathname === path;
  const toggleExpanded = (name) =>
    setExpandedItems((prev) => ({ ...prev, [name]: !prev[name] }));
  const items = NAVIGATION_CONFIG.ITEMS;
  const accountItems = NAVIGATION_CONFIG.ACCOUNT_ITEMS ?? [];

  return (
    <nav className="flex h-full w-full flex-col bg-white dark:bg-primary" aria-label="Main navigation">
      {/* Top: Logo + app name + office */}
      <div className="shrink-0 px-1.5 py-2 pt-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 rounded-lg py-1.5 -mx-1 px-1 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors"
        >
          <img
            src={logo}
            alt=""
            className="h-7 w-7 shrink-0 object-contain rounded"
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold tracking-tight text-app">
              {APP_CONFIG.NAME}
            </span>
            <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-app-muted mt-0.5">
              Office: R.E.I
            </span>
          </div>
        </Link>
      </div>

      {/* Main Menu + Links */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-2.5 pt-6 pb-1.5">
          <h5 className="text-app-subtle">
            Main Menu
          </h5>
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
          {items.map((item) => {
            if (item.adminOnly && !canAccess("admin")) return null;

            const Icon = Icons.generic[item.icon];
            const subItems = item.subItems ?? [];
            const hasSubItems = subItems.length > 0;
            const active = isActive(item.href) || subItems.some((s) => isActive(s.href));
            const linkClass = `${LINK_BASE} px-2 py-1.5 w-full text-left ${active ? LINK_ACTIVE : LINK_INACTIVE}`;

            if (hasSubItems) {
              const isExpanded =
                expandedItems[item.name] ?? subItems.some((s) => isActive(s.href));
              const ChevronIcon = isExpanded
                ? Icons.buttons.chevronUp
                : Icons.buttons.chevronDown;
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
                    <span className="flex-1 text-sm font-medium truncate">
                      {item.name}
                    </span>
                    <ChevronIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  </button>
                  {isExpanded && (
                    <div id={submenuId} className="ml-3 pl-1.5 border-l border-gray-200 dark:border-gray-600 space-y-0.5" role="region" aria-label={`${item.name} submenu`}>
                      {subItems.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`${LINK_BASE} px-2 py-1.5 ${subActive ? LINK_ACTIVE : LINK_INACTIVE}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              subActive ? "bg-indigo-500" : "bg-gray-400 dark:bg-gray-500"
                            }`}
                          />
                          <span className="text-[12px] font-medium truncate">
                            {subItem.name}
                          </span>
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
          })}
        </div>
      </div>

      {/* Bottom: Account + avatar + Account settings + Sign out */}
      <div className="shrink-0 border-t border-gray-200/80 dark:border-gray-700/60 space-y-1.5 p-2 pt-3 pb-4">
        <h5 className="text-app-subtle px-2.5">
          Account
        </h5>
        {user ? (
          <Link
            to="/profile"
            className={`flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/20 px-1.5 py-2 w-full transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-700/40 ${isActive("/profile") ? "ring-1 ring-indigo-500/30 dark:ring-indigo-400/30" : ""}`}
            title="Account settings"
          >
            <Avatar
              user={user}
              size="xs"
              showName={false}
              showEmail={false}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-app truncate">
                {user.name || "User"}
              </p>
              <p className="text-[10px] text-app-muted truncate">
                {user.email || ""}
              </p>
            </div>
            <Icons.buttons.chevronRight className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
          </Link>
        ) : null}
        {accountItems.map((item) => {
          if (item.adminOnly && !canAccess("admin")) return null;
          const Icon = Icons.generic[item.icon];
          const subItems = item.subItems ?? [];
          const hasSubItems = subItems.length > 0;
          const active = isActive(item.href) || subItems.some((s) => isActive(s.href));
          const linkClass = `${LINK_BASE} px-2 py-1.5 w-full text-left ${active ? LINK_ACTIVE : LINK_INACTIVE}`;

          if (hasSubItems) {
            const isExpanded =
              expandedItems[item.name] ?? subItems.some((s) => isActive(s.href));
            const ChevronIcon = isExpanded
              ? Icons.buttons.chevronUp
              : Icons.buttons.chevronDown;
            return (
              <div key={item.name} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(item.name)}
                  className={linkClass}
                  aria-expanded={isExpanded}
                >
                  <NavIcon icon={Icon} active={active} />
                  <span className="flex-1 text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <ChevronIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                </button>
                {isExpanded && (
                  <div className="ml-3 pl-1.5 border-l border-gray-200 dark:border-gray-600 space-y-0.5">
                    {subItems.map((subItem) => {
                      const subActive = isActive(subItem.href);
                      return (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`${LINK_BASE} px-2 py-1.5 ${subActive ? LINK_ACTIVE : LINK_INACTIVE}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full shrink-0 ${
                              subActive ? "bg-indigo-500" : "bg-gray-400 dark:bg-gray-500"
                            }`}
                          />
                          <span className="text-[12px] font-medium truncate">
                            {subItem.name}
                          </span>
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
        })}
        <div className="flex flex-col gap-0.5 px-0.5 pt-0.5">
          <DynamicButton
            variant="secondary"
            size="xs"
            icon={Icons.buttons.logout}
            iconPosition="left"
            onClick={handleLogout}
            className="w-full justify-start !bg-gray-50 dark:!bg-gray-800/20 !py-1.5 hover:!bg-gray-100 dark:hover:!bg-gray-700/40"
          >
            Sign out
          </DynamicButton>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
