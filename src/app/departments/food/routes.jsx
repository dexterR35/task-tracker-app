/**
 * Food department – route config.
 * Same route names as Design: /dashboard (different content), /profile (same shared page).
 * All Food pages live in src/pages/food/ (next to admin, auth, etc.).
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProfilePage from "@/pages/ProfilePage";
import FoodDashboardPage from "@/pages/food/FoodDashboardPage";
import FoodOrdersPage from "@/pages/food/FoodOrdersPage";
import FoodHistoryPage from "@/pages/food/FoodHistoryPage";

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

/** Food route definitions. Dashboard = Food-specific content; Profile = shared ProfilePage. */
/** Dashboard = order board (with month selector). /order-board redirects to dashboard. */
export const foodRoutes = [
  { index: true, element: <Navigate to="/food/dashboard" replace /> },
  { path: "dashboard", element: <PageWrapper><FoodDashboardPage /></PageWrapper> },
  { path: "order-board", element: <Navigate to="/food/dashboard" replace /> },
  { path: "orders", element: <PageWrapper><FoodOrdersPage /></PageWrapper> },
  { path: "history", element: <PageWrapper><FoodHistoryPage /></PageWrapper> },
  { path: "profile", element: <PageWrapper><ProfilePage /></PageWrapper> },
];

export default foodRoutes;
