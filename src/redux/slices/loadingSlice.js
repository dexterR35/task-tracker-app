import { createSlice } from '@reduxjs/toolkit';

const loadingSlice = createSlice({
  name: 'loading',
  initialState: { count: 0 },
  reducers: {
    begin(state) { state.count++; },
    end(state) { state.count = Math.max(0, state.count - 1); },
    reset(state) { state.count = 0; },
    setCount(state, action) { state.count = action.payload; } // <-- new
  }
});

export const { begin: beginLoading, end: endLoading, reset: resetLoading, setCount: setLoadingCount } = loadingSlice.actions;
export default loadingSlice.reducer;