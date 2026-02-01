/**
 * Design department – sidebar. Uses shared DepartmentSidebar with design nav config.
 */
import React from "react";
import DepartmentSidebar from "../DepartmentSidebar";
import { designNavConfig } from "./navConfig";

const DesignSidebar = () => {
  return <DepartmentSidebar navConfig={designNavConfig} />;
};

export default DesignSidebar;
