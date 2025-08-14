import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  sidebarOpen: false,
  modals: {},
  globalLoading: false,
  loading: {},
  errors: {},
  buttonStates: {},
  componentConfig: {
    buttons: {
      baseClasses: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
      variants: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      },
      sizes: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
      }
    }
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action) => {
      const { modalId, props = {} } = action.payload;
      state.modals[modalId] = { isOpen: true, props };
    },
    closeModal: (state, action) => {
      const modalId = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false;
      }
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    setLoading: (state, action) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
    setError: (state, action) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action) => {
      const key = action.payload;
      delete state.errors[key];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    setButtonState: (state, action) => {
      const { buttonId, state: buttonState } = action.payload;
      state.buttonStates[buttonId] = buttonState;
    },
    updateComponentConfig: (state, action) => {
      const { component, config } = action.payload;
      state.componentConfig[component] = {
        ...state.componentConfig[component],
        ...config
      };
    },
    resetUI: (state) => {
      state.modals = {};
      state.globalLoading = false;
      state.loading = {};
      state.errors = {};
      state.buttonStates = {};
    }
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setGlobalLoading,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  setButtonState,
  updateComponentConfig,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer;
