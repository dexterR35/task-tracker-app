/**
 * App Data Context
 * User + auth only. No months, reporters, deliverables, or tasks.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUsers, useCurrentUser } from '@/features/users/usersApi';
import { useAuth } from "@/context/AuthContext";
import { isUserAdmin, isUserActive } from "@/features/utils/authUtils";

const defaultContextValue = {
  isInitialized: false,
  user: null,
  users: [],
  isAdmin: false,
  isLoading: true,
  error: null,
  isInitialLoading: true,
  canManageUsers: () => false,
};

const AppDataContext = createContext(defaultContextValue);

export const useAppDataContext = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const { isLoading: authLoading } = useAuth();
  const { user, isLoading: userLoading, error: userError } = useCurrentUser();
  const userIsAdmin = isUserAdmin(user);

  React.useEffect(() => {
    if (!authLoading && user) setIsInitialized(true);
  }, [authLoading, user]);

  const { users: allUsers = [], isLoading: usersLoading, error: usersError } = useUsers();

  const error = userError || usersError || null;
  const isLoading = userLoading || usersLoading;
  const isInitialLoading = isLoading || !isInitialized;

  const canManageUsers = (userData) => userData?.role === 'admin' && isUserActive(userData);

  const contextValue = useMemo(
    () => ({
      isInitialized,
      user,
      users: userIsAdmin ? allUsers : [],
      isAdmin: userIsAdmin,
      isLoading: isLoading || !isInitialized,
      error,
      isInitialLoading,
      canManageUsers,
    }),
    [
      isInitialized,
      userIsAdmin,
      user,
      allUsers,
      isLoading,
      error,
      isInitialLoading,
    ]
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;
