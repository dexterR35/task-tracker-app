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
import { serializeTimestampsForContext } from "@/utils/dateUtils";
import { canCreateBoard } from "@/features/utils/authUtils";

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


const getMonthRef = (monthId) => {
  const yearId = monthId.split('-')[0]; // Extract year from monthId (e.g., "2025" from "2025-09")
  return doc(db, "departments", "design", yearId, monthId); // Month document
};


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
        
        logger.log('🔍 [useCurrentMonth] Fetching current month from Firestore');

        // Fetch current month document (Firebase handles caching internally)
        const currentMonthRef = getMonthRef(currentMonthInfo.monthId);
        const currentMonthDoc = await getDoc(currentMonthRef);
        logger.log('🔍 [useCurrentMonth] Current month fetched');

        let boardExistsResult = false;
        let currentMonthBoardResult = null;

        if (currentMonthDoc.exists()) {
          logger.log('🔍 [useCurrentMonth] Current month board found:', currentMonthInfo.monthId);
          boardExistsResult = true;
          currentMonthBoardResult = currentMonthDoc.data();
        }

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
        logger.log('🔍 [useAvailableMonths] Fetching months data');
        setIsLoading(true);
        setError(null);

        const currentMonthInfo = getMonthInfo();
        const currentYearId = getCurrentYear();
        const previousYearId = (parseInt(currentYearId) - 1).toString();
        
        // Fetch months from both current year and previous year
        logger.log('🔍 [useAvailableMonths] Fetching months from Firestore for years:', { currentYearId, previousYearId });
        
        const months = [];

        // Fetch from current year
        const currentYearRef = getMonthsRef(currentYearId);
        const currentYearQuery = query(currentYearRef);
        const currentYearSnapshot = await getDocs(currentYearQuery);
        logger.log('🔍 [useAvailableMonths] Current year months fetched, docs:', currentYearSnapshot.docs.length);

        if (!currentYearSnapshot.empty) {
          currentYearSnapshot.docs.forEach((doc) => {
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

        // Fetch from previous year
        const previousYearRef = getMonthsRef(previousYearId);
        const previousYearQuery = query(previousYearRef);
        const previousYearSnapshot = await getDocs(previousYearQuery);
        logger.log('🔍 [useAvailableMonths] Previous year months fetched, docs:', previousYearSnapshot.docs.length);

        if (!previousYearSnapshot.empty) {
          previousYearSnapshot.docs.forEach((doc) => {
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

        // Sort months by monthId descending (most recent first)
        months.sort((a, b) => {
          if (a.monthId > b.monthId) return -1;
          if (a.monthId < b.monthId) return 1;
          return 0;
        });

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
      // Validate user permissions - only users with explicit 'create_boards' permission can create boards
      if (!canCreateBoard(userData)) {
        throw new Error('Contact administrator for creating board');
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
