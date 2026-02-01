/**
 * Design department – route config.
 * Import shared pages from @/pages; use same data/context as needed.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import ComingSoonPage from "@/pages/ComingSoonPage";

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

/** Design route definitions (path + element). Router mounts these under /design. */
export const designRoutes = [
  { path: "dashboard", element: <PageWrapper key="dashboard"><AdminDashboardPage /></PageWrapper> },
  { path: "profile", element: <PageWrapper><ProfilePage /></PageWrapper> },
  { path: "reporters", element: <Navigate to="/design/dashboard" replace /> },
  { path: "time-tracking", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "deliverables", element: <Navigate to="/design/dashboard" replace /> },
  { path: "projects", element: <Navigate to="/design/dashboard" replace /> },
  { path: "analytics", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/marketing", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/acquisition", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/product", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/ai-usage", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/reporter-overview", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/by-users", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/misc", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "analytics/month-comparison", element: <PageWrapper><ComingSoonPage /></PageWrapper> },
  { path: "preview/:monthId", element: <ComingSoonPage /> },
  { path: "coming-soon", element: <ComingSoonPage /> },
];

export default designRoutes;
