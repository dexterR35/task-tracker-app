/**
 * Month API - Dedicated API for month-related operations
 * Handles month board management, month selection, and month data
 */

import { createApi } from "@reduxjs/toolkit/query/react";
import { fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  query, 
  orderBy,
  limit,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import { serializeTimestampsForRedux } from "@/utils/dateUtils";
import { validateUserPermissions } from "@/features/utils/authUtils";
import { getCurrentUserInfo } from "@/features/auth/authSlice";
import { getCacheConfigByType } from "@/features/utils/cacheConfig";
import { deduplicateRequest } from "@/features/utils/requestDeduplication";
import listenerManager from "@/features/utils/firebaseListenerManager";

import {
  formatMonth,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  getCurrentYear,
  parseMonthId,
} from "@/utils/dateUtils";
import {
  getMonthInfo,
} from "@/utils/monthUtils.jsx";
import { isUserAdmin, canAccessTasks, isUserActive } from "@/features/utils/authUtils";

// ============================================================================
// FIRESTORE REFERENCE HELPERS
// ============================================================================

/**
 * Get month document reference
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {DocumentReference} Month document reference
 */
const getMonthRef = (monthId) => {
  const yearId = monthId.split('-')[0]; // Extract year from monthId (e.g., "2025" from "2025-09")
  return doc(db, "departments", "design", yearId, monthId); // Month document
};

/**
 * Get months collection reference
 * @param {string} yearId - Year ID (defaults to current year)
 * @returns {CollectionReference} Months collection reference
 */
const getMonthsRef = (yearId = null) => {
  const targetYear = yearId || getCurrentYear();
  return collection(db, "departments", "design", targetYear);
};

// ============================================================================
// CACHE TAGS
// ============================================================================

const getMonthCacheTags = (monthId) => [
  { type: "CurrentMonth", id: "ENHANCED" },
  { type: "MonthBoards", id: monthId },
  { type: "AvailableMonths", id: "LIST" },
  { type: "MonthBoards", id: "LIST" },
];

// ============================================================================
// MONTH API
// ============================================================================

export const monthsApi = createApi({
  reducerPath: "monthsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["MonthBoards", "CurrentMonth", "AvailableMonths"],
  ...getCacheConfigByType("MONTHS"),
  endpoints: (builder) => ({
    
    // ========================================================================
    // GET CURRENT MONTH
    // ========================================================================
    
    /**
     * Enhanced getCurrentMonth - Fetches only current month data (optimized)
     */
    getCurrentMonth: builder.query({
      async queryFn({ userUID, role, userData }) {
        try {
          let currentMonthInfo = getMonthInfo(); // Default to actual current month
          let boardExists = false;
          let currentMonthBoard = null;

          // Get available months from the current year (2025) under departments/design
          const yearId = getCurrentYear(); // This will be the current year
          const monthsRef = getMonthsRef(yearId);
          const monthsSnapshot = await getDocs(monthsRef);

          if (!monthsSnapshot.empty) {
            // Find the current month in the available months
            const currentMonthDoc = monthsSnapshot.docs.find(
              (doc) => doc.id === currentMonthInfo.monthId
            );

            if (currentMonthDoc) {
              boardExists = true;
              currentMonthBoard = currentMonthDoc.data();
              
              // Update currentMonthInfo with board data if available
              currentMonthInfo = {
                ...currentMonthInfo,
                boardId: currentMonthBoard.boardId,
                createdAt: currentMonthBoard.createdAt,
                createdBy: currentMonthBoard.createdBy,
                createdByName: currentMonthBoard.createdByName,
                createdByRole: currentMonthBoard.createdByRole,
              };
            }
          }

          // Return the current month data
          const result = {
            currentMonth: serializeTimestampsForRedux(currentMonthInfo),
            boardExists,
            currentMonthBoard: currentMonthBoard ? serializeTimestampsForRedux(currentMonthBoard) : null,
          };

          return { data: result };
        } catch (error) {
          logger.error("[getCurrentMonth] Error:", error);
          return { error: { message: error.message } };
        }
      },
      providesTags: () => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "MonthBoards", id: "LIST" },
      ],
    }),

    // ========================================================================
    // GET AVAILABLE MONTHS
    // ========================================================================
    
    /**
     * Get available months (on-demand for dropdown)
     */
    getAvailableMonths: builder.query({
      async queryFn() {
        try {
          const currentMonthInfo = getMonthInfo();
          const availableMonths = [];

          // Get months from the current year under departments/design
          const yearId = getCurrentYear(); // This will be the current year
          const monthsRef = getMonthsRef(yearId);
          const monthsSnapshot = await getDocs(monthsRef);

          if (!monthsSnapshot.empty) {
            monthsSnapshot.docs.forEach((doc) => {
              const monthData = doc.data();
              const monthId = doc.id;
              
              // Parse month ID to get readable month name using month utilities
              const monthDate = parseMonthId(monthId);
              const monthName = monthDate ? formatMonth(monthId) : `${monthId} (Invalid)`;
              
              availableMonths.push({
                monthId,
                monthName,
                boardId: monthData.boardId,
                createdAt: monthData.createdAt,
                createdBy: monthData.createdBy,
                createdByName: monthData.createdByName,
                createdByRole: monthData.createdByRole,
                isCurrent: monthId === currentMonthInfo.monthId,
              });
            });
          }

          // Sort by month ID (newest first)
          availableMonths.sort((a, b) => b.monthId.localeCompare(a.monthId));

          // Serialize timestamps for Redux store
          const serializedMonths = serializeTimestampsForRedux(availableMonths);

          return { data: serializedMonths };
        } catch (error) {
          logger.error("[getAvailableMonths] Error:", error);
          return { error: { message: error.message } };
        }
      },
      providesTags: () => [
        { type: "AvailableMonths", id: "LIST" },
        { type: "MonthBoards", id: "LIST" },
      ],
    }),

    // ========================================================================
    // GENERATE MONTH BOARD
    // ========================================================================
    
    /**
     * Generate month board (admin only)
     */
    generateMonthBoard: builder.mutation({
      async queryFn({ monthId, startDate, endDate, daysInMonth, meta = {}, userData }) {
        try {
          // SECURITY: Validate user permissions at API level
          const permissionValidation = validateUserPermissions(userData, 'create_board');
          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const currentUser = getCurrentUserInfo();
          const boardRef = getMonthRef(monthId);
          const boardDoc = await getDoc(boardRef);
          
          if (boardDoc.exists()) {
            // Board already exists, return success with existing data
            return { 
              data: serializeTimestampsForRedux({
                monthId,
                boardId: boardDoc.data().boardId,
                exists: true,
                createdAt: boardDoc.data().createdAt,
                createdBy: boardDoc.data().createdBy,
                createdByName: boardDoc.data().createdByName,
                createdByRole: boardDoc.data().createdByRole,
              })
            };
          }

          const yearId = getCurrentYear();
          const boardId = `${monthId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const monthMetadata = {
            monthId,
            boardId,
            yearId,
            startDate,
            endDate,
            daysInMonth,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || currentUser.email,
            createdByRole: currentUser.role || 'admin',
            ...meta,
          };

          await setDoc(getMonthRef(monthId), monthMetadata);

          logger.info(`Month board created successfully for ${monthId}`, {
            monthId,
            boardId,
            createdBy: currentUser.uid,
          });

          return { 
            data: serializeTimestampsForRedux({
              monthId,
              boardId,
              exists: false,
              ...monthMetadata,
            })
          };
        } catch (error) {
          logger.error(`[generateMonthBoard] Error creating month board for ${monthId}:`, error);
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { monthId }) => [
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "MonthBoards", id: monthId },
        { type: "AvailableMonths", id: "LIST" },
        { type: "MonthBoards", id: "LIST" },
      ],
    }),

    // ========================================================================
    // GET MONTH BOARD INFO
    // ========================================================================
    
    /**
     * Get specific month board information
     */
    getMonthBoard: builder.query({
      async queryFn({ monthId }) {
        try {
          if (!monthId) {
            return { error: { message: "Month ID is required" } };
          }

          const boardRef = getMonthRef(monthId);
          const boardDoc = await getDoc(boardRef);

          if (!boardDoc.exists()) {
            return { data: null };
          }

          const boardData = boardDoc.data();
          return { 
            data: serializeTimestampsForRedux({
              monthId,
              ...boardData,
            })
          };
        } catch (error) {
          logger.error(`[getMonthBoard] Error fetching month board for ${monthId}:`, error);
          return { error: { message: error.message } };
        }
      },
      providesTags: (result, error, { monthId }) => [
        { type: "MonthBoards", id: monthId },
      ],
    }),

    // ========================================================================
    // UPDATE MONTH BOARD
    // ========================================================================
    
    /**
     * Update month board metadata
     */
    updateMonthBoard: builder.mutation({
      async queryFn({ monthId, updates, userData }) {
        try {
          // SECURITY: Validate user permissions
          const permissionValidation = validateUserPermissions(userData, 'update_board');
          if (!permissionValidation.isValid) {
            return { error: { message: permissionValidation.errors.join(', ') } };
          }

          const boardRef = getMonthRef(monthId);
          const boardDoc = await getDoc(boardRef);

          if (!boardDoc.exists()) {
            return { error: { message: "Month board not found" } };
          }

          const updatesWithTimestamp = {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: getCurrentUserInfo().uid,
          };

          await updateDoc(boardRef, updatesWithTimestamp);

          logger.info(`Month board updated successfully for ${monthId}`, {
            monthId,
            updates,
            updatedBy: getCurrentUserInfo().uid,
          });

          return { 
            data: serializeTimestampsForRedux({
              monthId,
              ...updatesWithTimestamp,
            })
          };
        } catch (error) {
          logger.error(`[updateMonthBoard] Error updating month board for ${monthId}:`, error);
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: (result, error, { monthId }) => [
        { type: "MonthBoards", id: monthId },
        { type: "CurrentMonth", id: "ENHANCED" },
        { type: "AvailableMonths", id: "LIST" },
      ],
    }),
  }),
});

// ============================================================================
// EXPORTED HOOKS
// ============================================================================

export const {
  useGetCurrentMonthQuery,
  useGetAvailableMonthsQuery,
  useGenerateMonthBoardMutation,
  useGetMonthBoardQuery,
  useUpdateMonthBoardMutation,
} = monthsApi;

export default monthsApi;
