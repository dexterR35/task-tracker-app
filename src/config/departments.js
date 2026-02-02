/**
 * Department configs for 2-apps-in-1 (Design, Food). Same auth; layout and redirect by slug.
 * Config: config/navConfig.js; component: DepartmentLayout.
 */
import DepartmentLayout from "@/components/layout/DepartmentLayout";
import { designNavConfig, foodNavConfig } from "./navConfig";

const design = {
  Layout: DepartmentLayout,
  basePath: designNavConfig.basePath,
  slug: designNavConfig.slug,
  loginRedirectPath: `${designNavConfig.basePath}/dashboard`,
  navConfig: designNavConfig,
};

const food = {
  Layout: DepartmentLayout,
  basePath: foodNavConfig.basePath,
  slug: foodNavConfig.slug,
  loginRedirectPath: `${foodNavConfig.basePath}/dashboard`,
  navConfig: foodNavConfig,
};

export const departmentsBySlug = {
  design,
  food,
};

/** Default redirect path after login for a given user (by department slug). Used by LoginPage. */
export function getLoginRedirectPathForUser(user) {
  const slug = user?.departmentSlug;
  if (!slug) return design.loginRedirectPath;
  const dept = departmentsBySlug[slug];
  return dept?.loginRedirectPath ?? design.loginRedirectPath;
}

export { design, food, designNavConfig, foodNavConfig };
export default departmentsBySlug;
