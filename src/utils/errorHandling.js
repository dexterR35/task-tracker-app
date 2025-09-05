import { showError, showWarning, showInfo } from './toast';

/**
 * Error handling utilities for components
 * Use these to handle expected errors gracefully without global toasts
 */

// Handle expected errors in components (no global toast)
export const handleExpectedError = (error, fallbackMessage = 'Something went wrong') => {
  const errorCode = error?.code || error?.status;
  const errorMessage = error?.message || fallbackMessage;
  
  // Log for debugging
  console.warn(`[Component Error] ${errorCode}:`, errorMessage);
  
  // Return error info for component to handle
  return {
    code: errorCode,
    message: errorMessage,
    isNotFound: errorCode === 'NOT_FOUND',
    isValidationError: errorCode === 'VALIDATION_ERROR',
    isUserNotFound: errorCode === 'USER_NOT_FOUND',
  };
};

// Handle critical errors that need immediate user attention
export const handleCriticalError = (error, customMessage = null) => {
  const errorCode = error?.code || error?.status;
  const errorMessage = customMessage || error?.message || 'A critical error occurred';
  
  if (errorCode === 'PERMISSION_DENIED') {
    showWarning('You don\'t have permission to perform this action.');
  } else if (errorCode === 'SERVICE_UNAVAILABLE') {
    showWarning('Service temporarily unavailable. Please try again later.');
  } else if (errorCode === 'AUTH_REQUIRED') {
    showWarning('Please log in to continue.');
  } else {
    showError(errorMessage);
  }
};

// Handle expected errors with component-specific UI
export const getErrorDisplayInfo = (error) => {
  const errorCode = error?.code || error?.status;
  
  switch (errorCode) {
    case 'NOT_FOUND':
      return {
        title: 'Not Found',
        message: 'The requested resource was not found.',
        showRetry: false,
        variant: 'info'
      };
    
    case 'USER_NOT_FOUND':
      return {
        title: 'User Not Found',
        message: 'The requested user does not exist.',
        showRetry: false,
        variant: 'info'
      };
    
    case 'VALIDATION_ERROR':
      return {
        title: 'Validation Error',
        message: error?.message || 'Please check your input and try again.',
        showRetry: false,
        variant: 'warning'
      };
    
    case 'month-not-generated':
      return {
        title: 'Board Not Ready',
        message: 'Please generate a month board first.',
        showRetry: true,
        variant: 'info'
      };
    
    default:
      return {
        title: 'Error',
        message: error?.message || 'Something went wrong.',
        showRetry: true,
        variant: 'error'
      };
  }
};

// Example usage in a component:
/*
const MyComponent = () => {
  const { data, error, isLoading } = useGetUsersQuery();
  
  if (error) {
    const errorInfo = handleExpectedError(error);
    
    if (errorInfo.isNotFound) {
      return <EmptyState message="No users found" />;
    }
    
    if (errorInfo.isValidationError) {
      return <ValidationError message={errorInfo.message} />;
    }
    
    // For unexpected errors, show critical error handling
    handleCriticalError(error);
    return <ErrorState />;
  }
  
  return <UserList data={data} />;
};
*/
