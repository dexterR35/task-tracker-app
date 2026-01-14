
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { logger } from "@/utils/logger";

/**
 * Users Hook - Fetches all users (for tables, lists, dropdowns)
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    // Firebase onSnapshot provides real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, // Firestore document ID
            userUID: data.userUID, // User UID (important for matching)
            ...data
          };
        });

        setUsers(usersData);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useUsers] Users updated:', usersData.length);
      },
      (err) => {
        logger.error('❌ [useUsers] Real-time error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup: unsubscribe when component unmounts
    return () => unsubscribe();
  }, []);

  return {
    // Data
    users,
    isLoading,
    error
  };
};

/**
 * User by UID Hook - Fetches only one user by userUID (for user details, profile pages)
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

    setIsLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userUID', '==', userUID));

    // Firebase onSnapshot provides real-time updates for single user
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setUser(null);
          setIsLoading(false);
          setError(null);
          logger.log('⚠️ [useUserByUID] No user found with UID:', userUID);
          return;
        }

        const doc = snapshot.docs[0];
        const userData = doc.data();
        const userObj = {
          id: doc.id, // Firestore document ID
          userUID: userData.userUID, // User UID (important for matching)
          ...userData
        };

        setUser(userObj);
        setIsLoading(false);
        setError(null);
        logger.log('✅ [useUserByUID] User updated:', userUID);
      },
      (err) => {
        logger.error('❌ [useUserByUID] Real-time error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup: unsubscribe when component unmounts or userUID changes
    return () => unsubscribe();
  }, [userUID]);

  return {
    user,
    isLoading,
    error
  };
};