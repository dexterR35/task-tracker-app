/**
 * Department nav config (data only). Used by DepartmentLayout and config/departments.
 * Add a new department: add nav config here and register in config/departments.js.
 */
import { NAVIGATION_CONFIG } from "@/constants";

const DESIGN_BASE = "/design";
const FOOD_BASE = "/food";

function prefixDesign(href) {
  if (!href || href.startsWith("/settings")) return href;
  const path = href.startsWith("/") ? href.slice(1) : href;
  return `${DESIGN_BASE}/${path}`;
}

export const designNavConfig = {
  basePath: DESIGN_BASE,
  slug: "design",
  logoHref: `${DESIGN_BASE}/dashboard`,
  logoSubtitle: "Office R.E.I",
  mainMenuItems: (NAVIGATION_CONFIG.MAIN_MENU_ITEMS ?? []).map((item) => ({
    ...item,
    href: prefixDesign(item.href),
    subItems: (item.subItems ?? []).map((s) => ({ ...s, href: prefixDesign(s.href) })),
  })),
};

export const foodNavConfig = {
  basePath: FOOD_BASE,
  slug: "food",
  logoHref: `${FOOD_BASE}/dashboard`,
  logoSubtitle: "Office R.E.I",
  mainMenuItems: NAVIGATION_CONFIG.FOOD_MENU_ITEMS ?? [],
};

export const NAV_CONFIG_BY_PATH = {
  design: designNavConfig,
  food: foodNavConfig,
};
