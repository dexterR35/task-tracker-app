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
  addDoc,
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

    listenerManager.addListener(
      listenerKey,
      () => {
        setIsLoading(true);
        setError(null);

        const teamDaysOffRef = collection(db, 'teamDaysOff');
        const q = query(teamDaysOffRef, orderBy('userName', 'asc'));

        return onSnapshot(
          q,
          (snapshot) => {
            const currentDate = new Date();

            const data = snapshot.docs.map(doc => {
              const docData = doc.data();
              const createdAt = docData.createdAt;
              const baseDays = docData.baseDays || 0;
              
              // Calculate monthly accrual from creation date
              const calculatedMonthlyAccrual = calculateMonthlyAccrual(createdAt, currentDate);
              // Use saved monthlyAccrual if exists, otherwise calculate it
              const monthlyAccrual = docData.monthlyAccrual !== undefined ? docData.monthlyAccrual : calculatedMonthlyAccrual;
              
              const daysTotal = calculateTotalDays(baseDays, monthlyAccrual);
              const daysOff = docData.daysOff || 0;
              const daysRemaining = daysTotal - daysOff;
              const monthsAccrued = calculateMonthsAccrued(createdAt, currentDate);

              return {
                id: doc.id,
                ...docData,
                daysTotal,
                daysRemaining, // Calculate and include days remaining
                monthsAccrued,
                monthlyAccrual, // Include monthly accrual in the data
              };
            });

            // Cache the data
            dataCache.set('team_days_off_list', data, 60000); // Cache for 1 minute

            setTeamDaysOff(data);
            setIsLoading(false);
            setError(null);
            logger.log('✅ [useTeamDaysOff] Team days off fetched:', data.length);
          },
          (err) => {
            logger.error('❌ [useTeamDaysOff] Real-time error:', err);
            setError(err);
            setIsLoading(false);
          }
        );
      },
      false,
      'teamDaysOff',
      'team-days-off'
    );

    return () => {
      listenerManager.removeListener(listenerKey);
    };
  }, []);

  // Create team days off entry
  const createTeamDaysOff = useCallback(async (teamDaysOffData, adminUserData) => {
    try {
      const teamDaysOffRef = collection(db, 'teamDaysOff');
      
      // Check if user already exists (check userUID)
      const userUID = teamDaysOffData.userUID;
      const q = query(teamDaysOffRef, where('userUID', '==', userUID));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        throw new Error("User already has a days off entry");
      }

      // Calculate monthly accrual (starts at 0 for new entries)
      const monthlyAccrual = 0; // New entries start with 0 monthly accrual
      const baseDays = teamDaysOffData.baseDays || 0;
      const daysOff = teamDaysOffData.daysOff || 0;
      const daysTotal = baseDays + monthlyAccrual;
      const daysRemaining = daysTotal - daysOff;
      
      const newEntry = {
        ...teamDaysOffData,
        baseDays: baseDays,
        daysOff: daysOff,
        monthlyAccrual: monthlyAccrual, // Save monthly accrual in DB
        daysTotal: daysTotal, // Save total days in DB
        daysRemaining: daysRemaining, // Save days remaining in DB
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminUserData?.userUID,
        createdByName: adminUserData?.name
      };

      const docRef = await addDoc(teamDaysOffRef, newEntry);

      // Invalidate cache
      dataCache.delete('team_days_off_list');

      logger.log('Team days off entry created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (err) {
      logger.error('Error creating team days off entry:', err);
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
      const daysOff = updateData.daysOff !== undefined ? updateData.daysOff : (currentEntry?.daysOff || 0);
      const daysTotal = baseDays + monthlyAccrual;
      const daysRemaining = daysTotal - daysOff;
      
      const updates = {
        ...updateData,
        monthlyAccrual: monthlyAccrual, // Update monthly accrual in DB
        daysTotal: daysTotal, // Update total days in DB
        daysRemaining: daysRemaining, // Update days remaining in DB
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
  const deleteTeamDaysOff = useCallback(async (entryId, adminUserData) => {
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

  return {
    // Data
    teamDaysOff,
    isLoading,
    error,

    // CRUD Operations
    createTeamDaysOff,
    updateTeamDaysOff,
    deleteTeamDaysOff
  };
};

