/**
 * Centralized Deliverables API Hook
 *
 * @fileoverview Custom hook for all deliverables CRUD operations with real-time updates
 * @author Senior Developer
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import dataCache from '@/utils/dataCache';
import { logger } from '@/utils/logger';

// Global fetch lock to prevent concurrent fetches (handles StrictMode double renders)
const fetchLocks = new Map();

/**
 * Centralized hook for deliverables API operations
 * @returns {Object} - Deliverables data and CRUD operations
 */
export const useDeliverablesApi = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get deliverables document reference
  const getDeliverablesRef = useCallback(() => {
    return doc(db, "settings", "app", "data", "deliverables");
  }, []);

  // Setup one-time fetch with caching (deliverables are static data)
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        const cacheKey = 'deliverables_list';

        // Check cache first
        const cachedData = dataCache.get(cacheKey);
        if (cachedData) {
          logger.log('🔍 [useDeliverablesApi] Using cached deliverables data');
          setDeliverables(cachedData);
          setIsLoading(false);
          setError(null);
          return;
        }

        // Check if fetch is already in progress (prevents duplicate fetches in StrictMode)
        if (fetchLocks.has(cacheKey)) {
          logger.log('🔍 [useDeliverablesApi] Fetch already in progress, waiting...');
          // Wait for the existing fetch to complete
          const existingPromise = fetchLocks.get(cacheKey);
          try {
            const result = await existingPromise;
            setDeliverables(result);
            setIsLoading(false);
            setError(null);
            return;
          } catch (err) {
            setError(err);
            setIsLoading(false);
            return;
          }
        }

        logger.log('🔍 [useDeliverablesApi] Fetching deliverables from Firestore');
        setIsLoading(true);
        setError(null);
        const deliverablesRef = getDeliverablesRef();

        // Create fetch promise and lock
        const fetchPromise = (async () => {
          try {
            const snapshot = await getDoc(deliverablesRef);
            if (!snapshot || !snapshot.exists()) {
              return [];
            }

            const deliverablesData = snapshot.data();
            const deliverablesList = deliverablesData.deliverables || [];

            // Cache the data indefinitely (deliverables are static and manually managed)
            dataCache.set(cacheKey, deliverablesList, Infinity);
            return deliverablesList;
          } finally {
            // Remove lock when done
            fetchLocks.delete(cacheKey);
          }
        })();

        fetchLocks.set(cacheKey, fetchPromise);

        const deliverablesList = await fetchPromise;
        setDeliverables(deliverablesList);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useDeliverablesApi] Deliverables fetched and cached:', deliverablesList.length);
      } catch (error) {
        logger.error('Deliverables fetch error:', error);
        setError(error);
        setIsLoading(false);
      }
    };

    fetchDeliverables();
  }, [getDeliverablesRef]);

  // Create deliverable
  const createDeliverable = useCallback(async (deliverableData, userData) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage deliverables');
        }
      }

      const deliverablesRef = getDeliverablesRef();
      const existingDoc = await getDoc(deliverablesRef);

      let existingDeliverables = [];
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        existingDeliverables = existingData.deliverables || [];
      }

      const newDeliverable = {
        ...deliverableData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedDeliverables = [...existingDeliverables, newDeliverable];

      await setDoc(deliverablesRef, {
        deliverables: updatedDeliverables,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.userUID,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: newDeliverable };
    } catch (error) {
      logger.error('Error creating deliverable:', error);
      throw error;
    }
  }, [getDeliverablesRef]);

  // Update deliverable
  const updateDeliverable = useCallback(async (deliverableName, deliverableData, userData) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage deliverables');
        }
      }

      const deliverablesRef = getDeliverablesRef();
      const existingDoc = await getDoc(deliverablesRef);

      let existingDeliverables = [];
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        existingDeliverables = existingData.deliverables || [];
      }

      const updatedDeliverables = existingDeliverables.map(d =>
        d.name === deliverableName ? {
          ...d,
          ...deliverableData,
          updatedAt: new Date().toISOString()
        } : d
      );

      await setDoc(deliverablesRef, {
        deliverables: updatedDeliverables,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.userUID,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: updatedDeliverables };
    } catch (error) {
      logger.error('Error updating deliverable:', error);
      throw error;
    }
  }, [getDeliverablesRef]);

  // Delete deliverable
  const deleteDeliverable = useCallback(async (deliverableName, userData) => {
    try {
      // Validate user permissions - Role-based
      if (userData) {
        // Check for admin role or has_permission (universal admin permission)
        if (userData.role !== 'admin' && !userData.permissions?.includes('has_permission')) {
          throw new Error('Only admin users can manage deliverables');
        }
      }

      const deliverablesRef = getDeliverablesRef();
      const existingDoc = await getDoc(deliverablesRef);

      let existingDeliverables = [];
      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        existingDeliverables = existingData.deliverables || [];
      }

      const updatedDeliverables = existingDeliverables.filter(d => d.name !== deliverableName);

      await setDoc(deliverablesRef, {
        deliverables: updatedDeliverables,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.userUID,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: updatedDeliverables };
    } catch (error) {
      logger.error('Error deleting deliverable:', error);
      throw error;
    }
  }, [getDeliverablesRef]);

  return {
    // Data
    deliverables,
    isLoading,
    error,

    // CRUD Operations
    createDeliverable,
    updateDeliverable,
    deleteDeliverable
  };
};
