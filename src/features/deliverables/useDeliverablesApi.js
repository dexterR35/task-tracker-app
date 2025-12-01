/**
 * Centralized Deliverables API Hook
 *
 * @fileoverview Custom hook for all deliverables CRUD operations with real-time updates
 * @author Senior Developer
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { logger } from '@/utils/logger';

/**
 * Centralized hook for deliverables API operations with real-time updates
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

  // Setup real-time listener for deliverables
  useEffect(() => {
    const deliverablesRef = getDeliverablesRef();
    logger.log('🔍 [useDeliverablesApi] Setting up real-time listener for deliverables');
    setIsLoading(true);
    setError(null);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      deliverablesRef,
      (snapshot) => {
        try {
          if (!snapshot || !snapshot.exists()) {
            logger.log('🔍 [useDeliverablesApi] No deliverables document found, using empty array');
            setDeliverables([]);
            setIsLoading(false);
            setError(null);
            return;
          }

          const deliverablesData = snapshot.data();
          const deliverablesList = deliverablesData.deliverables || [];

          // Sort deliverables by name for consistent display
          const sortedDeliverables = [...deliverablesList].sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });

          setDeliverables(sortedDeliverables);
          setIsLoading(false);
          setError(null);
          logger.log('✅ [useDeliverablesApi] Deliverables updated in real-time:', sortedDeliverables.length);
        } catch (error) {
          logger.error('Error processing deliverables snapshot:', error);
          setError(error);
          setIsLoading(false);
        }
      },
      (error) => {
        logger.error('Deliverables real-time listener error:', error);
        setError(error);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      logger.log('🔍 [useDeliverablesApi] Cleaning up real-time listener');
      unsubscribe();
    };
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
