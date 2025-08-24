import { createSlice } from '@reduxjs/toolkit';

const MAX_NOTIFICATIONS = 5;

const initialState = {
  items: [],
  config: {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    newestOnTop: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  }
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: 'info',
        autoClose: state.config.autoClose,
        ...action.payload
      };
      
      if (state.config.newestOnTop) {
        state.items.unshift(notification);
      } else {
        state.items.push(notification);
      }

      // Trim overflow
      if (state.items.length > MAX_NOTIFICATIONS) {
        state.items = state.config.newestOnTop
          ? state.items.slice(0, MAX_NOTIFICATIONS)
          : state.items.slice(-MAX_NOTIFICATIONS);
      }
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.items = [];
    },
    updateNotificationConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(item => item.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    }
  },
});

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  updateNotificationConfig,
  markAsRead
} = notificationSlice.actions;

export default notificationSlice.reducer;
