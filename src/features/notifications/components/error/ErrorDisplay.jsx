

const ErrorDisplay = ({ error, errorKey, onRetry, onDismiss, className = '' }) => {
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
  const errorTitle = typeof error === 'object' ? error.title : null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 mb-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {errorTitle && (
            <h3 className="text-sm font-medium text-red-800 mb-1">
              {errorTitle}
            </h3>
          )}
          <div className="text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
          <div className="mt-4 flex space-x-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                className="bg-red-100 px-3 py-1 rounded text-sm text-red-800 hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="bg-red-100 px-3 py-1 rounded text-sm text-red-800 hover:bg-red-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export const useErrorHandler = () => {
  return {
    ErrorDisplay
  };
};

export default ErrorDisplay;
