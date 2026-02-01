import React from "react";

/**
 * Shared panel/card surface for modals and dialogs.
 * Single source for rounded, shadow, bg so we don't duplicate Tailwind in Modal / ConfirmationModal.
 *
 * @param {{
 *   children: React.ReactNode;
 *   className?: string;
 *   as?: keyof JSX.IntrinsicElements;
 * }} props
 */
const Panel = ({
  children,
  className = "",
  as: Component = "div",
}) => (
  <Component
    className={`bg-white dark:bg-smallCard rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xl ${className}`.trim()}
  >
    {children}
  </Component>
);

export default Panel;
