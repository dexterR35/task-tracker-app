import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { selectUser } from "@/features/auth/authSlice";
import { canDeleteData, hasPermission, isUserAdmin } from "@/features/utils/authUtils";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
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
import { 
  withAuthentication,
  withApiErrorHandling,
  validateUserPermissions
} from "@/utils/apiUtils";

// Helper function to get settings document reference
const getSettingsRef = () => {
  return doc(db, "settings", "app");
};

// Helper function to get specific settings document reference
const getSettingsDocumentRef = (settingsType) => {
  return doc(db, "settings", "app", "data", settingsType);
};

// Helper function for consistent permission validation
const validateSettingsPermissions = (userData, operation) => {
  if (!userData) {
    return { isValid: false, errors: ['User data is required'] };
  }
  
  // Check specific permissions based on operation
  if (operation === 'update_settings_type' || operation === 'update_deliverables') {
    // For deliverables, only admin users can manage them
    if (userData.settingsType === 'deliverables' || operation.includes('deliverable')) {
      if (!isUserAdmin(userData)) {
        return { isValid: false, errors: ['Only admin users can manage deliverables'] };
      }
    } else {
      // For other settings, check delete_data permission
      if (!canDeleteData(userData)) {
        return { isValid: false, errors: ['You need \'delete_data\' permission to manage settings'] };
      }
    }
  } else {
    // Default to delete_data permission for other operations
    if (!canDeleteData(userData)) {
      return { isValid: false, errors: ['You need \'delete_data\' permission to manage settings'] };
    }
  }
  
  return { isValid: true, errors: [] };
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
        const cacheKey = `getSettings`;
        
        return await deduplicateRequest(cacheKey, async () => {
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
        }, 'SettingsAPI');
      },
      providesTags: [{ type: "Settings", id: "APP" }],
    }),

    // Update application settings
    updateSettings: builder.mutation({
      async queryFn({ settings, userData }) {
        const cacheKey = `updateSettings_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // SECURITY: Validate user permissions
            const permissionValidation = validateSettingsPermissions(userData, 'update_settings');
            if (!permissionValidation.isValid) {
              return { error: { message: permissionValidation.errors.join(', ') } };
            }

          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          const settingsRef = getSettingsRef();
          const settingsWithTimestamp = {
            ...settings,
            updatedAt: serverTimestamp(),
            updatedBy: userData.uid || userData.userUID,
            updatedByName: userData.name
          };

          await setDoc(settingsRef, settingsWithTimestamp, { merge: true });
          
          return { data: serializeTimestampsForRedux(settingsWithTimestamp) };
        } catch (error) {
          return withApiErrorHandling(() => { throw error; }, "Update Settings")(error);
        }
        }, 'SettingsAPI');
      },
      invalidatesTags: [{ type: "Settings", id: "APP" }],
    }),

    // Update deliverables settings
    updateDeliverables: builder.mutation({
      async queryFn({ deliverables, userData }) {
        const cacheKey = `updateDeliverables_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // SECURITY: Validate user permissions
            const permissionValidation = validateSettingsPermissions({ ...userData, settingsType: 'deliverables' }, 'update_deliverables');
            if (!permissionValidation.isValid) {
              return { error: { message: permissionValidation.errors.join(', ') } };
            }

          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Update deliverables in specific settings document
          const deliverablesRef = getSettingsDocumentRef("deliverables");
          const deliverablesData = {
            ...deliverables, // This now contains the structured object with deliverables array and metadata
            updatedAt: serverTimestamp(),
            updatedBy: userData.uid || userData.userUID,
            updatedByName: userData.name
          };

          await setDoc(deliverablesRef, deliverablesData, { merge: true });
          
          return { data: serializeTimestampsForRedux(deliverablesData) };
        } catch (error) {
          return withApiErrorHandling(() => { throw error; }, "Update Deliverables")(error);
        }
        }, 'SettingsAPI');
      },
      invalidatesTags: [
        { type: "Settings", id: "APP" },
        { type: "Settings", id: "DELIVERABLES" }
      ],
    }),

    // Generic settings mutation for any settings type
    updateSettingsType: builder.mutation({
      async queryFn({ settingsType, settingsData, userData }) {
        const cacheKey = `updateSettingsType_${settingsType}_${userData?.uid}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            // SECURITY: Validate user permissions
            console.log('User data for validation:', { ...userData, settingsType });
            console.log('Is user admin?', isUserAdmin(userData));
            const permissionValidation = validateSettingsPermissions({ ...userData, settingsType }, 'update_settings_type');
            if (!permissionValidation.isValid) {
              return { error: { message: permissionValidation.errors.join(', ') } };
            }

          if (!userData) {
            return { error: { message: "User data is required" } };
          }

          // Update specific settings document
          const settingsRef = getSettingsDocumentRef(settingsType);
          const updateData = {
            ...settingsData,
            updatedAt: serverTimestamp(),
            updatedBy: userData.uid || userData.userUID,
            updatedByName: userData.name
          };

          await setDoc(settingsRef, updateData, { merge: true });
          
          return { data: serializeTimestampsForRedux(updateData) };
        } catch (error) {
          return withApiErrorHandling(() => { throw error; }, `Update ${settingsType} Settings`)(error);
        }
        }, 'SettingsAPI');
      },
      invalidatesTags: (result, error, { settingsType }) => {
        console.log('Invalidating cache tags for settingsType:', settingsType);
        return [
          { type: "Settings", id: "APP" },
          ...(settingsType ? [{ type: "Settings", id: settingsType.toLowerCase() }] : []),
          { type: "Settings", id: "deliverables" } // Always invalidate deliverables
        ];
      },
    }),

    // Get specific settings type
    getSettingsType: builder.query({
      async queryFn({ settingsType }) {
        const cacheKey = `getSettingsType_${settingsType}`;
        
        return await deduplicateRequest(cacheKey, async () => {
          try {
            const settingsRef = getSettingsDocumentRef(settingsType);
            const settingsDoc = await getDoc(settingsRef);
          
          if (!settingsDoc.exists()) {
            return { data: null };
          }
          
          const settingsData = settingsDoc.data();
          
          // Sort deliverables if this is a deliverables query
          if (settingsType === 'deliverables' && settingsData.deliverables && Array.isArray(settingsData.deliverables)) {
            const sortedDeliverables = settingsData.deliverables.sort((a, b) => {
              // First sort by latest (most recent first)
              const dateA = new Date(a.updatedAt || a.createdAt || 0);
              const dateB = new Date(b.updatedAt || b.createdAt || 0);
              const dateComparison = dateB.getTime() - dateA.getTime();
              
              // If dates are equal or very close, sort alphabetically by name
              if (Math.abs(dateComparison) < 1000) { // Less than 1 second difference
                return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
              }
              
              return dateComparison;
            });
            
            settingsData.deliverables = sortedDeliverables;
          }
          
          return { data: serializeTimestampsForRedux(settingsData) };
        } catch (error) {
          logger.error(`[settingsApi] Error fetching ${settingsType} settings:`, error);
          return { error: { message: error.message } };
        }
        }, 'SettingsAPI');
      },
      providesTags: (result, error, { settingsType }) => {
        console.log('Providing cache tags for settingsType:', settingsType);
        return [
          ...(settingsType ? [{ type: "Settings", id: settingsType.toLowerCase() }] : []),
          { type: "Settings", id: "deliverables" } // Always provide deliverables tag
        ];
      },
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
