import DynamicButton from '@/components/ui/Button/DynamicButton';

/**
 * Custom confirmation modal to replace window.confirm()
 * Provides a better UX with consistent styling and non-blocking behavior
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
 // Uses DynamicButton variants: "danger", "warning", "success", "primary", "secondary", "amber", "blue", "pink", "orange", "purple", "crimson", "edit"
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative card rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3">
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
      </div>
    </div>
  );
};

export default ConfirmationModal;
