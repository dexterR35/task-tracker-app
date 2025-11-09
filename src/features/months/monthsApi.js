/**
 * Months API (Direct Firestore with Snapshots)
 *
 * @fileoverview Direct Firestore hooks for month board management and month data operations
 * @author Senior Developer
 * @version 3.0.0
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import dataCache from "@/utils/dataCache";
import { serializeTimestampsForContext } from "@/utils/dateUtils";
import { validateUserPermissions } from "@/features/utils/authUtils";

// Date and month utilities
import {
  formatMonth,
  getCurrentYear,
  parseMonthId,
} from "@/utils/dateUtils";
import {
  getMonthInfo,
} from "@/utils/monthUtils.jsx";


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


/**
 * Current Month Hook (Direct Firestore)
 */
export const useCurrentMonth = (userUID = null, role = 'user', _userData = null) => {
  const [currentMonth, setCurrentMonth] = useState(null);
  const [boardExists, setBoardExists] = useState(false);
  const [currentMonthBoard, setCurrentMonthBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const setupListener = async () => {
      try {
        logger.log('🔍 [useCurrentMonth] Fetching months data', { userUID, role });
        setIsLoading(true);
        setError(null);

        const currentMonthInfo = getMonthInfo(); // Default to actual current month
        const yearId = getCurrentYear();
        const monthsRef = getMonthsRef(yearId);

        const cacheKey = `months_${yearId}`;

        // Check cache first with extended TTL for months (30 days)
        const cachedData = dataCache.getMonthData(cacheKey);
        if (cachedData) {
          logger.log('🔍 [useCurrentMonth] Using cached months data (30-day cache)');
          setCurrentMonth(serializeTimestampsForContext(currentMonthInfo));
          setBoardExists(cachedData.boardExists);
          setCurrentMonthBoard(cachedData.currentMonthBoard);
          setIsLoading(false);
          return;
        }

        logger.log('🔍 [useCurrentMonth] Fetching months from Firestore');
        // Fetch months data once (months are relatively static)
        const monthsQuery = query(monthsRef);
        const snapshot = await getDocs(monthsQuery);
        logger.log('🔍 [useCurrentMonth] Months fetched, docs:', snapshot.docs.length);

        let boardExistsResult = false;
        let currentMonthBoardResult = null;

        if (!snapshot.empty) {
          // Find the current month in the available months
          const currentMonthDoc = snapshot.docs.find(
            (doc) => doc.id === currentMonthInfo.monthId
          );

          if (currentMonthDoc) {
            logger.log('🔍 [useCurrentMonth] Current month board found:', currentMonthInfo.monthId);
            boardExistsResult = true;
            currentMonthBoardResult = currentMonthDoc.data();
          }
        }

        // Cache the result with extended TTL for months (30 days - changes once per month)
        const cacheData = {
          boardExists: boardExistsResult,
          currentMonthBoard: currentMonthBoardResult ? serializeTimestampsForContext(currentMonthBoardResult) : null
        };
        dataCache.setMonthData(cacheKey, cacheData);

        logger.log('🔍 [useCurrentMonth] Setting current month data:', {
          monthId: currentMonthInfo.monthId,
          boardExists: boardExistsResult,
          hasBoardData: !!currentMonthBoardResult
        });

        setCurrentMonth(serializeTimestampsForContext(currentMonthInfo));
        setBoardExists(boardExistsResult);
        setCurrentMonthBoard(currentMonthBoardResult ? serializeTimestampsForContext(currentMonthBoardResult) : null);
        setIsLoading(false);

      } catch (err) {
        logger.error("[useCurrentMonth] Setup error:", err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();
  }, []); // Remove userUID and role from dependencies to prevent unnecessary re-renders

  return {
    currentMonth,
    boardExists,
    currentMonthBoard,
    isLoading,
    error
  };
};

/**
 * Available Months Hook (Direct Firestore - One-time fetch)
 */
export const useAvailableMonths = () => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const setupListener = async () => {
      try {
        logger.log('🔍 [useAvailableMonths] Fetching months data (one-time)');
        setIsLoading(true);
        setError(null);

        const currentMonthInfo = getMonthInfo();
        const yearId = getCurrentYear();
        const monthsRef = getMonthsRef(yearId);

        // Fetch months data once (one-time fetch instead of real-time listener)
        logger.log('🔍 [useAvailableMonths] Fetching months from Firestore');
        const monthsQuery = query(monthsRef);
        const snapshot = await getDocs(monthsQuery);
        logger.log('🔍 [useAvailableMonths] Months fetched, docs:', snapshot.docs.length);

        const months = [];

        if (!snapshot.empty) {
          snapshot.docs.forEach((doc) => {
            const monthData = doc.data();
            const monthId = doc.id;

            // Parse month ID to get readable month name using month utilities
            const monthDate = parseMonthId(monthId);
            const monthName = monthDate ? formatMonth(monthId) : `${monthId} (Invalid)`;

            months.push({
              monthId,
              monthName,
              boardId: monthData.boardId,
              createdAt: monthData.createdAt,
              createdBy: monthData.createdBy,
              createdByName: monthData.createdByName,
              createdByRole: monthData.createdByRole,
              isCurrent: monthId === currentMonthInfo.monthId,
              boardExists: true // All months in availableMonths have boards (they're in the collection)
            });
          });
        }

        logger.log('🔍 [useAvailableMonths] Setting available months:', months.length);
        setAvailableMonths(months);
        setIsLoading(false);

      } catch (err) {
        logger.error("[useAvailableMonths] Setup error:", err);
        setError(err);
        setIsLoading(false);
      }
    };

    setupListener();
  }, []); // Empty dependency array - this should only run once

  return { availableMonths, isLoading, error };
};

/**
 * Create Month Board Hook
 */
export const useCreateMonthBoard = () => {
  const createMonthBoard = useCallback(async (monthId, userData) => {
    try {
      // Validate user permissions
      const permissionValidation = validateUserPermissions(userData, 'create_board');
      if (!permissionValidation.isValid) {
        throw new Error(permissionValidation.errors.join(', '));
      }

      const monthRef = getMonthRef(monthId);
      const monthDoc = await getDoc(monthRef);

      if (monthDoc.exists()) {
        throw new Error("Month board already exists");
      }

      // Convert monthId string to Date object for getMonthInfo
      const monthDate = parseMonthId(monthId);
      if (!monthDate) {
        throw new Error(`Invalid monthId format: ${monthId}`);
      }
      const monthInfo = getMonthInfo(monthDate);
      const boardId = `board_${monthId}_${Date.now()}`;
      const currentUserUID = userData.userUID;
      const currentUserName = userData.name;
      const currentUserRole = userData.role || 'user';

      const monthBoardData = {
        monthId: monthId,
        monthName: monthInfo.monthName,
        year: monthInfo.year,
        month: monthInfo.month,
        daysInMonth: monthInfo.daysInMonth,
        startDate: monthInfo.startDate,
        endDate: monthInfo.endDate,
        boardId: boardId,
        createdAt: serverTimestamp(),
        createdBy: currentUserUID,
        createdByName: currentUserName,
        createdByRole: currentUserRole,
        status: 'active'
      };

      await setDoc(monthRef, monthBoardData);

      logger.log('Month board created successfully:', monthId);
      return { success: true, data: { monthId, boardId } };
    } catch (err) {
      logger.error('Error creating month board:', err);
      throw err;
    }
  }, []);

  return [createMonthBoard];
};

// Export hooks for backward compatibility
export const useGetCurrentMonthQuery = useCurrentMonth;
export const useGetAvailableMonthsQuery = useAvailableMonths;
export const useCreateMonthBoardMutation = useCreateMonthBoard;
