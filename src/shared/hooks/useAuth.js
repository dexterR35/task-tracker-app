import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  clearReauth,
  requireReauth,
  authStateChanged,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectReauthRequired,
  selectReauthMessage,
  selectUserRole,
  selectIsAdmin,
  selectIsUser,
  selectUserPermissions,
  selectIsUserActive,
  selectLastLoginAttempt,
  selectCanAccessAdmin,
  selectCanAccessUser,
} from '../../features/auth/authSlice';
import { auth, db } from '../../app/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import {
  showWelcomeMessage,
  showLogoutSuccess,
  showAuthError,
  showReauthSuccess,
  showReauthError,
} from '../utils/toast';
import { logger } from '../utils/logger';

// Hook for auth actions only (login, logout, etc.)
export const useAuthActions = () => {
  const dispatch = useDispatch();

  /** Login */
  const login = useCallback(
    async (credentials) => {
      try {
        const result = await dispatch(loginUser(credentials)).unwrap();
        showWelcomeMessage(result.name || result.email);
        return result;
      } catch (error) {
        showAuthError(error?.message || error || 'Login failed');
        throw error;
      }
    },
    [dispatch]
  );

  /** Logout */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      showLogoutSuccess();
    } catch (error) {
      showAuthError(error?.message || error || 'Logout failed');
    }
  }, [dispatch]);

  /** Handle reauthentication */
  const handleReauth = useCallback(async (password) => {
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }

      logger.log("Starting reauthentication process...");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      logger.log("Reauthentication successful, clearing reauth requirement...");
      // Clear reauth requirement
      dispatch(clearReauth());
      
      // Force a token refresh to ensure the session is properly restored
      await user.getIdToken(true);
      
      // Manually restore the auth state by fetching user data and dispatching authStateChanged
      logger.log("Manually restoring auth state...");
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          
          // Check if user is active
          if (firestoreData.isActive === false) {
            throw new Error("Account is deactivated. Please contact administrator.");
          }
          
          // Create normalized user object
          const normalizedUser = {
            uid: user.uid,
            email: user.email,
            name: firestoreData.name || "",
            role: firestoreData.role,
            occupation: firestoreData.occupation || "user",
            createdAt: firestoreData.createdAt ? 
              (typeof firestoreData.createdAt.toDate === "function" 
                ? firestoreData.createdAt.toDate().getTime() 
                : typeof firestoreData.createdAt === "number" 
                  ? firestoreData.createdAt 
                  : new Date(firestoreData.createdAt).getTime()) 
              : null,
            permissions: firestoreData.permissions || [],
            isActive: firestoreData.isActive !== false,
          };
          
          // Dispatch auth state changed to restore the user
          dispatch(authStateChanged({ user: normalizedUser }));
          logger.log("Auth state restored successfully");
        } else {
          throw new Error("User data not found");
        }
      } catch (error) {
        logger.error("Error restoring auth state:", error);
        throw error;
      }
      
      logger.log("Token refreshed, reauthentication complete");
      showReauthSuccess();
      return true;
    } catch (error) {
      logger.error("Reauthentication failed:", error);
      showReauthError(error?.message);
      throw error;
    }
  }, [dispatch]);

  /** Force reauthentication */
  const forceReauth = useCallback((message = 'Please sign back in to continue') => {
    dispatch(requireReauth({ message }));
  }, [dispatch]);

  /** Clear specific error */
  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  /** Clear reauth requirement */
  const clearReauthRequirement = useCallback(() => {
    dispatch(clearReauth());
  }, [dispatch]);

  const reauthenticate = useCallback(async (password) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    dispatch(clearReauth());
    return true;
  }, [dispatch]);

  return {
    login,
    logout,
    handleReauth,
    forceReauth,
    clearError,
    clearReauthRequirement,
    reauthenticate,
  };
};

// Hook for auth state only (user, isAuthenticated, etc.)
export const useAuthState = () => {
  // Use selectors for better performance
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  const reauthRequired = useSelector(selectReauthRequired);
  const reauthMessage = useSelector(selectReauthMessage);
  const role = useSelector(selectUserRole);
  const isAdmin = useSelector(selectIsAdmin);
  const isUser = useSelector(selectIsUser);
  const permissions = useSelector(selectUserPermissions);
  const isUserActive = useSelector(selectIsUserActive);
  const lastLoginAttempt = useSelector(selectLastLoginAttempt);
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);

  // Memoized computed values
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission) || isAdmin;
  }, [permissions, isAdmin]);

  const canAccess = useCallback((requiredRole) => {
    if (!isAuthenticated || !isUserActive) return false;
    if (requiredRole === 'admin') return isAdmin;
    if (requiredRole === 'user') return isUser || isAdmin;
    return true;
  }, [isAuthenticated, isUserActive, isAdmin, isUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    role,
    isAdmin,
    isUser,
    permissions,
    isUserActive,
    lastLoginAttempt,
    canAccessAdmin,
    canAccessUser,
    hasPermission,
    canAccess,
    reauthRequired,
    reauthMessage,
    error,
  };
};

// Full useAuth hook (for backward compatibility)
export const useAuth = () => {
  const authActions = useAuthActions();
  const authState = useAuthState();

  return {
    ...authState,
    ...authActions,
  };
};
