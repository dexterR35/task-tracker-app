import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Panel from "@/components/ui/Panel";

/**
 * Custom confirmation modal to replace window.confirm()
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/70 dark:bg-gray-900/80 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <Panel className="relative max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <DynamicButton
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="sm"
          >
            {cancelText}
          </DynamicButton>
          <DynamicButton
            variant="danger"
            onClick={handleConfirm}
            loading={isLoading}
            size="sm"
          >
            {confirmText}
          </DynamicButton>
        </div>
      </Panel>
    </div>
  );
};

export default ConfirmationModal;
