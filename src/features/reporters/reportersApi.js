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
  serverTimestamp,
} from "firebase/firestore";
import { logger } from "../../shared/utils/logger";
import { serializeTimestampsForRedux } from "../../shared/utils/dateUtils";

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
            const reporter = {
              id: doc.id,
              ...data,
            };
            // Use standardized timestamp serialization
            return serializeTimestampsForRedux(reporter);
          });
          logger.debug(`[Reporters API] Fetched ${reporters.length} reporters`);
          return { data: reporters };
        }
        break;

      case "POST":
        if (url === "reporters") {
          // First create the document to get the ID
          const docRef = await addDoc(collection(db, "reporters"), {
            ...body,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          // Then update the document to add the reporterUID field
          await updateDoc(docRef, {
            reporterUID: docRef.id,
            updatedAt: serverTimestamp(),
          });
          
          // Get the created document to return properly serialized data
          const createdDoc = await getDoc(docRef);
          const createdData = {
            id: docRef.id,
            reporterUID: docRef.id,
            ...body,
            ...createdDoc.data()
          };
          
          return { data: serializeTimestampsForRedux(createdData) };
        }
        break;

      case "PUT":
        if (url.startsWith("reporters/")) {
          const id = url.split("/")[1];
          await updateDoc(doc(db, "reporters", id), {
            ...body,
            updatedAt: serverTimestamp(),
          });
          // Get the updated document to return properly serialized data
          const updatedDoc = await getDoc(doc(db, "reporters", id));
          const updatedData = {
            id,
            ...body,
            ...updatedDoc.data()
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
      async onQueryStarted(reporter, { dispatch, queryFulfilled }) {
        const tempId = `temp-${Date.now()}`;
        const now = new Date().toISOString();
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            // Add the new reporter optimistically
            draft.unshift({
              id: tempId, // Temporary ID
              reporterUID: tempId, // Same temporary ID
              ...reporter,
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
      async onQueryStarted({ id, updates }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const reporter = draft.find(r => r.id === id);
            if (reporter) {
              Object.assign(reporter, updates, {
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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          reportersApi.util.updateQueryData("getReporters", {}, (draft) => {
            const index = draft.findIndex(reporter => reporter.id === id);
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
