const Modal = ({ 
  isOpen, 
  onClose, 
  title = "Modal", 
  children, 
  className = "",
  maxWidth = "max-w-4xl",
  showClose = true,
  bgColor = "smallCard" // 'smallCard' or 'primary'
}) => {
  if (!isOpen) return null;
  
  const bgClass = bgColor === 'primary' ? 'dark:bg-primary' : 'dark:bg-smallCard';
  
  return (
    <div className="fixed inset-0 bg-gray-900/70 dark:bg-gray-900/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-white ${bgClass} rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        {/* Modal Header */}
        <div className={`flex items-center px-8 py-6 border-b border-gray-200/80 dark:border-gray-700/80 bg-white ${bgClass} ${showClose ? 'justify-between' : 'justify-center'}`}>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          {showClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50"
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
        {/* Modal Content */}
        <div className={`overflow-y-auto flex-1 bg-white ${bgClass}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
