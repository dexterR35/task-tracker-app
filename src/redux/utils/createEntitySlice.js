import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Generic entity slice with async fetch functionality.
 */
export function createEntitySlice({ entityName, fetchFn, extraReducers = {} }) {
  const fetchEntity = createAsyncThunk(
    `${entityName}/fetch${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`,
    async ({ userId, lastSync, lastDoc } = {}, { rejectWithValue }) => {
      try {
        if (!navigator.onLine) {
          return { data: [], lastDoc: null, hasMore: false };
        }

        const { data: fetchedData, lastDoc: newLastDoc, hasMore } = await fetchFn(entityName, userId, lastSync || '1970-01-01T00:00:00Z', 50, lastDoc);

        const sortedData = fetchedData.sort((a, b) => {
          const aDate = a.createdAt || a.updatedAt || '';
          const bDate = b.createdAt || b.updatedAt || '';
          return bDate.localeCompare(aDate);
        });

        return {
          data: sortedData,
          lastDoc: newLastDoc,
          hasMore,
        };
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );

  const initialState = {
    data: [],
    lastDoc: null,
    hasMore: true,
    loading: false,
    error: null,
  };

  const slice = createSlice({
    name: entityName,
    initialState,
    reducers: {
      clearError(state) {
        state.error = null;
      },
      reset(state) {
        state.data = [];
        state.lastDoc = null;
        state.hasMore = true;
        state.loading = false;
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchEntity.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchEntity.fulfilled, (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.lastDoc = action.payload.lastDoc;
          state.hasMore = action.payload.hasMore;
        })
        .addCase(fetchEntity.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        });

      Object.entries(extraReducers).forEach(([action, reducer]) => {
        builder.addCase(action, reducer);
      });
    },
  });

  return { slice, fetchEntity };
}
