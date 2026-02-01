import React from "react";
import Panel from "@/components/ui/Panel";

const Modal = ({
  isOpen,
  onClose,
  title = "Modal",
  children,
  className = "",
  maxWidth = "max-w-4xl",
  showClose = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/70 dark:bg-gray-900/80 flex items-center justify-center z-50 p-4">
      <Panel className={`${maxWidth} w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`.trim()}>
        <div
          className={`flex items-center px-8 py-6 border-b border-gray-200/80 dark:border-gray-700/80 ${showClose ? "justify-between" : "justify-center"}`}
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors"
              aria-label="Close modal"
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
          )}
        </div>
        <div className="overflow-y-auto flex-1 px-8 py-6">
          {children}
        </div>
      </Panel>
    </div>
  );
};

export default Modal;
