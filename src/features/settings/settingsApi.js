import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { getCurrentUserInfo } from "@/features/auth/authSlice";
import { canDeleteData } from "@/features/utils/authUtils";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { handleApiError } from "@/features/utils/errorHandling";

// Helper function to get settings document reference
const getSettingsRef = () => {
  return doc(db, "settings", "app");
};

// Helper function to get specific settings document reference
const getSettingsDocumentRef = (settingsType) => {
  return doc(db, "settings", "app", "data", settingsType);
};

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Settings"],
  ...getCacheConfigByType("SETTINGS"),
  endpoints: (builder) => ({
    // Get application settings
    getSettings: builder.query({
      async queryFn() {
        try {
          const settingsRef = getSettingsRef();
          const settingsDoc = await getDoc(settingsRef);
          
          // Fetch deliverables from specific settings document
          const deliverablesRef = getSettingsDocumentRef("deliverables");
          const deliverablesDoc = await getDoc(deliverablesRef);
          
          let deliverables = [];
          if (deliverablesDoc.exists()) {
            const deliverablesData = deliverablesDoc.data();
            // Handle both old array format and new structured format
            if (deliverablesData.deliverables && Array.isArray(deliverablesData.deliverables)) {
              deliverables = deliverablesData.deliverables;
            } else if (Array.isArray(deliverablesData)) {
              // Handle old format where deliverables was stored as array directly
              deliverables = deliverablesData;
            }
          }
          
          if (!settingsDoc.exists()) {
            // Return default settings if document doesn't exist
            const defaultSettings = {
              deliverables: deliverables.length > 0 ? deliverables : [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            return { data: serializeTimestampsForRedux(defaultSettings) };
          }
          
          const settingsData = settingsDoc.data();
          // Add deliverables from subcollection
          settingsData.deliverables = deliverables;
          
          return { data: serializeTimestampsForRedux(settingsData) };
        } catch (error) {
          logger.error('[settingsApi] Error fetching settings:', error);
          return { error: { message: error.message } };
        }
      },
      providesTags: [{ type: "Settings", id: "APP" }],
    }),

    // Update application settings
    updateSettings: builder.mutation({
      async queryFn({ settings, userData }) {
        try {
          // SECURITY: Validate user permissions
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user has permission to manage settings
          if (!canDeleteData(userData)) {
            return { error: { message: "You need 'delete_data' permission to manage settings" } };
          }

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "User not authenticated" } };
          }

          const settingsRef = getSettingsRef();
          const settingsWithTimestamp = {
            ...settings,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.uid,
            updatedByName: userData.name
          };

          await setDoc(settingsRef, settingsWithTimestamp, { merge: true });
          
          logger.log('[settingsApi] Settings updated successfully');
          return { data: serializeTimestampsForRedux(settingsWithTimestamp) };
        } catch (error) {
          const errorResponse = handleApiError(error, "Update Settings", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: [{ type: "Settings", id: "APP" }],
    }),

    // Update deliverables settings
    updateDeliverables: builder.mutation({
      async queryFn({ deliverables, userData }) {
        try {
          // SECURITY: Validate user permissions
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user has permission to manage deliverables
          if (!canDeleteData(userData)) {
            return { error: { message: "You need 'delete_data' permission to manage deliverables" } };
          }

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "User not authenticated" } };
          }

          // Update deliverables in specific settings document
          const deliverablesRef = getSettingsDocumentRef("deliverables");
          const deliverablesData = {
            ...deliverables, // This now contains the structured object with deliverables array and metadata
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.uid,
            updatedByName: userData.name
          };

          await setDoc(deliverablesRef, deliverablesData, { merge: true });
          
          logger.log('[settingsApi] Deliverables updated successfully');
          return { data: serializeTimestampsForRedux(deliverablesData) };
        } catch (error) {
          const errorResponse = handleApiError(error, "Update Deliverables", {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: [
        { type: "Settings", id: "APP" },
        { type: "Settings", id: "DELIVERABLES" }
      ],
    }),

    // Generic settings mutation for any settings type
    updateSettingsType: builder.mutation({
      async queryFn({ settingsType, settingsData, userData }) {
        try {
          // SECURITY: Validate user permissions
          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Check if user has permission to manage settings
          if (!canDeleteData(userData)) {
            return { error: { message: "You need 'delete_data' permission to manage settings" } };
          }

          const currentUser = getCurrentUserInfo();
          if (!currentUser) {
            return { error: { message: "User not authenticated" } };
          }

          // Update specific settings document
          const settingsRef = getSettingsDocumentRef(settingsType);
          const updateData = {
            ...settingsData,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.uid,
            updatedByName: userData.name
          };

          await setDoc(settingsRef, updateData, { merge: true });
          
          logger.log(`[settingsApi] ${settingsType} settings updated successfully`);
          return { data: serializeTimestampsForRedux(updateData) };
        } catch (error) {
          const errorResponse = handleApiError(error, `Update ${settingsType} Settings`, {
            showToast: false,
            logError: true,
          });
          return { error: errorResponse };
        }
      },
      invalidatesTags: (result, error, { settingsType }) => [
        { type: "Settings", id: "APP" },
        { type: "Settings", id: settingsType.toLowerCase() }
      ],
    }),

    // Get specific settings type
    getSettingsType: builder.query({
      async queryFn({ settingsType }) {
        try {
          const settingsRef = getSettingsDocumentRef(settingsType);
          const settingsDoc = await getDoc(settingsRef);
          
          if (!settingsDoc.exists()) {
            return { data: null };
          }
          
          const settingsData = settingsDoc.data();
          return { data: serializeTimestampsForRedux(settingsData) };
        } catch (error) {
          logger.error(`[settingsApi] Error fetching ${settingsType} settings:`, error);
          return { error: { message: error.message } };
        }
      },
      providesTags: (result, error, { settingsType }) => [
        { type: "Settings", id: settingsType.toLowerCase() }
      ],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUpdateDeliverablesMutation,
  useUpdateSettingsTypeMutation,
  useGetSettingsTypeQuery,
} = settingsApi;
