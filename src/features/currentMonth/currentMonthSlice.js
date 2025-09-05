import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { logger } from '../../utils/logger';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { db, auth } from '../../app/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

// Helper function to get current month ID using date-fns
const getCurrentMonthId = () => {
  const now = new Date();
  return format(now, 'yyyy-MM'); // Format: 2025-08
};

// Helper function to validate month ID format
const isValidMonthId = (monthId) => {
  return monthId && 
         typeof monthId === 'string' && 
         /^\d{4}-\d{2}$/.test(monthId);
};

// Helper function to get month info using date-fns
const getMonthInfo = (date = new Date()) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return {
    monthId: format(date, 'yyyy-MM'),
    startDate: start.toISOString(), // Serialize to ISO string
    endDate: end.toISOString(), // Serialize to ISO string
    monthName: format(date, 'MMMM yyyy'),
    daysInMonth: end.getDate()
  };
};

// Async thunk to check if month board exists
export const checkMonthBoardExists = createAsyncThunk(
  'currentMonth/checkMonthBoardExists',
  async (monthId, { rejectWithValue }) => {
    try {
      if (!isValidMonthId(monthId)) {
        return rejectWithValue(`Invalid month ID format: ${monthId}`);
      }

      const monthDocRef = doc(db, "tasks", monthId);
      const monthDoc = await getDoc(monthDocRef);

      const exists = monthDoc.exists();
      logger.log(`[currentMonthSlice] Board check for ${monthId}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
      logger.log(`[currentMonthSlice] Board check result:`, { monthId, exists, lastChecked: Date.now() });
      
      return {
        monthId,
        exists,
        lastChecked: Date.now()
      };
    } catch (error) {
      logger.error(`[currentMonthSlice] Failed to check board for ${monthId}:`, error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to generate month board (admin only)
export const generateMonthBoard = createAsyncThunk(
  'currentMonth/generateMonthBoard',
  async ({ monthId, meta = {} }, { rejectWithValue, getState }) => {
    try {
      if (!isValidMonthId(monthId)) {
        return rejectWithValue(`Invalid month ID format: ${monthId}`);
      }

      // Check if user is authenticated
      if (!auth.currentUser) {
        return rejectWithValue("Authentication required");
      }

      // Get user role from Redux state (not from Firebase Auth)
      const state = getState();
      const userRole = state.auth.user?.role;
      
      // Validate user role exists and is valid
      if (!userRole || !['admin', 'user'].includes(userRole)) {
        logger.error(`[currentMonthSlice] Invalid user role: ${userRole}`);
        return rejectWithValue("Invalid user role. Please contact administrator.");
      }
      
      logger.log(`[currentMonthSlice] User role check:`, { 
        uid: auth.currentUser.uid, 
        role: userRole, 
        isAdmin: userRole === 'admin' 
      });
      
      if (userRole !== 'admin') {
        return rejectWithValue("Admin permissions required to generate month boards");
      }

      logger.log(`[currentMonthSlice] Starting month board generation for monthId: ${monthId} by admin: ${auth.currentUser.uid}`);

      // Check if board already exists
      const boardRef = doc(db, "tasks", monthId);
      const boardDoc = await getDoc(boardRef);

      if (boardDoc.exists()) {
        return rejectWithValue("Month board already exists");
      }

      // Create the board
      const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const boardData = {
        monthId,
        boardId,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
        createdByName: auth.currentUser?.displayName || auth.currentUser?.email,
        createdByRole: userRole,
        ...meta,
      };

      logger.log(`[currentMonthSlice] Creating month board with data:`, { monthId, boardId, createdBy: auth.currentUser?.uid });
      await setDoc(boardRef, boardData);

      return { monthId, boardId, exists: true };
    } catch (error) {
      logger.error(`[currentMonthSlice] Failed to generate board for ${monthId}:`, error);
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to initialize current month
export const initializeCurrentMonth = createAsyncThunk(
  'currentMonth/initializeCurrentMonth',
  async (_, { dispatch, getState }) => {
    const monthInfo = getMonthInfo();
    const currentState = getState();
    
    logger.log(`[currentMonthSlice] initializeCurrentMonth called with monthInfo:`, monthInfo);
    logger.log(`[currentMonthSlice] Current state:`, currentState.currentMonth);
    
    // Only skip if we already have valid month data for the current month AND board status is confirmed
    if (currentState.currentMonth.monthId === monthInfo.monthId && 
        currentState.currentMonth.monthName && 
        currentState.currentMonth.boardExists !== null &&
        currentState.currentMonth.lastChecked &&
        (Date.now() - currentState.currentMonth.lastChecked) < 30000) { // 30 seconds cache
      logger.log(`[currentMonthSlice] Month ${monthInfo.monthId} already initialized with recent board check, skipping`);
      return currentState.currentMonth;
    }
    
    logger.log(`[currentMonthSlice] Initializing current month: ${monthInfo.monthId}`);
    
    // Set up real-time board listener first - this will handle the initial check and ongoing updates
    logger.log(`[currentMonthSlice] Setting up real-time board listener for ${monthInfo.monthId}`);
    await dispatch(setupBoardListener(monthInfo.monthId)).unwrap();
    
    // Get the current state after listener is set up to get the real-time board status
    const updatedState = getState();
    const currentBoardExists = updatedState.currentMonth.boardExists;
    
    logger.log(`[currentMonthSlice] Real-time listener set up, current board status: ${currentBoardExists}`);
    
    return {
      monthId: monthInfo.monthId,
      monthName: monthInfo.monthName,
      startDate: monthInfo.startDate, // Already serialized as ISO string
      endDate: monthInfo.endDate, // Already serialized as ISO string
      daysInMonth: monthInfo.daysInMonth,
      boardExists: currentBoardExists,
      lastChecked: Date.now()
    };
  }
);

// Action to set up real-time board listener
export const setupBoardListener = createAsyncThunk(
  'currentMonth/setupBoardListener',
  async (monthId, { dispatch, getState }) => {
    try {
      // Clean up any existing listener for this month before setting up a new one
      if (window.boardListeners && window.boardListeners.has(monthId)) {
        logger.log(`[currentMonthSlice] Cleaning up existing listener for ${monthId}`);
        const existingUnsubscribe = window.boardListeners.get(monthId);
        existingUnsubscribe();
        window.boardListeners.delete(monthId);
      }
      
      const monthDocRef = doc(db, "tasks", monthId);
      
      // Do initial check to get current board status
      logger.log(`[currentMonthSlice] Doing initial board check for ${monthId}`);
      const initialDoc = await getDoc(monthDocRef);
      const initialExists = initialDoc.exists();
      
      // Update state with initial check result
      logger.log(`[currentMonthSlice] Initial board check result: ${initialExists ? 'EXISTS' : 'NOT FOUND'}`);
      dispatch(setBoardExists(initialExists));
      
      // Get current state to compare with real-time updates
      const currentState = getState();
      const currentBoardExists = currentState.currentMonth.boardExists;
      
      // Set up real-time listener for board status
      const unsubscribe = onSnapshot(
        monthDocRef,
        (doc) => {
          const currentExists = doc.exists();
          
          // Get current state again to check if we're in the middle of board generation
          const currentStateSnapshot = getState();
          const isGenerating = currentStateSnapshot.currentMonth.isGenerating;
          const currentStateBoardExists = currentStateSnapshot.currentMonth.boardExists;
          
          // Skip updates if we're generating a board (prevents duplicate updates)
          if (isGenerating) {
            logger.debug(`[currentMonthSlice] Skipping real-time update - board generation in progress`);
            return;
          }
          
          // Always dispatch real-time updates to ensure we catch deletions
          logger.log(`[currentMonthSlice] Real-time board update: ${currentStateBoardExists} -> ${currentExists} for ${monthId}`);
          logger.log(`[currentMonthSlice] Real-time listener payload:`, { monthId, currentExists, timestamp: Date.now() });
          
          // Force update the state regardless of current value
          if (currentStateBoardExists !== currentExists) {
            logger.log(`[currentMonthSlice] Board status changed: ${currentStateBoardExists} -> ${currentExists}, dispatching update`);
            dispatch(setBoardExists(currentExists));
          } else {
            logger.log(`[currentMonthSlice] Board status unchanged: ${currentExists}, but forcing update anyway`);
            dispatch(setBoardExists(currentExists));
          }
        },
        (error) => {
          logger.error(`[currentMonthSlice] Board listener error:`, error);
          // If there's an error, assume board doesn't exist
          logger.log(`[currentMonthSlice] Board listener error, setting boardExists to false`);
          dispatch(setBoardExists(false));
        }
      );
      
      logger.log(`[currentMonthSlice] Real-time board listener set up for ${monthId}`);
      
      // Store unsubscribe function in a global map for cleanup
      if (!window.boardListeners) {
        window.boardListeners = new Map();
      }
      window.boardListeners.set(monthId, unsubscribe);
      
      // Return only serializable data
      return { monthId, success: true };
    } catch (error) {
      logger.error(`[currentMonthSlice] Error setting up board listener:`, error);
      throw error;
    }
  }
);

const initialState = {
  monthId: null,
  monthName: null,
  startDate: null, // Will store ISO string
  endDate: null, // Will store ISO string
  daysInMonth: null,
  boardExists: false,
  isLoading: false,
  isGenerating: false, // Track board generation state
  error: null,
  lastChecked: null,
  lastUpdated: null
};

const currentMonthSlice = createSlice({
  name: 'currentMonth',
  initialState,
  reducers: {
    // Clear any errors
    clearError: (state) => {
      state.error = null;
    },
    
    // Force refresh board status
    refreshBoardStatus: (state) => {
      // state.isChecking = true; // Removed as per edit hint
      state.error = null;
    },
    
    // Set board exists (for when admin creates board)
    setBoardExists: (state, action) => {
      const newValue = action.payload;
      // Only update if the value actually changed
      if (state.boardExists !== newValue) {
        state.boardExists = newValue;
        state.lastUpdated = Date.now();
        logger.log(`[currentMonthSlice] Board status changed: ${state.boardExists} -> ${newValue}`);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize current month
      .addCase(initializeCurrentMonth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeCurrentMonth.fulfilled, (state, action) => {
        const { 
          monthId, 
          monthName, 
          startDate, 
          endDate, 
          daysInMonth,
          boardExists, 
          lastChecked
        } = action.payload;
        state.monthId = monthId;
        state.monthName = monthName;
        state.startDate = startDate; // ISO string
        state.endDate = endDate; // ISO string
        state.daysInMonth = daysInMonth;
        state.boardExists = boardExists;
        state.lastChecked = lastChecked;
        state.isLoading = false;
        state.lastUpdated = Date.now();
        logger.log(`[currentMonthSlice] Current month initialized: ${monthId} (${monthName}), board exists: ${boardExists}`);
      })
      .addCase(initializeCurrentMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
        logger.error(`[currentMonthSlice] Failed to initialize current month:`, action.error);
      })
      
      // Check month board exists
      .addCase(checkMonthBoardExists.pending, (state) => {
        // state.isChecking = true; // Removed as per edit hint
        state.error = null;
      })
      .addCase(checkMonthBoardExists.fulfilled, (state, action) => {
        const { monthId, exists, lastChecked } = action.payload;
        // Always update boardExists for the current month check
        state.boardExists = exists;
        state.lastChecked = lastChecked;
        logger.log(`[currentMonthSlice] Board check completed for ${monthId}: ${exists} (state updated)`);
      })
      .addCase(checkMonthBoardExists.rejected, (state, action) => {
        // state.isChecking = false; // Removed as per edit hint
        state.error = action.payload || action.error.message;
        logger.error(`[currentMonthSlice] Failed to check board:`, action.error);
      })
      
      // Generate month board
      .addCase(generateMonthBoard.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateMonthBoard.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.boardExists = true;
        state.lastUpdated = Date.now();
        state.error = null;
        logger.log('[currentMonthSlice] Board generated successfully:', action.payload);
      })
      .addCase(generateMonthBoard.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload || 'Failed to generate board';
        logger.error('[currentMonthSlice] Board generation failed:', action.payload);
      });
  },
});

// Clean up board listener
export const cleanupBoardListener = (monthId) => {
  if (window.boardListeners && window.boardListeners.has(monthId)) {
    const unsubscribe = window.boardListeners.get(monthId);
    unsubscribe();
    window.boardListeners.delete(monthId);
    logger.log(`[currentMonthSlice] Board listener cleaned up for ${monthId}`);
  }
};

export const { 
  clearError, 
  refreshBoardStatus, 
  setBoardExists
} = currentMonthSlice.actions;

// Base selectors for primitive values
const selectCurrentMonthState = (state) => state.currentMonth;

// Memoized selectors for Date objects
export const selectCurrentMonthId = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.monthId
);

export const selectCurrentMonthName = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.monthName
);

export const selectCurrentMonthStartDate = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.startDate ? new Date(currentMonth.startDate) : null
);

export const selectCurrentMonthEndDate = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.endDate ? new Date(currentMonth.endDate) : null
);

export const selectCurrentMonthDaysInMonth = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.daysInMonth
);

export const selectBoardExists = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.boardExists
);

export const selectCurrentMonthLoading = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.isLoading
);

export const selectCurrentMonthGenerating = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.isGenerating
);

export const selectCurrentMonthError = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.error
);

export const selectLastChecked = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.lastChecked
);

export const selectLastUpdated = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => currentMonth.lastUpdated
);

// Helper selector to get current month info - memoized
export const selectCurrentMonthInfo = createSelector(
  [selectCurrentMonthState],
  (currentMonth) => ({
    monthId: currentMonth.monthId,
    monthName: currentMonth.monthName,
    startDate: currentMonth.startDate ? new Date(currentMonth.startDate) : null,
    endDate: currentMonth.endDate ? new Date(currentMonth.endDate) : null,
    daysInMonth: currentMonth.daysInMonth,
    boardExists: currentMonth.boardExists,
    isLoading: currentMonth.isLoading,
    error: currentMonth.error
  })
);

// Export helper functions for use in other parts of the app
export { getCurrentMonthId, getMonthInfo, isValidMonthId };

export default currentMonthSlice.reducer;
