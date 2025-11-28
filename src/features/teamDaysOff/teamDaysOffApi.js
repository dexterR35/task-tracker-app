/**
 * Team Days Off API (Direct Firestore with Snapshots)
 *
 * @fileoverview Direct Firestore hooks for team days off with real-time updates
 * @author Senior Developer
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import dataCache from "@/utils/dataCache";
import listenerManager from "@/features/utils/firebaseListenerManager";

/**
 * Calculate months accrued since entry creation date
 * @param {Date} createdAt - Entry creation date
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {number} - Number of months accrued
 */
const calculateMonthsAccrued = (createdAt, currentDate = new Date()) => {
  if (!createdAt) return 0;

  // Convert Firestore timestamp to Date if needed
  const createdDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  const monthsDiff =
    (currentDate.getFullYear() - createdDate.getFullYear()) * 12 +
    (currentDate.getMonth() - createdDate.getMonth());
  return Math.max(0, monthsDiff);
};

/**
 * Calculate monthly accrual (1.75 days per month)
 * @param {Date} createdAt - Entry creation date
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {number} - Monthly accrual (months * 1.75)
 */
const calculateMonthlyAccrual = (createdAt, currentDate = new Date()) => {
  const monthsAccrued = calculateMonthsAccrued(createdAt, currentDate);
  return monthsAccrued * 1.75;
};

/**
 * Calculate total days (base days + monthly accrual)
 * @param {number} baseDays - Base days
 * @param {number} monthlyAccrual - Monthly accrual from months
 * @returns {number} - Total days available
 */
const calculateTotalDays = (baseDays, monthlyAccrual) => {
  return baseDays + monthlyAccrual;
};

/**
 * Team Days Off Hook (Real-time listener)
 */
export const useTeamDaysOff = () => {
  const [teamDaysOff, setTeamDaysOff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const listenerKey = 'team_days_off_list';

    const teamDaysOffRef = collection(db, 'teamDaysOff');
    const q = query(teamDaysOffRef, orderBy('userName', 'asc'));

    // Set up real-time snapshot listener directly
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const currentDate = new Date();

        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          const createdAt = docData.createdAt;
          const baseDays = docData.baseDays || 0;

          // Always recalculate monthly accrual from creation date to ensure accuracy
          // Don't use stale DB value - recalculate on every snapshot update
          const monthlyAccrual = calculateMonthlyAccrual(createdAt, currentDate);
          const monthsAccrued = calculateMonthsAccrued(createdAt, currentDate);

          // If offDays array exists, use its length, otherwise use daysOff field
          // Ensure offDays is always an array (create a new array reference to ensure reactivity)
          const offDays = Array.isArray(docData.offDays) ? [...docData.offDays] : [];
          const daysOff = offDays.length > 0 ? offDays.length : (docData.daysOff || 0);

          const daysTotal = calculateTotalDays(baseDays, monthlyAccrual);
          const daysRemaining = daysTotal - daysOff;

          return {
            id: doc.id,
            ...docData,
            offDays: offDays, // Include offDays array (new reference for reactivity)
            daysTotal,
            daysRemaining,
            monthsAccrued,
            monthlyAccrual, // Always use recalculated value
            daysOff, // Use calculated daysOff
          };
        });

        // Update state directly - this triggers re-render
        setTeamDaysOff(data);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useTeamDaysOff] Team days off updated in real-time:', data.length);
      },
      (err) => {
        logger.error('❌ [useTeamDaysOff] Real-time error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Register with listener manager for tracking (but don't let it pause this)
    listenerManager.addListener(
      listenerKey,
      () => unsubscribe, // Return unsubscribe function
      true, // Preserve this listener - it's critical for real-time updates
      'table', // Category: table (high priority, preserved)
      'team-days-off' // Page identifier
    );

    return () => {
      unsubscribe(); // Unsubscribe from Firestore
      listenerManager.removeListener(listenerKey); // Remove from manager
    };
  }, []);

  // Create or update team days off entry (ensures only ONE document per user)
  const createTeamDaysOff = useCallback(async (teamDaysOffData, adminUserData) => {
    try {
      const teamDaysOffRef = collection(db, 'teamDaysOff');

      // Check if user already has an entry (check userUID)
      const userUID = teamDaysOffData.userUID;
      const q = query(teamDaysOffRef, where('userUID', '==', userUID));
      const snapshot = await getDocs(q);

      let entryRef;
      let currentEntry = null;
      const isNewEntry = snapshot.empty;

      if (!isNewEntry) {
        // Entry exists - use the first one (if multiple exist, use the first)
        entryRef = doc(db, 'teamDaysOff', snapshot.docs[0].id);
        currentEntry = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        // If multiple entries exist, delete the rest to ensure only ONE document per user
        if (snapshot.docs.length > 1) {
          logger.log(`Found ${snapshot.docs.length} entries for user ${userUID}, keeping first and deleting others`);
          for (let i = 1; i < snapshot.docs.length; i++) {
            await deleteDoc(doc(db, 'teamDaysOff', snapshot.docs[i].id));
          }
        }
      } else {
        // Create new entry
        entryRef = doc(teamDaysOffRef);
      }

      // Calculate monthly accrual
      const createdAt = currentEntry?.createdAt || serverTimestamp();
      const currentDate = new Date();
      const monthlyAccrual = isNewEntry ? 0 : calculateMonthlyAccrual(createdAt, currentDate);

      const baseDays = teamDaysOffData.baseDays !== undefined ? teamDaysOffData.baseDays : (currentEntry?.baseDays || 0);
      const daysOff = teamDaysOffData.daysOff !== undefined ? teamDaysOffData.daysOff : (currentEntry?.daysOff || 0);
      const daysTotal = baseDays + monthlyAccrual;
      const daysRemaining = daysTotal - daysOff;

      const entryData = {
        ...teamDaysOffData,
        baseDays: baseDays,
        daysOff: daysOff,
        monthlyAccrual: monthlyAccrual,
        daysTotal: daysTotal,
        daysRemaining: daysRemaining,
        offDays: currentEntry?.offDays || [], // Preserve existing offDays
        updatedAt: serverTimestamp(),
        updatedBy: adminUserData?.userUID,
        updatedByName: adminUserData?.name
      };

      if (isNewEntry) {
        // New entry - add createdAt and createdBy
        entryData.createdAt = serverTimestamp();
        entryData.createdBy = adminUserData?.userUID;
        entryData.createdByName = adminUserData?.name;
        await setDoc(entryRef, entryData);
      } else {
        // Existing entry - update it
        await updateDoc(entryRef, entryData);
      }

      // Invalidate cache
      dataCache.delete('team_days_off_list');

      logger.log(`Team days off entry ${isNewEntry ? 'created' : 'updated'} successfully:`, entryRef.id);
      return { success: true, id: entryRef.id };
    } catch (err) {
      logger.error('Error creating/updating team days off entry:', err);
      throw err;
    }
  }, []);

  // Update team days off entry
  const updateTeamDaysOff = useCallback(async (entryId, updateData, adminUserData) => {
    try {
      const entryRef = doc(db, 'teamDaysOff', entryId);

      // Get current entry to calculate accrued days
      const entryDoc = await getDoc(entryRef);
      let currentEntry = null;
      if (entryDoc.exists()) {
        currentEntry = { id: entryDoc.id, ...entryDoc.data() };
      }

      // Calculate monthly accrual from creation date
      const createdAt = currentEntry?.createdAt || updateData.createdAt;
      const currentDate = new Date();
      const monthlyAccrual = calculateMonthlyAccrual(createdAt, currentDate);

      // Recalculate total days and days remaining
      const baseDays = updateData.baseDays !== undefined ? updateData.baseDays : (currentEntry?.baseDays || 0);

      // If offDays array exists in updateData or currentEntry, use its length, otherwise use daysOff field
      const offDays = updateData.offDays || currentEntry?.offDays || [];
      const daysOff = offDays.length > 0 ? offDays.length : (updateData.daysOff !== undefined ? updateData.daysOff : (currentEntry?.daysOff || 0));

      const daysTotal = baseDays + monthlyAccrual;
      const daysRemaining = daysTotal - daysOff;

      const updates = {
        ...updateData,
        offDays: offDays.length > 0 ? offDays : (currentEntry?.offDays || []), // Preserve offDays array
        monthlyAccrual: monthlyAccrual, // Update monthly accrual in DB
        daysTotal: daysTotal, // Update total days in DB
        daysRemaining: daysRemaining, // Update days remaining in DB
        daysOff: daysOff, // Update daysOff count
        updatedAt: serverTimestamp(),
        updatedBy: adminUserData?.userUID,
        updatedByName: adminUserData?.name
      };

      await updateDoc(entryRef, updates);

      // Invalidate cache
      dataCache.delete('team_days_off_list');

      logger.log('Team days off entry updated successfully:', entryId);
      return { success: true };
    } catch (err) {
      logger.error('Error updating team days off entry:', err);
      throw err;
    }
  }, []);

  // Delete team days off entry
  const deleteTeamDaysOff = useCallback(async (entryId, _adminUserData) => {
    try {
      const entryRef = doc(db, 'teamDaysOff', entryId);
      await deleteDoc(entryRef);

      // Invalidate cache
      dataCache.delete('team_days_off_list');

      logger.log('Team days off entry deleted successfully:', entryId);
      return { success: true };
    } catch (err) {
      logger.error('Error deleting team days off entry:', err);
      throw err;
    }
  }, []);

  // Add specific off days to a user's entry (ensures only ONE document per user)
  const addOffDays = useCallback(async (userUID, dates, adminUserData) => {
    try {
      const teamDaysOffRef = collection(db, 'teamDaysOff');
      const q = query(teamDaysOffRef, where('userUID', '==', userUID));
      const snapshot = await getDocs(q);

      let entryRef;
      let currentEntry = null;
      const isNewEntry = snapshot.empty;

      if (!isNewEntry) {
        // Entry exists - use the first one (if multiple exist, use the first)
        entryRef = doc(db, 'teamDaysOff', snapshot.docs[0].id);
        currentEntry = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        // If multiple entries exist, delete the rest to ensure only ONE document per user
        if (snapshot.docs.length > 1) {
          logger.log(`Found ${snapshot.docs.length} entries for user ${userUID}, keeping first and deleting others`);
          for (let i = 1; i < snapshot.docs.length; i++) {
            await deleteDoc(doc(db, 'teamDaysOff', snapshot.docs[i].id));
          }
        }
      } else {
        // Create new entry with defaults
        entryRef = doc(teamDaysOffRef);
        currentEntry = {
          userUID: userUID,
          userName: adminUserData?.name || 'Unknown',
          baseDays: 0,
          daysOff: 0,
          monthlyAccrual: 0,
          daysTotal: 0,
          daysRemaining: 0,
          offDays: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: adminUserData?.userUID,
          createdByName: adminUserData?.name
        };
      }

      // Get existing offDays array or initialize empty
      const existingOffDays = currentEntry.offDays || [];

      // Format dates as { year, month, day } objects
      // Use local date components to avoid timezone issues
      const newOffDays = dates.map(date => {
        const dateObj = date instanceof Date ? date : new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // 1-12
        const day = dateObj.getDate();

        // Create dateString using local date components (not UTC) to avoid timezone shifts
        // Reuse the same logic pattern for consistency
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        return {
          year,
          month,
          day,
          dateString, // YYYY-MM-DD using local date (not UTC)
          timestamp: dateObj.getTime()
        };
      });

      // Merge with existing, avoiding duplicates
      const mergedOffDays = [...existingOffDays];
      newOffDays.forEach(newDay => {
        const exists = mergedOffDays.some(
          existing => existing.dateString === newDay.dateString
        );
        if (!exists) {
          mergedOffDays.push(newDay);
        }
      });

      // Sort by timestamp
      mergedOffDays.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Calculate daysOff from the count of offDays
      const daysOff = mergedOffDays.length;

      // Recalculate totals
      const createdAt = isNewEntry ? serverTimestamp() : currentEntry.createdAt;
      const currentDate = new Date();
      const monthlyAccrual = isNewEntry ? 0 : calculateMonthlyAccrual(createdAt, currentDate);
      const baseDays = currentEntry.baseDays || 0;
      const daysTotal = calculateTotalDays(baseDays, monthlyAccrual);
      const daysRemaining = daysTotal - daysOff;

      const updateData = {
        offDays: mergedOffDays,
        daysOff: daysOff,
        daysTotal: daysTotal,
        daysRemaining: daysRemaining,
        monthlyAccrual: monthlyAccrual,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserData?.userUID,
        updatedByName: adminUserData?.name
      };

      if (isNewEntry) {
        // New entry - include all fields
        updateData.userUID = userUID;
        updateData.userName = adminUserData?.name || 'Unknown';
        updateData.baseDays = baseDays;
        updateData.createdAt = serverTimestamp();
        updateData.createdBy = adminUserData?.userUID;
        updateData.createdByName = adminUserData?.name;
        await setDoc(entryRef, updateData);
      } else {
        // Existing entry - just update
        await updateDoc(entryRef, updateData);
      }

      dataCache.delete('team_days_off_list');
      logger.log('Off days added successfully for user:', userUID);
      return { success: true };
    } catch (err) {
      logger.error('Error adding off days:', err);
      throw err;
    }
  }, []);

  // Remove specific off days from a user's entry
  const removeOffDays = useCallback(async (userUID, dates, adminUserData) => {
    try {
      const teamDaysOffRef = collection(db, 'teamDaysOff');
      const q = query(teamDaysOffRef, where('userUID', '==', userUID));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('User entry not found');
      }

      const entryRef = doc(db, 'teamDaysOff', snapshot.docs[0].id);
      const currentEntry = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      const existingOffDays = currentEntry.offDays || [];

      // Convert dates to dateStrings for comparison using local date components (same as addOffDays)
      const dateStringsToRemove = dates.map(date => {
        const dateObj = date instanceof Date ? date : new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; // 1-12
        const day = dateObj.getDate();
        // Create dateString using local date components (not UTC) to match how dates are saved
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      });

      // Filter out the dates to remove
      const updatedOffDays = existingOffDays.filter(
        offDay => !dateStringsToRemove.includes(offDay.dateString)
      );

      // Recalculate daysOff
      const daysOff = updatedOffDays.length;

      // Recalculate totals
      const createdAt = currentEntry.createdAt;
      const currentDate = new Date();
      const monthlyAccrual = calculateMonthlyAccrual(createdAt, currentDate);
      const baseDays = currentEntry.baseDays || 0;
      const daysTotal = calculateTotalDays(baseDays, monthlyAccrual);
      const daysRemaining = daysTotal - daysOff;

      await updateDoc(entryRef, {
        offDays: updatedOffDays,
        daysOff: daysOff,
        daysTotal: daysTotal,
        daysRemaining: daysRemaining,
        monthlyAccrual: monthlyAccrual,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserData?.userUID,
        updatedByName: adminUserData?.name
      });

      dataCache.delete('team_days_off_list');
      logger.log('Off days removed successfully for user:', userUID);
      return { success: true };
    } catch (err) {
      logger.error('Error removing off days:', err);
      throw err;
    }
  }, []);

  // Send email to HR (placeholder - integrate with your email service)
  const sendEmailToHR = useCallback(async (userUID, dates, adminUserData) => {
    try {
      // TODO: Integrate with your email service
      // For now, just log the data
      logger.log('Sending email to HR:', {
        userUID,
        dates,
        requestedBy: adminUserData?.name || adminUserData?.email
      });

      // This is a placeholder - replace with actual email service integration
      // Example: await emailService.send({
      //   to: 'hr@company.com',
      //   subject: 'Days Off Request',
      //   body: `User ${adminUserData?.name} has requested the following days off: ${dates.join(', ')}`
      // });

      return { success: true, message: 'Email sent to HR successfully' };
    } catch (err) {
      logger.error('Error sending email to HR:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    teamDaysOff,
    isLoading,
    error,

    // CRUD Operations
    createTeamDaysOff,
    updateTeamDaysOff,
    deleteTeamDaysOff,

    // Off Days Operations
    addOffDays,
    removeOffDays,
    sendEmailToHR
  };
};

