import React from 'react';
import toast from 'react-hot-toast';
import CustomToastCard from '@/components/ui/Toast/CustomToastCard';

// Toast options (react-hot-toast uses duration, position; see https://react-hot-toast.com/docs)
const defaultOptions = {
  position: 'top-center',
  duration: 3000,
};

// Generic toast by type
export const showToast = ({ type = 'info', title, message, duration = 3000, ...options } = {}) => {
  const toastMessage = title ? `${title}: ${message}` : message;
  const opts = { ...defaultOptions, duration, ...options };

  switch (type.toLowerCase()) {
    case 'success':
      return toast.success(toastMessage, opts);
    case 'error':
      return toast.error(toastMessage, opts);
    case 'warning':
      return toast(toastMessage, { ...opts, icon: '⚠️' });
    case 'info':
    default:
      return toast(toastMessage, opts);
  }
};

export const showSuccess = (message, options = {}) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

export const showError = (message, options = {}) => {
  return toast.error(message, { ...defaultOptions, ...options });
};

export const showWarning = (message, options = {}) => {
  return toast(message, { ...defaultOptions, icon: '⚠️', ...options });
};

export const showInfo = (message, options = {}) => {
  return toast(message, { ...defaultOptions, ...options });
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, { ...defaultOptions, ...options });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
};

// Auth-specific
export const showAuthSuccess = (message) => {
  return showSuccess(message, { duration: 3000 });
};

export const showAuthError = (message) => {
  return showError(message, { duration: 5000 });
};

export const showWelcomeMessage = (userName) => {
  return showSuccess(`Welcome, ${userName}! 👋`, {
    duration: 3000,
    position: 'top-center',
  });
};

export const showLogoutSuccess = () => {
  return showSuccess('Successfully logged out', { duration: 2000 });
};

export const showReauthSuccess = () => {
  return showSuccess('Reauthentication successful', { duration: 3000 });
};

export const showReauthError = (message) => {
  return showError(message || 'Reauthentication failed', { duration: 5000 });
};

// Operation helpers
export const showOperationSuccess = (operation, resource = 'item') => {
  return showSuccess(`${operation} ${resource} successfully!`, { duration: 3000 });
};

export const showOperationError = (operation, resource = 'item', error = '') => {
  const message = error || `Failed to ${operation} ${resource}. Please try again.`;
  return showError(message, { duration: 5000 });
};

export const showValidationError = (errors) => {
  const message = `Validation failed: ${Object.keys(errors).join(', ')}`;
  return showError(message, { duration: 4000 });
};

export const showPermissionError = (action, resource = 'resource') => {
  return showAuthError(`You do not have permission to ${action} ${resource}`);
};

export const showNetworkError = () => {
  return showError('Network error: Please check your connection and try again', {
    duration: 6000,
  });
};

export const showLoadingToast = (message = 'Loading...') => {
  return showLoading(message, { duration: Infinity });
};

// Custom card toast (avatar + name + message + Close button). Auto-closes after 5s; user can close earlier.
export const showCustomToast = (
  { name = 'Notification', message = '', avatarSrc, closeLabel, accentClass } = {},
  options = {}
) => {
  return toast.custom(
    (t) =>
      React.createElement(CustomToastCard, {
        t,
        name,
        message,
        avatarSrc,
        closeLabel,
        accentClass,
      }),
    { duration: 3500, ...options }
  );
};

// Export for components that need Toaster default options (optional)
export const toastConfig = defaultOptions;
