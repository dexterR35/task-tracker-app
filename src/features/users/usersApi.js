/**
 * Users API (Direct Firestore with Snapshots)
 *
 * @fileoverview Direct Firestore hooks for users with real-time updates
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
  getDocs,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";
import dataCache from "@/utils/dataCache";
import listenerManager from "@/features/utils/firebaseListenerManager";

/**
 * Check if user email already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} - True if email exists
 */
const checkUserEmailExists = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    logger.error('Error checking user email:', error);
    return false;
  }
};

/**
 * Users Hook (One-time fetch - Users are relatively static data)
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const cacheKey = 'users_list';

        // Check cache first
        const cachedData = dataCache.get(cacheKey);
        if (cachedData) {
          logger.log('🔍 [useUsers] Using cached users data');
          setUsers(cachedData);
          setIsLoading(false);
          setError(null);
          return;
        }

        logger.log('🔍 [useUsers] Fetching users from Firestore');
        setIsLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Cache the data indefinitely (users are manually managed and never change)
        dataCache.set(cacheKey, usersData, Infinity);

        setUsers(usersData);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useUsers] Users fetched and cached:', usersData.length);
      } catch (err) {
        logger.error('❌ [useUsers] Fetch error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Create user
  const createUser = useCallback(async (userData, adminUserData) => {
    try {
      // Check if email already exists
      const emailExists = await checkUserEmailExists(userData.email);
      if (emailExists) {
        throw new Error("User with this email already exists");
      }

      const usersRef = collection(db, 'users');
      const newUser = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminUserData?.uid,
        createdByName: adminUserData?.name
      };

      const docRef = await addDoc(usersRef, newUser);

      // Invalidate cache when data changes
      dataCache.delete('users_list');

      logger.log('User created successfully:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (err) {
      logger.error('Error creating user:', err);
      throw err;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userId, updateData, adminUserData) => {
    try {
      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const emailExists = await checkUserEmailExists(updateData.email);
        if (emailExists) {
          throw new Error("User with this email already exists");
        }
      }

      const userRef = doc(db, 'users', userId);
      const updates = {
        ...updateData,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserData?.uid,
        updatedByName: adminUserData?.name
      };

      await updateDoc(userRef, updates);

      // Invalidate cache when data changes
      dataCache.delete('users_list');

      logger.log('User updated successfully:', userId);
      return { success: true };
    } catch (err) {
      logger.error('Error updating user:', err);
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId, adminUserData) => {
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);

      // Invalidate cache when data changes
      dataCache.delete('users_list');

      logger.log('User deleted successfully:', userId);
      return { success: true };
    } catch (err) {
      logger.error('Error deleting user:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    users,
    isLoading,
    error,

    // CRUD Operations
    createUser,
    updateUser,
    deleteUser
  };
};

/**
 * User by UID Hook (Direct Firestore with Snapshots)
 */
export const useUserByUID = (userUID) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userUID) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const listenerKey = `user_by_uid_${userUID}`;

    listenerManager.addListener(
      listenerKey,
      () => {
        setIsLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('userUID', '==', userUID));

        return onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              setUser(null);
            } else {
              const userData = snapshot.docs[0].data();
              setUser({
                id: snapshot.docs[0].id,
                ...userData
              });
            }
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            logger.error('User by UID real-time error:', err);
            setError(err);
            setIsLoading(false);
          }
        );
      },
      false, // Don't preserve - can be paused when tab hidden
      'users',
      'user-profile'
    );

    return () => {
      listenerManager.removeListener(listenerKey);
    };
  }, [userUID]);

  return { user, isLoading, error };
};

// Export hooks for backward compatibility
export const useGetUsersQuery = useUsers;
export const useGetUserByUIDQuery = useUserByUID;
export const useCreateUserMutation = () => {
  const { createUser } = useUsers();
  return [createUser];
};
export const useUpdateUserMutation = () => {
  const { updateUser } = useUsers();
  return [updateUser];
};
export const useDeleteUserMutation = () => {
  const { deleteUser } = useUsers();
  return [deleteUser];
};

/**
 * Fetch user by UID from Firestore (direct function for AuthContext)
 * @param {string} userUID - User UID to fetch
 * @returns {Promise<Object|null>} - User data or null if not found
 */
export const fetchUserByUIDFromFirestore = async (userUID) => {
  try {
    if (!userUID) {
      logger.error('fetchUserByUIDFromFirestore: userUID is required');
      return null;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userUID', '==', userUID));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.log('fetchUserByUIDFromFirestore: No user found with UID:', userUID);
      return null;
    }

    const userData = snapshot.docs[0].data();
    const user = {
      id: snapshot.docs[0].id,
      ...userData
    };

    logger.log('fetchUserByUIDFromFirestore: User found:', user.id);
    return user;
  } catch (error) {
    logger.error('fetchUserByUIDFromFirestore: Error fetching user:', error);
    return null;
  }
};
