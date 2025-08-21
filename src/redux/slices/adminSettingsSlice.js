import { createSlice } from '@reduxjs/toolkit';

// Load settings from localStorage on initialization
const loadSettingsFromStorage = () => {
  try {
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        autoCreatedBoards: parsed.autoCreatedBoards ?? {},
        manuallyCreatedBoards: parsed.manuallyCreatedBoards ?? {}, // Track manually created boards: { monthId: { timestamp, boardId } }
        settings: parsed.settings ?? {}
      };
    }
  } catch (error) {
    console.error('Failed to load admin settings from localStorage:', error);
  }
  return {
    autoCreatedBoards: {}, // Track which boards were auto-created: { monthId: timestamp }
    manuallyCreatedBoards: {}, // Track manually created boards: { monthId: { timestamp, boardId } }
    settings: {
      // Future admin settings can be added here
    }
  };
};

const initialState = loadSettingsFromStorage();

const adminSettingsSlice = createSlice({
  name: 'adminSettings',
  initialState,
  reducers: {
    markBoardAsAutoCreated: (state, action) => {
      const monthId = action.payload;
      state.autoCreatedBoards[monthId] = Date.now();
    },
    markBoardAsManuallyCreated: (state, action) => {
      const { monthId, boardId } = action.payload;
      state.manuallyCreatedBoards[monthId] = {
        timestamp: Date.now(),
        boardId: boardId
      };
    },
    clearAutoCreatedBoards: (state) => {
      state.autoCreatedBoards = {};
    },
    clearManuallyCreatedBoards: (state) => {
      state.manuallyCreatedBoards = {};
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetSettings: (state) => {
      return initialState;
    }
  },
});

export const {
  markBoardAsAutoCreated,
  markBoardAsManuallyCreated,
  clearAutoCreatedBoards,
  clearManuallyCreatedBoards,
  updateSettings,
  resetSettings
} = adminSettingsSlice.actions;

// Selectors
export const selectAutoCreatedBoards = (state) => state.adminSettings.autoCreatedBoards;
export const selectManuallyCreatedBoards = (state) => state.adminSettings.manuallyCreatedBoards;
export const selectAdminSettings = (state) => state.adminSettings.settings;

export default adminSettingsSlice.reducer;
