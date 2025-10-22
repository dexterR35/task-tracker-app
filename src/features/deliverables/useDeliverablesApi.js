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
          console.log('🔍 [useDeliverablesApi] Using cached deliverables data');
          setDeliverables(cachedData);
          setIsLoading(false);
          setError(null);
          return;
        }

        console.log('🔍 [useDeliverablesApi] Fetching deliverables from Firestore');
        setIsLoading(true);
        setError(null);
        const deliverablesRef = getDeliverablesRef();

        const snapshot = await getDoc(deliverablesRef);
        if (!snapshot || !snapshot.exists()) {
          setDeliverables([]);
          setIsLoading(false);
          return;
        }

        const deliverablesData = snapshot.data();
        const deliverablesList = deliverablesData.deliverables || [];

        // Cache the data indefinitely (deliverables are static and manually managed)
        dataCache.set(cacheKey, deliverablesList, Infinity);

        setDeliverables(deliverablesList);
        setIsLoading(false);
        setError(null);
        console.log('✅ [useDeliverablesApi] Deliverables fetched and cached:', deliverablesList.length);
      } catch (error) {
        console.error('Deliverables fetch error:', error);
        setError(error);
        setIsLoading(false);
      }
    };

    fetchDeliverables();
  }, [getDeliverablesRef]);

  // Create deliverable
  const createDeliverable = useCallback(async (deliverableData, userData) => {
    try {
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
        updatedBy: userData?.uid,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: newDeliverable };
    } catch (error) {
      console.error('Error creating deliverable:', error);
      throw error;
    }
  }, [getDeliverablesRef]);

  // Update deliverable
  const updateDeliverable = useCallback(async (deliverableName, deliverableData, userData) => {
    try {
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
        updatedBy: userData?.uid,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: updatedDeliverables };
    } catch (error) {
      console.error('Error updating deliverable:', error);
      throw error;
    }
  }, [getDeliverablesRef]);

  // Delete deliverable
  const deleteDeliverable = useCallback(async (deliverableName, userData) => {
    try {
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
        updatedBy: userData?.uid,
        updatedByName: userData?.name
      }, { merge: true });

      return { success: true, data: updatedDeliverables };
    } catch (error) {
      console.error('Error deleting deliverable:', error);
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
