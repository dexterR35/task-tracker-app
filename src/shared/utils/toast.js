import { toast } from 'react-toastify';

// Toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: false, // Don't pause on hover
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Generic toast function that accepts an object with type, title, message, and duration
export const showToast = ({ type = 'info', title, message, duration = 3000, ...options } = {}) => {
  const toastMessage = title ? `${title}: ${message}` : message;
  
  switch (type.toLowerCase()) {
    case 'success':
      return toast.success(toastMessage, { ...toastConfig, autoClose: duration, ...options });
    case 'error':
      return toast.error(toastMessage, { ...toastConfig, autoClose: duration, ...options });
    case 'warning':
      return toast.warning(toastMessage, { ...toastConfig, autoClose: duration, ...options });
    case 'info':
    default:
      return toast.info(toastMessage, { ...toastConfig, autoClose: duration, ...options });
  }
};

// Toast types
export const showSuccess = (message, options = {}) => {
  return toast.success(message, { ...toastConfig, ...options });
};

export const showError = (message, options = {}) => {
  return toast.error(message, { ...toastConfig, ...options });
};

export const showWarning = (message, options = {}) => {
  return toast.warning(message, { ...toastConfig, ...options });
};

export const showInfo = (message, options = {}) => {
  return toast.info(message, { ...toastConfig, ...options });
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, { ...toastConfig, ...options });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
};

// Auth-specific toast helpers
export const showAuthSuccess = (message) => {
  return showSuccess(message, { autoClose: 3000 });
};

export const showAuthError = (message) => {
  return showError(message, { autoClose: 5000 });
};

export const showWelcomeMessage = (userName) => {
  const message = `Welcome, ${userName}! 👋`;
  
  return showSuccess(message, { 
    autoClose: 3000, // Longer duration for welcome message
    position: "top-center",
    pauseOnHover: false // Ensure it doesn't pause
  });
};

export const showLogoutSuccess = () => {
  return showSuccess("Successfully logged out", { autoClose: 2000 });
};

export const showReauthSuccess = () => {
  return showSuccess("Reauthentication successful", { autoClose: 3000 });
};

export const showReauthError = (message) => {
  return showError(message || "Reauthentication failed", { autoClose: 5000 });
};
