import React from 'react';
import DynamicButton from '../Button/DynamicButton';


const Modal = ({ 
  isOpen, 
  onClose, 
  title = "Today is a good day", 
  children, 
  className = ""
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-primary flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center p-6 bg-gray-700">
          <h2>{title}</h2>
          <DynamicButton
            variant="primary"
            size="sm"
            onClick={onClose}
            iconName="cancel"
            iconPosition="center"
          />
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
