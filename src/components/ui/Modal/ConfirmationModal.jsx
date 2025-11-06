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
  variant = "danger", // "danger", "warning", "info"
  isLoading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButton: 'danger',
          titleColor: 'text-red-error '
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'warning',
          titleColor: 'text-yellow-600 '
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmButton: 'primary',
          titleColor: 'text-blue-600 '
        };
      default:
        return {
          icon: '❓',
          confirmButton: 'primary',
          titleColor: 'text-gray-200 '
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{styles.icon}</span>
          <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
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
            variant={styles.confirmButton}
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
