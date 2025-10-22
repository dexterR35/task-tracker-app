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
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  getDocs
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

        logger.log('🔍 [useReporters] Fetching reporters from Firestore');
        setIsLoading(true);
        setError(null);

        const reportersRef = collection(db, 'reporters');
        const q = query(reportersRef, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        const reportersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cache the data indefinitely (reporters are manually managed and never change)
        dataCache.set(cacheKey, reportersData, Infinity);

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
      const newReporter = {
        ...reporterData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Only add user info if user is authenticated (optional)
        ...(userData && userData.uid && {
          createdBy: userData.uid,
          createdByName: userData.name || 'Unknown User'
        })
      };

      const docRef = await addDoc(reportersRef, newReporter);

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
      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const emailExists = await checkReporterEmailExists(updateData.email);
        if (emailExists) {
          throw new Error("Reporter with this email already exists");
        }
      }

      const reporterRef = doc(db, 'reporters', reporterId);
      const updates = {
        ...updateData,
        updatedAt: serverTimestamp(),
        // Only add user info if user is authenticated (optional)
        ...(userData && userData.uid && {
          updatedBy: userData.uid,
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
