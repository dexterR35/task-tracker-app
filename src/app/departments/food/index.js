/**
 * Food department – office food orders (Order board, Orders, History).
 * Export layout, routes, and config so router can mount under /food.
 */
import Layout from "./Layout";
import Sidebar from "./Sidebar";
import { foodRoutes } from "./routes.jsx";
import { foodNavConfig } from "./navConfig";

export const basePath = foodNavConfig.basePath;
export const slug = foodNavConfig.slug;
export const loginRedirectPath = `${basePath}/dashboard`;

export { Layout, Sidebar, foodRoutes as routes, foodNavConfig };
export default { Layout, Sidebar, routes: foodRoutes, basePath, slug, loginRedirectPath };
