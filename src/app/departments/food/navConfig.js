/**
 * Food department – nav config. Same structure as Design: Main Menu with subItems (Overview), Settings, optional Departments.
 * Only mainMenuItems content differs (Dashboard/Order board/Orders/History vs Design’s Dashboard/Analytics).
 */

import { NAVIGATION_CONFIG } from "@/constants";

const BASE = "/food";

export const foodNavConfig = {
  basePath: BASE,
  slug: "food",
  logoHref: `${BASE}/dashboard`,
  logoSubtitle: "Office R.E.I",
  /** Same shape as Design: Dashboard with Overview subItem; other items with optional subItems */
  /** Dashboard = order board (with month selector); no separate Order board link */
  mainMenuItems: [
    {
      name: "Dashboard",
      href: `${BASE}/dashboard`,
      icon: "home",
      color: "blue",
      subItems: [{ name: "Overview", href: `${BASE}/dashboard` }],
    },
    { name: "Orders", href: `${BASE}/orders`, icon: "chart", color: "blue" },
    { name: "History", href: `${BASE}/history`, icon: "clock", color: "gray" },
    { name: "Profile", href: `${BASE}/profile`, icon: "user", color: "gray" },
  ],
  departmentsItem: NAVIGATION_CONFIG.DEPARTMENTS_ITEM,
  settingsItems: NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [],
};

export default foodNavConfig;
