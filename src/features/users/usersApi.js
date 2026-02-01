/**
 * Users API (PERN backend)
 * Fetch logic lives here. Only AppDataContext uses these hooks so data stays global.
 */

import { useState, useEffect } from 'react';
import { usersApi as api, getSocket } from '@/app/api';
import { useAuth } from '@/context/AuthContext';
import { isAdmin } from '@/features/utils/authUtils';
import { logger } from '@/utils/logger';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isLoading: authLoading } = useAuth();
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    if (authLoading || !user || !userIsAdmin) {
      setUsers([]);
      setError(null);
      setIsLoading(authLoading);
      return;
    }
    let cancelled = false;
    setError(null);
    api
      .list()
      .then((data) => {
        if (!cancelled) setUsers(data.users || []);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('[useUsers]', err);
          setError(err);
          setUsers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [authLoading, user, userIsAdmin]);

  // Real-time: merge server-emitted user:updated into list so Users table updates without refetch
  useEffect(() => {
    if (!userIsAdmin) return;
    const socket = getSocket();
    if (!socket) return;
    const onUserUpdated = (updatedUser) => {
      if (!updatedUser?.id) return;
      setUsers((prev) =>
        prev.some((u) => u.id === updatedUser.id)
          ? prev.map((u) => (u.id === updatedUser.id ? { ...updatedUser } : u))
          : prev
      );
    };
    socket.on('user:updated', onUserUpdated);
    return () => socket.off('user:updated', onUserUpdated);
  }, [userIsAdmin]);

  return { users, isLoading: authLoading || isLoading, error };
};

export const useUserById = (userId) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    api
      .getById(userId)
      .then((data) => {
        if (!cancelled) setUser(data.user || null);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('[useUserById]', err);
          setError(err);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return { user, isLoading, error };
};

/**
 * Single hook for the current logged-in user.
 * Admins: auth user (no extra fetch). Non-admins: profile from /api/users/:id, fallback to auth user.
 */
export const useCurrentUser = () => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const userIsAdmin = isAdmin(authUser);
  const userId = authUser?.id ?? null;

  const { user: profileUser, isLoading: profileLoading, error: profileError } = useUserById(
    userIsAdmin ? null : userId
  );

  if (!authUser) {
    return { user: null, isLoading: authLoading, error: null };
  }
  if (userIsAdmin) {
    return { user: authUser, isLoading: false, error: null };
  }
  return {
    user: profileUser ?? authUser,
    isLoading: profileLoading,
    error: profileError,
  };
};
