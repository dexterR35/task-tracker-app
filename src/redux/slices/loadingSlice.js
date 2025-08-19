import { createSlice } from '@reduxjs/toolkit';

const loadingSlice = createSlice({
  name: 'loading',
  initialState: { count: 0 },
  reducers: {
    begin(state) { state.count += 1; },
    end(state) { state.count = Math.max(0, state.count - 1); },
    reset(state) { state.count = 0; },
  }
});

export const { begin: beginLoading, end: endLoading, reset: resetLoading } = loadingSlice.actions;
export default loadingSlice.reducer;


