import React from "react";
import { CARD_SYSTEM } from "@/constants";

// Reusable Badge Component
const Badge = ({
  children,
  variant = "default",
  color,
  colorHex,
  size = "sm",
  className = "",
  ...props
}) => {
  // Size variants
  const sizeClasses = {
    xs: "px-2 py-0.5 text-[12px] font-semibold",
    sm: "px-2 py-0.5 text-[12px] font-semibold",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-xs",
  };

  const baseClasses = "inline-flex items-center font-semibold rounded-md ";
  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  // Get colorHex from variant prop, fallback to gray from constants
  const finalColorHex = CARD_SYSTEM.COLOR_HEX_MAP[variant] || CARD_SYSTEM.COLOR_HEX_MAP.gray;

  const badgeStyle = {
    backgroundColor: `${finalColorHex}30`,
    color: finalColorHex,
    border: `1px solid ${finalColorHex}90`,
    fontWeight: "600",
  };

  return (
    <span
      className={`${baseClasses} ${sizeClass} ${className}`}
      style={badgeStyle}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
