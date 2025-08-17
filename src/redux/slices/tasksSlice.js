import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';


export const fetchMonthTasks = createAsyncThunk(
  'tasks/fetchMonth',
  async ({ monthId }, { rejectWithValue }) => {
    try {
      const colRef = collection(db, 'tasks', monthId, 'monthTasks');
      const snap = await getDocs(query(colRef, orderBy('createdAt', 'desc')));
      const tasks = snap.docs.map(d => {
        const raw = d.data();
        const createdAt = raw.createdAt?.toDate ? raw.createdAt.toDate().getTime() : raw.createdAt || null;
        const updatedAt = raw.updatedAt?.toDate ? raw.updatedAt.toDate().getTime() : raw.updatedAt || null;
        return { id: d.id, monthId, ...raw, createdAt, updatedAt };
      });

      return { monthId, tasks, fromCache: false };
    } catch (e) {
      return rejectWithValue({ monthId, message: e.message || 'Failed to fetch tasks' });
    }
  }
);

export const fetchMonthTasksIfNeeded = ({ monthId, force }) => (dispatch, getState) => {
  const state = getState().tasks;
  if (state.fetchingMonths?.[monthId]) return null; // already fetching
  const st = state.months[monthId];
  if (force || !st) {
    return dispatch(fetchMonthTasks({ monthId }));
  }
  return null; // data exists, do nothing
};

// Generate month document (admin action)
export const generateMonth = async (monthId, meta = {}) => {
  await setDoc(doc(db, 'tasks', monthId), { monthId, createdAt: serverTimestamp(), ...meta }, { merge: true });
};

// Verify month document exists (no auto-create)
const verifyMonthExists = async (monthId) => {
  const ref = doc(db, 'tasks', monthId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const err = new Error('MONTH_NOT_GENERATED');
    err.code = 'month-not-generated';
    throw err;
  }
};

export const createTask = (task) => async (dispatch) => {
  // Verify month exists before optimistic add
  try {
    await verifyMonthExists(task.monthId);
  } catch (err) {
    // Surface error immediately
    throw err;
  }
  const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const optimisticTask = { ...task, id: tempId, optimistic: true, createdAt: Date.now(), updatedAt: Date.now() };
  console.log('[tasks] createTask:optimistic', { tempId, monthId: task.monthId });
  dispatch(slice.actions.taskAddedOptimistic(optimisticTask));
  try {
    const colRef = collection(db, 'tasks', task.monthId, 'monthTasks');
    const docData = { ...task, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const ref = await addDoc(colRef, docData);
    console.log('[tasks] createTask:reconciled', { tempId, realId: ref.id });
    dispatch(slice.actions.taskAddReconciled({ tempId, realId: ref.id, monthId: task.monthId }));
  } catch (e) {
    console.log('[tasks] createTask:failed', { tempId, error: e.message });
    dispatch(slice.actions.taskAddFailed({ tempId, monthId: task.monthId }));
    throw e;
  }
};

export const updateTask = (monthId, id, updates) => async (dispatch, getState) => {
  const st = getState().tasks.months[monthId];
  const prev = st?.byId[id];
  if (!prev) return;
  console.log('[tasks] updateTask:optimistic', { monthId, id, updates });
  dispatch(slice.actions.taskUpdatedOptimistic({ monthId, id, updates: { ...updates, updatedAt: Date.now() } }));
  try {
    const ref = doc(db, 'tasks', monthId, 'monthTasks', id);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    console.log('[tasks] updateTask:success', { monthId, id });
  } catch (e) {
    console.log('[tasks] updateTask:revert', { monthId, id, error: e.message });
    dispatch(slice.actions.taskUpdateRevert({ monthId, id, prev }));
    throw e;
  }
};

export const deleteTask = (monthId, id) => async (dispatch, getState) => {
  const st = getState().tasks.months[monthId];
  const prev = st?.byId[id];
  if (!prev) return;
  console.log('[tasks] deleteTask:optimistic', { monthId, id });
  dispatch(slice.actions.taskDeletedOptimistic({ monthId, id, backup: prev }));
  try {
    const ref = doc(db, 'tasks', monthId, 'monthTasks', id);
    await deleteDoc(ref);
    console.log('[tasks] deleteTask:success', { monthId, id });
  } catch (e) {
    console.log('[tasks] deleteTask:revert', { monthId, id, error: e.message });
    dispatch(slice.actions.taskDeleteRevert({ monthId }));
    throw e;
  }
};

const slice = createSlice({
  name: 'tasks',
  initialState: { months: {}, fetchingMonths: {} },
  reducers: {
    invalidateMonth(state, action) { const m = action.payload; if (state.months[m]) state.months[m].lastFetched = 0; },
    clearAllTasks(state) { state.months = {}; },
    taskAddedOptimistic: {
      reducer(state, action) {
        const t = action.payload;
        const monthId = t.monthId;
        if (!state.months[monthId]) {
          state.months[monthId] = { byId: {}, allIds: [], status: 'idle', error: null, lastFetched: Date.now(), paramsSignature: null, agg: null };
        }
        const st = state.months[monthId];
        if (!st.byId[t.id]) { st.allIds.unshift(t.id); }
        st.byId[t.id] = t;
      },
      prepare(task) { return { payload: task }; }
    },
    taskAddReconciled(state, action) {
      const { tempId, realId, monthId } = action.payload;
      const st = state.months[monthId];
      if (st && st.byId[tempId]) {
        st.byId[realId] = { ...st.byId[tempId], id: realId, optimistic: false };
        st.allIds = st.allIds.map(id => id === tempId ? realId : id);
        delete st.byId[tempId];
      }
    },
    taskAddFailed(state, action) {
      const { tempId, monthId } = action.payload;
      const st = state.months[monthId];
      if (st && st.byId[tempId]) {
        st.allIds = st.allIds.filter(id => id !== tempId);
        delete st.byId[tempId];
      }
    },
    taskUpdatedOptimistic(state, action) {
      const { monthId, id, updates } = action.payload;
      const st = state.months[monthId];
      if (st && st.byId[id]) {
        st.byId[id] = { ...st.byId[id], ...updates, _optimistic: true };
      }
    },
    taskUpdateRevert(state, action) {
      const { monthId, id, prev } = action.payload;
      const st = state.months[monthId];
      if (st) {
        st.byId[id] = prev;
      }
    },
    taskDeletedOptimistic(state, action) {
      const { monthId, id, backup } = action.payload;
      const st = state.months[monthId];
      if (st && st.byId[id]) {
        st.__lastDeleted = backup; // store for quick undo capability
        st.allIds = st.allIds.filter(tid => tid !== id);
        delete st.byId[id];
      }
    },
    taskDeleteRevert(state, action) {
      const { monthId } = action.payload;
      const st = state.months[monthId];
      const backup = st?.__lastDeleted;
      if (st && backup) {
        st.byId[backup.id] = backup;
        st.allIds.unshift(backup.id);
        delete st.__lastDeleted;
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMonthTasks.pending, (state, action) => {
        const { monthId } = action.meta.arg;
        state.fetchingMonths[monthId] = true;
        if (!state.months[monthId]) {
          state.months[monthId] = { byId: {}, allIds: [], status: 'loading', error: null, lastFetched: null, paramsSignature: null, agg: null };
        } else {
          state.months[monthId].status = state.months[monthId].status === 'succeeded' ? 'refreshing' : 'loading';
          state.months[monthId].error = null;
        }
      })
      .addCase(fetchMonthTasks.fulfilled, (state, action) => {
        const { monthId, tasks } = action.payload;
        delete state.fetchingMonths[monthId];
        const st = state.months[monthId];
        st.byId = {}; st.allIds = [];
        const byUser = {}; const markets = {}; const products = {};
        let totalHours = 0; let aiTasks = 0; let aiHours = 0; let reworked = 0;
        tasks.forEach(t => {
          // Coerce numeric fields
          const timeInHours = Number(t.timeInHours) || 0;
          const timeSpentOnAI = Number(t.timeSpentOnAI) || 0;
          st.byId[t.id] = { ...t, timeInHours, timeSpentOnAI };
          st.allIds.push(t.id);
          totalHours += timeInHours;
          if (t.aiUsed) { aiTasks++; aiHours += timeSpentOnAI; }
          if (t.reworked) reworked++;
          if (t.userUID) {
            if (!byUser[t.userUID]) byUser[t.userUID] = { count: 0, hours: 0 };
            byUser[t.userUID].count++;
            byUser[t.userUID].hours += timeInHours;
          }
          if (t.market) {
            if (!markets[t.market]) markets[t.market] = { count: 0, hours: 0 };
            markets[t.market].count++;
            markets[t.market].hours += timeInHours;
          }
          if (t.product) {
            if (!products[t.product]) products[t.product] = { count: 0, hours: 0 };
            products[t.product].count++;
            products[t.product].hours += timeInHours;
          }
        });
        st.status = 'succeeded'; st.error = null; st.lastFetched = Date.now();
        st.paramsSignature = 'ALL';
        st.agg = {
          totalTasks: st.allIds.length,
          totalHours,
          ai: { tasks: aiTasks, hours: aiHours },
          reworked,
          byUser,
          markets,
          products
        };
      })
      .addCase(fetchMonthTasks.rejected, (state, action) => {
        const { monthId, message } = action.payload || {};
        if (monthId) delete state.fetchingMonths[monthId];
        if (!state.months[monthId]) {
          state.months[monthId] = { byId: {}, allIds: [], status: 'failed', error: message || 'Error', lastFetched: null, paramsSignature: null, agg: null };
        } else {
          state.months[monthId].status = 'failed'; state.months[monthId].error = message || 'Error';
        }
      });
  }
});

export const { invalidateMonth, clearAllTasks, taskAddedOptimistic, taskAddReconciled, taskAddFailed, taskUpdatedOptimistic, taskUpdateRevert, taskDeletedOptimistic, taskDeleteRevert } = slice.actions;
export default slice.reducer;

// Selectors
const monthsRoot = s => s.tasks.months;

export const selectMonthTasksState = monthId => state => monthsRoot(state)[monthId];

export const selectMonthTasks = monthId => createSelector(selectMonthTasksState(monthId), st => st ? st.allIds.map(id => st.byId[id]) : []);

export const selectMonthAggregates = monthId => createSelector(selectMonthTasksState(monthId), st => st?.agg || { totalTasks: 0, totalHours: 0, ai: { tasks: 0, hours: 0 }, reworked: 0, byUser: {}, markets: {}, products: {} });

export const selectMonthTotalTasks = monthId => createSelector(selectMonthAggregates(monthId), agg => agg.totalTasks);

export const selectMonthTotalHours = monthId => createSelector(selectMonthAggregates(monthId), agg => agg.totalHours);

export const selectMonthMarketSummary = monthId => createSelector(selectMonthAggregates(monthId), agg => Object.entries(agg.markets).map(([market, v]) => ({ market, ...v })));

export const selectMonthProductSummary = monthId => createSelector(selectMonthAggregates(monthId), agg => Object.entries(agg.products).map(([product, v]) => ({ product, ...v })));

export const selectMonthAiSummary = monthId => createSelector(selectMonthAggregates(monthId), agg => agg.ai || { tasks: 0, hours: 0 });

export const selectMonthReworkedCount = monthId => createSelector(selectMonthAggregates(monthId), agg => agg.reworked || 0);

export const makeSelectTopMarkets = (monthId, n = 5) => createSelector(selectMonthMarketSummary(monthId), list => [...list].sort((a, b) => b.count - a.count).slice(0, n));

export const makeSelectTopProducts = (monthId, n = 5) => createSelector(selectMonthProductSummary(monthId), list => [...list].sort((a, b) => b.count - a.count).slice(0, n));
// Chart dataset selectors (labels + hours arrays limited to top N by hours)

export const selectMarketChartData = (monthId, top = 8) => createSelector(selectMonthAggregates(monthId), agg => {
  const arr = Object.entries(agg.markets || {}).map(([k, v]) => ({ key: k, hours: v.hours || 0, count: v.count || 0 })).sort((a, b) => b.hours - a.hours).slice(0, top);
  return { labels: arr.map(a => a.key), hours: arr.map(a => Math.round(a.hours * 10) / 10), counts: arr.map(a => a.count) };
});

export const selectProductChartData = (monthId, top = 8) => createSelector(selectMonthAggregates(monthId), agg => {
  const arr = Object.entries(agg.products || {}).map(([k, v]) => ({ key: k, hours: v.hours || 0, count: v.count || 0 })).sort((a, b) => b.hours - a.hours).slice(0, top);
  return { labels: arr.map(a => a.key), hours: arr.map(a => Math.round(a.hours * 10) / 10), counts: arr.map(a => a.count) };
});

export const makeSelectUserTasks = (monthId, userUID) => createSelector(selectMonthTasks(monthId), tasks => tasks.filter(t => t.userUID === userUID));

export const makeSelectUserSummary = (monthId, userUID) => createSelector(selectMonthAggregates(monthId), agg => {
  const u = agg.byUser[userUID];
  return u ? { userUID, ...u } : { userUID, count: 0, hours: 0 };
});
