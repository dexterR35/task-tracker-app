/**
 * Design department – task tracker (Dashboard, Analytics, Tasks).
 * Export layout, routes, and config so router can mount under /design.
 */
import Layout from "./Layout";
import Sidebar from "./Sidebar";
import { designRoutes } from "./routes.jsx";
import { designNavConfig } from "./navConfig";

export const basePath = designNavConfig.basePath;
export const slug = designNavConfig.slug;
export const loginRedirectPath = `${basePath}/dashboard`;

export { Layout, Sidebar, designRoutes as routes, designNavConfig };
export default { Layout, Sidebar, routes: designRoutes, basePath, slug, loginRedirectPath };
