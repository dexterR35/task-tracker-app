import React from 'react';
import DynamicButton from '../Button/DynamicButton';


const Modal = ({ 
  isOpen, 
  onClose, 
  title = "Modal", 
  children, 
  className = "",
  maxWidth = "max-w-4xl"
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${maxWidth} w-full max-h-full overflow-y-auto ${className}`}>
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={onClose}
            iconName="close"
            iconPosition="center"
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          />
        </div>
        {/* Modal Content */}
        <div className="bg-white dark:bg-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
