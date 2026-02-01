/**
 * App Data Context
 * Holds app-level data only: users list (when admin). User/identity comes from AuthContext.
 * Role checks: use useAuth().user with authUtils (isAdmin, canManageUsers, canAccess, canAccessRole).
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUsers } from '@/features/users/usersApi';
import { useAuth } from '@/context/AuthContext';
import { isAdmin } from '@/utils/authUtils';

const defaultContextValue = {
  isInitialized: false,
  users: [],
  isLoading: true,
  error: null,
  isInitialLoading: true,
};

const AppDataContext = createContext(defaultContextValue);

export const useAppDataContext = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const userIsAdmin = isAdmin(user);

  React.useEffect(() => {
    if (!authLoading && user) setIsInitialized(true);
  }, [authLoading, user]);

  const { users: allUsers = [], isLoading: usersLoading, error: usersError } = useUsers();

  const error = usersError || null;
  const isLoading = usersLoading;
  const isInitialLoading = isLoading || !isInitialized;

  const contextValue = useMemo(
    () => ({
      isInitialized,
      users: userIsAdmin ? allUsers : [],
      isLoading: isLoading || !isInitialized,
      error,
      isInitialLoading,
    }),
    [isInitialized, userIsAdmin, allUsers, isLoading, error, isInitialLoading]
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;
