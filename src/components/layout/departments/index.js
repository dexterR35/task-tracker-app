/**
 * Department configs for 2-apps-in-1 (Design, Food). Same auth; layout and redirect by slug.
 * Config: departments/navConfig.js; component: DepartmentLayout.jsx.
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

export { design, food, designNavConfig, foodNavConfig };
export default departmentsBySlug;
