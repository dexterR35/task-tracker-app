/**
 * Reporters API (Direct Firestore with Snapshots)
 *
 * @fileoverview Direct Firestore hooks for reporters with real-time updates
 * @author Senior Developer
 * @version 3.0.0
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  getDocs,
  getDoc
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import dataCache from "@/utils/dataCache";

/**
 * Check if reporter email already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email exists
 */
const checkReporterEmailExists = async (email) => {
  try {
    // Validate email parameter
    if (!email || typeof email !== 'string') {
      logger.warn('Invalid email provided to checkReporterEmailExists:', email);
      return false;
    }

    const reportersRef = collection(db, 'reporters');
    const q = query(reportersRef, where('email', '==', email.toLowerCase().trim()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    logger.error('Error checking reporter email:', error);
    return false;
  }
};

// Global fetch lock to prevent concurrent fetches (handles StrictMode double renders)
const fetchLocks = new Map();

/**
 * Reporters Hook (One-time fetch - Reporters are static data)
 */
export const useReporters = () => {
  const [reporters, setReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReporters = async () => {
      try {
        const cacheKey = 'reporters_list';

        // Check cache first
        const cachedData = dataCache.get(cacheKey);
        if (cachedData) {
          logger.log('🔍 [useReporters] Using cached reporters data');
          setReporters(cachedData);
          setIsLoading(false);
          setError(null);
          return;
        }

        // Check if fetch is already in progress (prevents duplicate fetches in StrictMode)
        if (fetchLocks.has(cacheKey)) {
          logger.log('🔍 [useReporters] Fetch already in progress, waiting...');
          // Wait for the existing fetch to complete
          const existingPromise = fetchLocks.get(cacheKey);
          try {
            const result = await existingPromise;
            setReporters(result);
            setIsLoading(false);
            setError(null);
            return;
          } catch (err) {
            setError(err);
            setIsLoading(false);
            return;
          }
        }

        logger.log('🔍 [useReporters] Fetching reporters from Firestore');
        setIsLoading(true);
        setError(null);

        // Create fetch promise and lock
        const fetchPromise = (async () => {
          try {
            const reportersRef = collection(db, 'reporters');
            const q = query(reportersRef, orderBy('createdAt', 'desc'));

            const snapshot = await getDocs(q);
            const reportersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Cache the data indefinitely (reporters are manually managed and never change)
            dataCache.set(cacheKey, reportersData, Infinity);
            return reportersData;
          } finally {
            // Remove lock when done
            fetchLocks.delete(cacheKey);
          }
        })();

        fetchLocks.set(cacheKey, fetchPromise);

        const reportersData = await fetchPromise;
        setReporters(reportersData);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useReporters] Reporters fetched and cached:', reportersData.length);
      } catch (err) {
        logger.error('❌ [useReporters] Fetch error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    fetchReporters();
  }, []);

  // Create reporter
  const createReporter = useCallback(async (reporterData, userData = null) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage reporters');
        }
      }

      // Validate reporter data
      if (!reporterData || !reporterData.email) {
        throw new Error("Reporter email is required");
      }

      // Check if email already exists
      const emailExists = await checkReporterEmailExists(reporterData.email);
      if (emailExists) {
        throw new Error("Reporter with this email already exists");
      }

      const reportersRef = collection(db, 'reporters');

      // First create the document to get the ID
      const docRef = await addDoc(reportersRef, {
        ...reporterData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Only add user info if user is authenticated (optional)
        ...(userData && userData.userUID && {
          createdBy: userData.userUID,
          createdByName: userData.name || 'Unknown User'
        })
      });

      // Update the document with reporterUID (document ID)
      await updateDoc(docRef, {
        reporterUID: docRef.id
      });

      // Invalidate cache when data changes
      dataCache.delete('reporters_list');

      logger.log('Reporter created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (err) {
      logger.error('Error creating reporter:', err);
      throw err;
    }
  }, []);

  // Update reporter
  const updateReporter = useCallback(async (reporterId, updateData, userData = null) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage reporters');
        }
      }

      // Check if email is being updated and if it already exists (excluding current reporter)
      if (updateData.email) {
        // First get the current reporter to check if email is actually changing
        const currentReporterRef = doc(db, 'reporters', reporterId);
        const currentReporterDoc = await getDoc(currentReporterRef);

        if (currentReporterDoc.exists()) {
          const currentData = currentReporterDoc.data();
          const currentEmail = currentData.email?.toLowerCase().trim();
          const newEmail = updateData.email.toLowerCase().trim();

          // Only check for email conflicts if the email is actually changing
          if (currentEmail !== newEmail) {
            const emailExists = await checkReporterEmailExists(updateData.email);
            if (emailExists) {
              throw new Error("Reporter with this email already exists");
            }
          }
        }
      }

      const reporterRef = doc(db, 'reporters', reporterId);
      const updates = {
        ...updateData,
        updatedAt: serverTimestamp(),
        // Only add user info if user is authenticated (optional)
        ...(userData && userData.userUID && {
          updatedBy: userData.userUID,
          updatedByName: userData.name || 'Unknown User'
        })
      };

      await updateDoc(reporterRef, updates);

      // Invalidate cache when data changes
      dataCache.delete('reporters_list');

      logger.log('Reporter updated successfully:', reporterId);
      return { success: true };
    } catch (err) {
      logger.error('Error updating reporter:', err);
      throw err;
    }
  }, []);

  // Delete reporter
  const deleteReporter = useCallback(async (reporterId, userData = null) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage reporters');
        }
      }

      const reporterRef = doc(db, 'reporters', reporterId);
      await deleteDoc(reporterRef);

      // Invalidate cache when data changes
      dataCache.delete('reporters_list');

      logger.log('Reporter deleted successfully:', reporterId);
      return { success: true };
    } catch (err) {
      logger.error('Error deleting reporter:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    reporters,
    isLoading,
    error,

    // CRUD Operations
    createReporter,
    updateReporter,
    deleteReporter
  };
};

// Export hooks for backward compatibility
export const useGetReportersQuery = useReporters;
export const useCreateReporterMutation = () => {
  const { createReporter } = useReporters();
  return [createReporter];
};
export const useUpdateReporterMutation = () => {
  const { updateReporter } = useReporters();
  return [updateReporter];
};
export const useDeleteReporterMutation = () => {
  const { deleteReporter } = useReporters();
  return [deleteReporter];
};
