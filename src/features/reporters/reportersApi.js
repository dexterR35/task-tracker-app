
import { useState, useEffect, useCallback } from "react";
import {
  collection,
  collectionGroup,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";


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


const updateTasksWithReporterName = async (reporterId, newReporterName) => {
  if (!reporterId || !newReporterName) {
    logger.warn('Invalid parameters for updateTasksWithReporterName');
    return { updatedCount: 0 };
  }

  // Use collection group query to find all tasks across all months/years
  const taskdataGroup = collectionGroup(db, 'taskdata');
  const q = query(taskdataGroup, where('data_task.reporterUID', '==', reporterId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    logger.log(`[updateTasksWithReporterName] No tasks found for reporter ${reporterId}`);
    return { updatedCount: 0 };
  }

  const tasks = snapshot.docs;
  const batchSize = 500;
  let totalUpdated = 0;

  // Update tasks in batches
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = writeBatch(db);
    tasks.slice(i, i + batchSize).forEach((taskDoc) => {
      batch.update(taskDoc.ref, { 'data_task.reporterName': newReporterName });
    });
    
    await batch.commit();
    totalUpdated += Math.min(batchSize, tasks.length - i);
  }

  logger.log(`[updateTasksWithReporterName] Updated ${totalUpdated} tasks for reporter ${reporterId}`);
  return { updatedCount: totalUpdated };
};

/**
 * Reporters Hook - Real-time listener for reporters collection
 */
export const useReporters = () => {
  const [reporters, setReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const reportersRef = collection(db, 'reporters');
    const q = query(reportersRef, orderBy('createdAt', 'desc'));

    // Firebase onSnapshot provides real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setReporters(reportersData);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useReporters] Reporters updated in real-time:', reportersData.length);
      },
      (err) => {
        logger.error('❌ [useReporters] Real-time error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup: unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  // Create reporter
  const createReporter = useCallback(async (reporterData, userData = null) => {
    try {
      // Only admin can manage reporters
      if (!userData || userData.role !== 'admin') {
        throw new Error('Only admin users can manage reporters');
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
      // Only admin can manage reporters
      if (!userData || userData.role !== 'admin') {
        throw new Error('Only admin users can manage reporters');
      }
      
      // Get current reporter data to check if name is changing
      const currentReporterRef = doc(db, 'reporters', reporterId);
      const currentReporterDoc = await getDoc(currentReporterRef);
      
      let oldReporterName = null;
      if (currentReporterDoc.exists()) {
        const currentData = currentReporterDoc.data();
        oldReporterName = currentData.name;
        
        // Check if email is being updated and if it already exists (excluding current reporter)
        if (updateData.email) {
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
        ...(userData && userData.userUID && {
          updatedBy: userData.userUID,
          updatedByName: userData.name || 'Unknown User'
        })
      };

      await updateDoc(reporterRef, updates);

      // If reporter name changed, update all tasks that reference this reporter
      if (updateData.name && oldReporterName && updateData.name !== oldReporterName) {
        logger.log(`[updateReporter] Reporter name changed from "${oldReporterName}" to "${updateData.name}", updating tasks...`);
        try {
          const updateResult = await updateTasksWithReporterName(reporterId, updateData.name);
          logger.log(`[updateReporter] Updated ${updateResult.updatedCount} tasks with new reporter name`);
        } catch (taskUpdateError) {
          // Log error but don't fail the reporter update
          logger.error('[updateReporter] Error updating tasks with new reporter name:', taskUpdateError);
        }
      }

      // Real-time listener will automatically update the state
      logger.log('Reporter updated successfully:', reporterId);
      return { success: true };
    } catch (err) {
      logger.error('Error updating reporter:', err);
      throw err;
    }
  }, []);

  // Delete reporter
  // NOTE: This only deletes the reporter document. Tasks referencing this reporter are NOT deleted.
  // Tasks will still exist with the reporterUID and reporterName fields intact.
  const deleteReporter = useCallback(async (reporterId, userData = null) => {
    try {
      // Only admin can manage reporters
      if (!userData || userData.role !== 'admin') {
        throw new Error('Only admin users can manage reporters');
      }
      const reporterRef = doc(db, 'reporters', reporterId);
      await deleteDoc(reporterRef);
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
