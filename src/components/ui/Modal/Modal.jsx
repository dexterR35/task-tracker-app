import DynamicButton from '@/components/ui/Button/DynamicButton';


const Modal = ({ 
  isOpen, 
  onClose, 
  title = "Modal", 
  children, 
  className = "",
  maxWidth = "max-w-4xl",
  showClose = true
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-900  flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-smallCard rounded-lg shadow-xl ${maxWidth} w-full max-h-full overflow-y-auto ${className}`}>
        {/* Modal Header */}
        <div className={`flex items-center p-6 border-b border-gray-200 dark:border-gray-700 ${showClose ? 'justify-between' : 'justify-center'}`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {showClose && (
            <DynamicButton
              variant="outline"
              size="sm"
              onClick={onClose}
              iconName="close"
              iconPosition="left"
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Close
            </DynamicButton>
          )}
        </div>
        {/* Modal Content */}
        <div className=" bg-smallCard">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
