/**
 * Users API (PERN backend)
 */

import { useState, useEffect, useCallback } from 'react';
import { usersApi as api } from '@/app/api';
import { logger } from '@/utils/logger';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .list()
      .then((data) => {
        if (!cancelled) {
          setUsers(data.users || []);
        }
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
  }, []);

  return { users, isLoading, error };
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
    setIsLoading(true);
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
