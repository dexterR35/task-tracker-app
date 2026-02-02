import React from "react";
import Loader from "@/components/ui/Loader/Loader";

/**
 * Full-screen app loading state. Reused for auth check, route guards, and data init.
 */
const AppLoader = ({ text = "Initializing application...", className = "" }) => (
  <div className={`min-h-screen flex-center bg-primary ${className}`.trim()}>
    <Loader size="lg" text={text} variant="spinner" />
  </div>
);

export default AppLoader;
