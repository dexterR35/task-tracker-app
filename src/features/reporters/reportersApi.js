import { createApi } from "@reduxjs/toolkit/query/react";
import { db } from "../../app/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
} from "firebase/firestore";

// Custom base query for Firestore
const firestoreBaseQuery = () => async ({ url, method, body }) => {
  try {
    switch (method) {
      case "GET":
        if (url === "reporters") {
          const querySnapshot = await getDocs(
            query(collection(db, "reporters"), orderBy("createdAt", "desc"))
          );
          const reporters = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Convert Firebase Timestamps to serializable format
              createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : null,
              updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : null,
            };
          });
          return { data: reporters };
        }
        break;

      case "POST":
        if (url === "reporters") {
          const docRef = await addDoc(collection(db, "reporters"), {
            ...body,
            createdAt: serverTimestamp(),
          });
          return { data: { id: docRef.id, ...body } };
        }
        break;

      case "PUT":
        if (url.startsWith("reporters/")) {
          const id = url.split("/")[1];
          await updateDoc(doc(db, "reporters", id), {
            ...body,
            updatedAt: serverTimestamp(),
          });
          return { data: { id, ...body } };
        }
        break;

      case "DELETE":
        if (url.startsWith("reporters/")) {
          const id = url.split("/")[1];
          await deleteDoc(doc(db, "reporters", id));
          return { data: { id } };
        }
        break;

      case "GET_TASKS_PER_REPORTER":
        try {
          const { monthId, userId } = body;
          console.log('[firestoreBaseQuery] Getting tasks per reporter with monthId:', monthId, 'userId:', userId);
          
          // Check if month board exists first
          const monthDocRef = doc(db, "tasks", monthId);
          const monthDoc = await getDoc(monthDocRef);
          
          if (!monthDoc.exists()) {
            console.log('[firestoreBaseQuery] Month board does not exist');
            return { data: {} };
          }
          
          // Get all tasks from the subcollection: /tasks/{monthId}/monthTasks
          const colRef = collection(db, "tasks", monthId, "monthTasks");
          let tasksQuery = query(colRef, orderBy("createdAt", "desc"));
          
          if (userId && userId.trim() !== '') {
            tasksQuery = query(colRef, where("userUID", "==", userId), orderBy("createdAt", "desc"));
          }
          
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          console.log('[firestoreBaseQuery] Found tasks:', tasks.length);
          console.log('[firestoreBaseQuery] Sample task:', tasks[0]);

          // Count tasks per reporter
          const reporterTaskCounts = {};
          
          tasks.forEach(task => {
            const reporterId = task.reporters;
            console.log('[firestoreBaseQuery] Task ID:', task.id, 'Reporter ID:', reporterId);
            if (reporterId && reporterId.trim() !== '') {
              if (!reporterTaskCounts[reporterId]) {
                reporterTaskCounts[reporterId] = 0;
              }
              reporterTaskCounts[reporterId] += 1;
              console.log('[firestoreBaseQuery] Updated count for reporter', reporterId, ':', reporterTaskCounts[reporterId]);
            }
          });

          console.log('[firestoreBaseQuery] Final reporter task counts:', reporterTaskCounts);
          return { data: reporterTaskCounts };
        } catch (error) {
          console.error('[firestoreBaseQuery] Error:', error);
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    return { error: { status: "CUSTOM_ERROR", error: error.message } };
  }
};

export const reportersApi = createApi({
  reducerPath: "reportersApi",
  baseQuery: firestoreBaseQuery(),
  tagTypes: ["Reporter"],
  endpoints: (builder) => ({
    // Get all reporters
    getReporters: builder.query({
      query: () => ({ url: "reporters", method: "GET" }),
      providesTags: ["Reporter"],
    }),

    // Subscribe to reporters in real-time
    subscribeToReporters: builder.query({
      queryFn: () => ({ data: [] }), // Placeholder
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        let unsubscribe;
        try {
          await cacheDataLoaded;

          const q = query(
            collection(db, "reporters"),
            orderBy("createdAt", "desc")
          );

          unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reporters = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // Convert Firebase Timestamps to serializable format
                createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : null,
              };
            });
            updateCachedData(() => reporters);
          });
        } catch (error) {
          console.error("Error subscribing to reporters:", error);
        }

        await cacheEntryRemoved;
        if (unsubscribe) {
          unsubscribe();
        }
      },
      providesTags: ["Reporter"],
    }),

    // Create reporter
    createReporter: builder.mutation({
      query: (reporter) => ({
        url: "reporters",
        method: "POST",
        body: reporter,
      }),
      invalidatesTags: ["Reporter"],
    }),

    // Update reporter
    updateReporter: builder.mutation({
      query: ({ id, updates }) => ({
        url: `reporters/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["Reporter"],
    }),

    // Delete reporter
    deleteReporter: builder.mutation({
      query: (id) => ({
        url: `reporters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reporter"],
    }),

    // Get tasks count per reporter
    getTasksPerReporter: builder.query({
      query: ({ monthId, userId = null }) => ({ 
        url: "tasks-per-reporter", 
        method: "GET_TASKS_PER_REPORTER",
        body: { monthId, userId }
      }),
      providesTags: ["Reporter"],
    }),
  }),
});

export const {
  useGetReportersQuery,
  useSubscribeToReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation,
  useGetTasksPerReporterQuery,
} = reportersApi;
