import React from 'react';
import DynamicButton from '../Button/DynamicButton';

/**
 * Reusable Modal component for consistent modal behavior across the application
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal should be closed
 * @param {string} title - Modal title text
 * @param {React.ReactNode} children - Modal content
 * @param {string} maxWidth - Tailwind CSS max-width class (default: "max-w-4xl")
 * @param {string} className - Additional CSS classes for the modal container
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-4xl",
  className = ""
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white-dark text-white-dark rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto ${className}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <DynamicButton
            variant="outline"
            size="sm"
            onClick={onClose}
            iconName="close"
            iconPosition="center"
          />
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
