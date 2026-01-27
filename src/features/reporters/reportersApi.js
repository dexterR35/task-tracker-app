
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
import listenerManager from "@/features/utils/firebaseListenerManager";
import { onSnapshot } from "firebase/firestore";


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
 * Reporters Hook (Real-time Firebase snapshot)
 * Uses Firebase's built-in caching - no custom cache needed
 */
export const useReporters = () => {
  const [reporters, setReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const listenerKey = 'reporters_list';
    
    logger.log('🔍 [useReporters] Setting up real-time listener for reporters');
    setIsLoading(true);
    setError(null);

    // Use Firebase onSnapshot for real-time updates
    // Firebase handles caching internally
    const unsubscribe = listenerManager.addListener(
      listenerKey,
      () => {
        const reportersRef = collection(db, 'reporters');
        const q = query(reportersRef, orderBy('createdAt', 'desc'));

        return onSnapshot(
          q,
          (snapshot) => {
            const reportersData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            logger.log(`✅ [useReporters] Reporters updated in real-time: ${reportersData.length}`);
            setReporters(reportersData);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            logger.error('❌ [useReporters] Real-time error:', err);
            setError(err);
            setIsLoading(false);
          }
        );
      },
      true, // Preserve listener
      'reporters',
      'reporters-list'
    );

    return () => {
      listenerManager.removeListener(listenerKey);
    };
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

      // No cache invalidation needed - Firebase snapshot will update automatically
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

      // No cache invalidation needed - Firebase snapshot will update automatically
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

      // No cache invalidation needed - Firebase snapshot will update automatically
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
