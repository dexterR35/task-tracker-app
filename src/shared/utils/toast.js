import { toast } from 'react-toastify';

// Toast configuration
export const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
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
  return showSuccess(`Welcome, ${userName}!`, { 
    autoClose: 3000,
    position: "top-center"
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
