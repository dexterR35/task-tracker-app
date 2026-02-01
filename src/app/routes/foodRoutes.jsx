/**
 * Food department child routes. Used by router.jsx under path "food".
 */
import React from "react";
import { Navigate } from "react-router-dom";
import DashboardPage from "@/pages/user/DashboardPage";
import FoodOrdersPage from "@/pages/food/FoodOrdersPage";
import FoodHistoryPage from "@/pages/food/FoodHistoryPage";
import ProfilePage from "@/pages/user/ProfilePage";
import NotFoundPage from "@/pages/statusPages/NotFoundPage";

export const foodRoutes = [
  { index: true, element: <Navigate to="/food/dashboard" replace /> },
  { path: "dashboard", element: <DashboardPage variant="food" /> },
  { path: "orders", element: <FoodOrdersPage /> },
  { path: "history", element: <FoodHistoryPage /> },
  { path: "profile", element: <ProfilePage /> },
  { path: "*", element: <NotFoundPage /> },
];
