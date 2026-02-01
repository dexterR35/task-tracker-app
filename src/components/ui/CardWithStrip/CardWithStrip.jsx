import React from "react";

/**
 * Reusable small-card layout: left strip + content.
 * Single source for the strip + content layout used by SmallCard, StatusPage, SkeletonCard.
 * Strip color: pass hex string, or omit for default gray (e.g. skeleton).
 *
 * @param {{
 *   stripColor?: string;
 *   children: React.ReactNode;
 *   className?: string;
 *   innerClassName?: string;
 *   stripAriaHidden?: boolean;
 * }} props
 */
const CARD_BASE =
  "relative flex flex-col bg-white dark:bg-smallCard overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 min-h-40";
const STRIP_BASE = "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg";
const INNER_BASE =
  "flex flex-col flex-1 min-h-0 px-4 py-4 relative min-h-[10rem]";

const CardWithStrip = ({
  stripColor,
  children,
  className = "",
  innerClassName = "",
  stripAriaHidden = false,
}) => {
  const stripStyle = stripColor ? { backgroundColor: stripColor } : undefined;
  const stripClass =
    STRIP_BASE + (stripColor ? "" : " bg-gray-200 dark:bg-gray-600");

  return (
    <div className={`${CARD_BASE} ${className}`.trim()}>
      <div
        className={stripClass}
        style={stripStyle}
        {...(stripAriaHidden ? { "aria-hidden": true } : {})}
      />
      <div className={`${INNER_BASE} ${innerClassName}`.trim()}>{children}</div>
    </div>
  );
};

export default CardWithStrip;
