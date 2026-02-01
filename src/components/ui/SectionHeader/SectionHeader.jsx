/**
 * Reusable section header: label + decorative line. Optional actions (e.g. buttons) on the right.
 * Use instead of repeating the same flex + span markup across dashboard and list pages.
 */
import React from "react";

const SECTION_LINE_CLASS =
  "h-px flex-1 max-w-[2rem] bg-gray-200 dark:bg-gray-600 rounded-full shrink-0";
const LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";

const SectionHeader = ({ label, children, className = "", asTitle = false }) => {
  const Wrapper = asTitle ? "h2" : "div";
  return (
    <Wrapper
      className={
        children
          ? `flex flex-wrap items-center justify-between gap-3 mb-3 ${className}`.trim()
          : `flex items-center gap-2 mb-3 ${className}`.trim()
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={LABEL_CLASS}>{label}</span>
        <span className={SECTION_LINE_CLASS} aria-hidden />
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </Wrapper>
  );
};

export default SectionHeader;
