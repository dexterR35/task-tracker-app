/**
 * Shared settings layout – shows Design or Food sidebar based on user's department.
 * Routes: /settings/users, /settings/departments, /settings/ui-showcase (no department in path).
 * Uses layout from src/app/departments (design | food).
 */
import React from "react";
import { Outlet } from "react-router-dom";
import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import { departmentsBySlug } from "@/app/departments";

const SettingsLayout = () => {
  const { departmentSlug } = useDepartmentApp();
  const department = departmentsBySlug[departmentSlug];
  const Layout = department?.Layout ?? departmentsBySlug.design.Layout;
  return <Layout><Outlet /></Layout>;
};

export default SettingsLayout;
