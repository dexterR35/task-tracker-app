/**
 * Food department – sidebar. Uses shared DepartmentSidebar with food nav config.
 * Same structure as Design: Main Menu (with Overview subItem), Settings, optional Departments.
 */
import React from "react";
import DepartmentSidebar from "../DepartmentSidebar";
import { foodNavConfig } from "./navConfig";

const FoodSidebar = () => {
  return <DepartmentSidebar navConfig={foodNavConfig} />;
};

export default FoodSidebar;
