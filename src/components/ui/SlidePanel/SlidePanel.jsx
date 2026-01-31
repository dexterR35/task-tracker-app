import React, { useEffect, useState } from "react";

/**
 * Slide-in panel from the right (aside/drawer).
 * Use for forms or secondary content that should feel like a sidebar.
 */
const SlidePanel = ({
  isOpen,
  onClose,
  title = "Panel",
  children,
  className = "",
  width = "max-w-md",
  bgColor = "primary",
  closeOnBackdropClick = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const bgClass = bgColor === "primary" ? "dark:bg-primary" : "dark:bg-smallCard";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop – optional close on click */}
      <div
        role="presentation"
        className="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/60 transition-opacity"
        {...(closeOnBackdropClick ? { onClick: onClose } : {})}
        aria-hidden
      />
      {/* Panel (aside) - slides in from right */}
      <aside
        className={`relative flex h-full w-full ${width} flex-col bg-white ${bgClass} shadow-xl transition-transform duration-300 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"} ${className}`}
        style={{ minWidth: "320px" }}
      >
        {/* Header */}
        <div
          className={`flex shrink-0 items-center justify-between border-b border-gray-200/80 dark:border-gray-700/80 px-6 py-4 bg-white ${bgClass}`}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Close panel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Content - scrollable */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden bg-white ${bgClass} px-6 py-4`}>
          {children}
        </div>
      </aside>
    </div>
  );
};

export default SlidePanel;
