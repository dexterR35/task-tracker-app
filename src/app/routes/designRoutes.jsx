/**
 * Design department child routes. Used by router.jsx under path "design".
 */
import React from "react";
import { Navigate } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import NotFoundPage from "@/pages/errorPages/NotFoundPage";

export const designRoutes = [
  { path: "dashboard", element: <DashboardPage variant="design" /> },
  { path: "profile", element: <ProfilePage /> },
  { path: "reporters", element: <Navigate to="/design/dashboard" replace /> },
  { path: "time-tracking", element: <ComingSoonPage /> },
  { path: "deliverables", element: <Navigate to="/design/dashboard" replace /> },
  { path: "projects", element: <Navigate to="/design/dashboard" replace /> },
  { path: "analytics", element: <ComingSoonPage /> },
  { path: "analytics/marketing", element: <ComingSoonPage /> },
  { path: "analytics/acquisition", element: <ComingSoonPage /> },
  { path: "analytics/product", element: <ComingSoonPage /> },
  { path: "analytics/ai-usage", element: <ComingSoonPage /> },
  { path: "analytics/reporter-overview", element: <ComingSoonPage /> },
  { path: "analytics/by-users", element: <ComingSoonPage /> },
  { path: "analytics/misc", element: <ComingSoonPage /> },
  { path: "analytics/month-comparison", element: <ComingSoonPage /> },
  { path: "preview/:monthId", element: <ComingSoonPage /> },
  { path: "coming-soon", element: <ComingSoonPage /> },
  { path: "*", element: <NotFoundPage /> },
];
