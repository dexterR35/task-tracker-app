import { createApi } from "@reduxjs/toolkit/query/react";
import { db } from "@/app/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { logger } from "@/utils/logger";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";


// Custom base query for Firestore
const firestoreBaseQuery = () => async ({ url, method, body }) => {
  try {
    switch (method) {
      case "GET":
        if (url === "reporters") {
          logger.log(`[Reporters API] Starting to fetch reporters...`);
          const querySnapshot = await getDocs(
            query(collection(db, "reporters"), orderBy("createdAt", "desc"))
          );
          logger.log(`[Reporters API] Query snapshot size: ${querySnapshot.docs.length}`);
          const reporters = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const reporter = {
              id: doc.id,
              ...data,
            };
            // Use standardized timestamp serialization
            return serializeTimestampsForRedux(reporter);
          });
          logger.log(`[Reporters API] Fetched ${reporters.length} reporters:`, reporters.map(r => ({ id: r.id, name: r.name })));
          return { data: reporters };
        }
        break;

      case "POST":
        if (url === "reporters") {
          // OPTIMIZATION: Single write operation instead of addDoc + updateDoc
          // Generate a new document ID and create the document in one operation
          const newDocRef = doc(collection(db, "reporters"));
          const reporterData = {
            ...body,
            reporterUID: newDocRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          await setDoc(newDocRef, reporterData);
          
          // OPTIMIZATION: Return data we just sent instead of re-fetching
          // The invalidatesTags will ensure cache consistency
          const createdData = {
            id: newDocRef.id,
            ...reporterData,
          };
          
          return { data: serializeTimestampsForRedux(createdData) };
        }
        break;

      case "PUT":
        if (url.startsWith("reporters/")) {
          const id = url.split("/")[1];
          const updateData = {
            ...body,
            updatedAt: serverTimestamp(),
          };
          
          await updateDoc(doc(db, "reporters", id), updateData);
          
          // OPTIMIZATION: Return data we just sent instead of re-fetching
          // The invalidatesTags will ensure cache consistency
          const updatedData = {
            id,
            ...body,
          };
          
          return { data: serializeTimestampsForRedux(updatedData) };
        }
        break;

      case "DELETE":
        if (url.startsWith("reporters/")) {
          const id = url.split("/")[1];
          await deleteDoc(doc(db, "reporters", id));
          return { data: { id } };
        }
        break;



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
      // Keep data forever and don't refetch unnecessarily
              keepUnusedDataFor: Infinity, // Never expire - Reporters never change once created
      // Don't refetch on window focus or reconnect
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }),



    // Create reporter
    createReporter: builder.mutation({
      query: (reporter) => ({
        url: "reporters",
        method: "POST",
        body: reporter,
      }),
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const tempId = `temp-${Date.now()}`;
            const now = new Date().toISOString();
            // Add the new reporter optimistically
            draft.unshift({
              id: tempId, // Temporary ID
              reporterUID: tempId, // Same temporary ID
              ...arg,
              createdAt: now,
              updatedAt: now,
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Update reporter
    updateReporter: builder.mutation({
      query: ({ id, updates }) => ({
        url: `reporters/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["Reporter"],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const reporter = draft.find(r => r.id === arg.id);
            if (reporter) {
              Object.assign(reporter, arg.updates, {
                updatedAt: new Date().toISOString(),
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Delete reporter
    deleteReporter: builder.mutation({
      query: (id) => ({
        url: `reporters/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Reporter"],
      // Optimistic update to remove from cache immediately
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const index = draft.findIndex(reporter => reporter.id === arg);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),


  }),
});

export const {
  useGetReportersQuery,
  useCreateReporterMutation,
  useUpdateReporterMutation,
  useDeleteReporterMutation,
} = reportersApi;
