/**
 * Design department – nav config (task tracker: Dashboard, Analytics, Tasks).
 * Shared settings items imported from constants; main menu is design-specific.
 */

import { NAVIGATION_CONFIG } from "@/constants";

const BASE = "/design";

function prefix(href) {
  if (!href || href.startsWith("/settings")) return href;
  const path = href.startsWith("/") ? href.slice(1) : href;
  return `${BASE}/${path}`;
}

export const designNavConfig = {
  basePath: BASE,
  slug: "design",
  logoHref: `${BASE}/dashboard`,
  logoSubtitle: "Office R.E.I",
  /** Main menu with /design/ prefix */
  mainMenuItems: (NAVIGATION_CONFIG.MAIN_MENU_ITEMS ?? []).map((item) => ({
    ...item,
    href: prefix(item.href),
    subItems: (item.subItems ?? []).map((s) => ({ ...s, href: prefix(s.href) })),
  })),
  departmentsItem: NAVIGATION_CONFIG.DEPARTMENTS_ITEM,
  settingsItems: NAVIGATION_CONFIG.SETTINGS_ITEMS ?? [],
};

export default designNavConfig;
