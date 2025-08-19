import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  collection,
  query as fsQuery,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
            if (t.market) {
              if (!agg.markets[t.market]) agg.markets[t.market] = { count: 0, hours: 0 };
              agg.markets[t.market].count += 1;
              agg.markets[t.market].hours += Number(t.timeInHours) || 0;
            }
            if (t.product) {
              if (!agg.products[t.product]) agg.products[t.product] = { count: 0, hours: 0 };
              agg.products[t.product].count += 1;
              agg.products[t.product].hours += Number(t.timeInHours) || 0;
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
} = tasksApi;


