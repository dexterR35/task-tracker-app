import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  collection,
  fsQuery,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from '../../hooks/useImports';
import { db } from '../../firebase';

// Coerce Firestore timestamps and ensure numeric fields are numbers
const normalizeTask = (monthId, id, data) => {
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : data.createdAt || null;
  const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().getTime() : data.updatedAt || null;
  const timeInHours = Number(data.timeInHours) || 0;
  const timeSpentOnAI = Number(data.timeSpentOnAI) || 0;
  return { id, monthId, ...data, createdAt, updatedAt, timeInHours, timeSpentOnAI };
};

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['MonthTasks', 'MonthAnalytics', 'MonthBoard'],
  endpoints: (builder) => ({
    listAllAnalytics: builder.query({
      async queryFn() {
        try {
          const snap = await getDocs(collection(db, 'analytics'));
          const items = snap.docs.map(d => {
            const raw = d.data();
            const savedAt = raw.savedAt?.toDate ? raw.savedAt.toDate().getTime() : (typeof raw.savedAt === 'number' ? raw.savedAt : (raw.savedAt ? new Date(raw.savedAt).getTime() : null));
            // Spread raw first, then overwrite savedAt with normalized number to avoid Timestamp leaks
            return { id: d.id, monthId: raw.monthId || d.id, ...raw, savedAt };
          }).sort((a,b) => (b.savedAt || 0) - (a.savedAt || 0));
          return { data: items };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to load analytics list' } };
        }
      },
      providesTags: ['MonthAnalytics'],
    }),
    getMonthBoardExists: builder.query({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, 'tasks', monthId);
          const snap = await getDocFromServer(ref);
          return { data: { exists: snap.exists() } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to check month board' } };
        }
      },
      providesTags: (result, error, arg) => [{ type: 'MonthBoard', id: arg.monthId }],
    }),
    getMonthTasks: builder.query({
      async queryFn({ monthId }) {
        try {
          const colRef = collection(db, 'tasks', monthId, 'monthTasks');
          const snap = await getDocs(fsQuery(colRef, orderBy('createdAt', 'desc')));
          const tasks = snap.docs.map(d => normalizeTask(monthId, d.id, d.data()));
          return { data: tasks };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to load tasks' } };
        }
      },
      providesTags: (result, error, arg) => [{ type: 'MonthTasks', id: arg.monthId }],
    }),

    createTask: builder.mutation({
      async queryFn(task) {
        try {
          // Ensure month board exists
          const monthDocRef = doc(db, 'tasks', task.monthId);
          const monthDoc = await getDoc(monthDocRef);
          if (!monthDoc.exists()) {
            const err = new Error('MONTH_NOT_GENERATED');
            err.code = 'month-not-generated';
            throw err;
          }

          const colRef = collection(db, 'tasks', task.monthId, 'monthTasks');
          const payload = { ...task, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
          const ref = await addDoc(colRef, payload);
          // Read back the saved doc to resolve server timestamps to real values
          const savedSnap = await getDoc(ref);
          const created = normalizeTask(task.monthId, ref.id, savedSnap.data() || {});
          return { data: created };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to create task', code: error?.code } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthTasks', id: arg.monthId }],
    }),

    updateTask: builder.mutation({
      async queryFn({ monthId, id, updates }) {
        try {
          const ref = doc(db, 'tasks', monthId, 'monthTasks', id);
          await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
          return { data: { id, monthId, updates } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to update task' } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthTasks', id: arg.monthId }],
    }),

    deleteTask: builder.mutation({
      async queryFn({ monthId, id }) {
        try {
          const ref = doc(db, 'tasks', monthId, 'monthTasks', id);
          await deleteDoc(ref);
          return { data: { id, monthId } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to delete task' } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthTasks', id: arg.monthId }],
    }),

    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, meta = {} }) {
        try {
          await setDoc(doc(db, 'tasks', monthId), { monthId, createdAt: serverTimestamp(), ...meta }, { merge: true });
          return { data: { monthId } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to generate month board' } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthBoard', id: arg.monthId }],
    }),

    getMonthAnalytics: builder.query({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, 'analytics', monthId);
          const snap = await getDocFromServer(ref);
          if (!snap.exists()) return { data: null };
          const raw = snap.data();
          const savedAt = raw.savedAt?.toDate ? raw.savedAt.toDate().getTime() : (typeof raw.savedAt === 'number' ? raw.savedAt : (raw.savedAt ? new Date(raw.savedAt).getTime() : null));
          return { data: { ...raw, savedAt } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to load analytics' } };
        }
      },
      providesTags: (result, error, arg) => [{ type: 'MonthAnalytics', id: arg.monthId }],
    }),

    computeMonthAnalytics: builder.mutation({
      async queryFn({ monthId }) {
        try {
          const colRef = collection(db, 'tasks', monthId, 'monthTasks');
          const snap = await getDocs(fsQuery(colRef, orderBy('createdAt', 'desc')));
          const tasks = snap.docs.map(d => normalizeTask(monthId, d.id, d.data()));

          const agg = {
            totalTasks: 0,
            totalHours: 0,
            ai: { tasks: 0, hours: 0 },
            reworked: 0,
            byUser: {},
            markets: {},
            products: {},
            aiModels: {},
            deliverables: {},
            aiBreakdownByProduct: {}, // { product: { aiTasks, aiHours, nonAiTasks, nonAiHours, totalTasks, totalHours } }
            aiBreakdownByMarket: {},  // { market: { aiTasks, aiHours, nonAiTasks, nonAiHours, totalTasks, totalHours } }
            daily: {}, // { YYYY-MM-DD: { count, hours } }
          };

          for (const t of tasks) {
            agg.totalTasks += 1;
            agg.totalHours += Number(t.timeInHours) || 0;
            if (t.aiUsed) {
              agg.ai.tasks += 1;
              agg.ai.hours += Number(t.timeSpentOnAI) || 0;
            }
            if (t.reworked) agg.reworked += 1;
            if (t.userUID) {
              if (!agg.byUser[t.userUID]) agg.byUser[t.userUID] = { count: 0, hours: 0 };
              agg.byUser[t.userUID].count += 1;
              agg.byUser[t.userUID].hours += Number(t.timeInHours) || 0;
            }
            // daily
            const createdDay = (() => {
              const ms = t.createdAt || 0;
              if (!ms) return null;
              const d = new Date(ms);
              if (isNaN(d.getTime())) return null;
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${d.getFullYear()}-${m}-${day}`;
            })();
            if (createdDay) {
              if (!agg.daily[createdDay]) agg.daily[createdDay] = { count: 0, hours: 0 };
              agg.daily[createdDay].count += 1;
              agg.daily[createdDay].hours += Number(t.timeInHours) || 0;
            }
            const addCountHours = (map, key) => {
              if (!map[key]) map[key] = { count: 0, hours: 0 };
              map[key].count += 1;
              map[key].hours += Number(t.timeInHours) || 0;
            };
            if (Array.isArray(t.markets)) {
              t.markets.forEach((m) => addCountHours(agg.markets, m || 'N/A'));
            } else if (t.market) {
              addCountHours(agg.markets, t.market);
            }
            if (t.product) {
              if (!agg.products[t.product]) agg.products[t.product] = { count: 0, hours: 0 };
              agg.products[t.product].count += 1;
              agg.products[t.product].hours += Number(t.timeInHours) || 0;
            }
            // AI breakdown by product/market
            const ensureBreakdown = (map, key) => {
              if (!map[key]) map[key] = { aiTasks: 0, aiHours: 0, nonAiTasks: 0, nonAiHours: 0, totalTasks: 0, totalHours: 0 };
              return map[key];
            };
            const applyBreakdown = (entry, task) => {
              entry.totalTasks += 1;
              entry.totalHours += Number(task.timeInHours) || 0;
              if (task.aiUsed) {
                entry.aiTasks += 1;
                entry.aiHours += Number(task.timeSpentOnAI) || 0;
              } else {
                entry.nonAiTasks += 1;
                entry.nonAiHours += Number(task.timeInHours) || 0;
              }
            };
            if (t.product) {
              const e = ensureBreakdown(agg.aiBreakdownByProduct, t.product);
              applyBreakdown(e, t);
            }
            const marketsList = Array.isArray(t.markets) ? t.markets : (t.market ? [t.market] : []);
            marketsList.forEach((mk) => {
              const e = ensureBreakdown(agg.aiBreakdownByMarket, mk || 'N/A');
              applyBreakdown(e, t);
            });
            if (Array.isArray(t.aiModels)) {
              t.aiModels.forEach((m) => {
                const key = m || 'N/A';
                agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
              });
            } else if (t.aiModel) {
              const key = t.aiModel || 'N/A';
              agg.aiModels[key] = (agg.aiModels[key] || 0) + 1;
            }
            if (Array.isArray(t.deliverables)) {
              t.deliverables.forEach((d) => {
                const key = String(d || 'N/A');
                agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
              });
            } else if (t.deliverable) {
              const key = String(t.deliverable || 'N/A');
              agg.deliverables[key] = (agg.deliverables[key] || 0) + 1;
            }
          }

          const out = {
            monthId,
            generatedAt: new Date().toISOString(),
            ...agg,
          };

          return { data: out };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to compute analytics' } };
        }
      },
    }),

    saveMonthAnalytics: builder.mutation({
      async queryFn({ monthId, data, overwrite = false }) {
        try {
          const ref = doc(db, 'analytics', monthId);
          const snap = await getDocFromServer(ref);
          if (!overwrite && snap.exists()) {
            return { error: { code: 'ANALYTICS_EXISTS', message: 'Analytics for this month already exist' } };
          }
          await setDoc(ref, { ...data, savedAt: serverTimestamp() }, { merge: true });
          const fresh = await getDocFromServer(ref);
          const raw = fresh.data() || {};
          const savedAt = raw.savedAt?.toDate ? raw.savedAt.toDate().getTime() : (typeof raw.savedAt === 'number' ? raw.savedAt : (raw.savedAt ? new Date(raw.savedAt).getTime() : null));
          return { data: { ...raw, savedAt } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to save analytics' } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthAnalytics', id: arg.monthId }],
    }),

    deleteMonthAnalytics: builder.mutation({
      async queryFn({ monthId }) {
        try {
          const ref = doc(db, 'analytics', monthId);
          await deleteDoc(ref);
          return { data: { monthId, deleted: true } };
        } catch (error) {
          return { error: { message: error?.message || 'Failed to delete analytics' } };
        }
      },
      invalidatesTags: (result, error, arg) => [{ type: 'MonthAnalytics', id: arg.monthId }],
    }),
  }),
});

export const {
  useGetMonthTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetMonthBoardExistsQuery,
  useGenerateMonthBoardMutation,
  useGetMonthAnalyticsQuery,
  useComputeMonthAnalyticsMutation,
  useSaveMonthAnalyticsMutation,
  useListAllAnalyticsQuery,
  useDeleteMonthAnalyticsMutation,
} = tasksApi;


