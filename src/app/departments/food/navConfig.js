/**
 * Food department – nav config. Profile link removed from sidebar; Profile only in TopNavbar dropdown.
 * Main Menu: Dashboard, Orders, History (no Profile).
 */

import { NAVIGATION_CONFIG } from "@/constants";

const BASE = "/food";

export const foodNavConfig = {
  basePath: BASE,
  slug: "food",
  logoHref: `${BASE}/dashboard`,
  logoSubtitle: "Office R.E.I",
  /** Main menu: Dashboard, Orders, History. Profile only in user dropdown. */
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
  ],
  departmentsItem: NAVIGATION_CONFIG.DEPARTMENTS_ITEM,
  settingsItems: NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [],
};

export default foodNavConfig;
