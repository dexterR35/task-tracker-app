import { useCallback, useMemo,useDispatch, useSelector } from './useImports';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  resetAuth,
  initAuthListener,
} from '../features/auth/authSlice';
import { addNotification } from '../redux/slices/notificationSlice';
import { auth } from '../firebase'; 
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  /** Login */
  const login = useCallback(
    async (credentials) => {
      try {
        const result = await dispatch(loginUser(credentials)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: `Welcome, ${result.name || result.email}!`,
          })
        );
        return result;
      } catch (error) {
        dispatch(
          addNotification({
            type: 'error',
            message: error?.message || error || 'Login failed',
          })
        );
        throw error;
      }
    },
    [dispatch]
  );

  /** Logout */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'Successfully logged out',
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error?.message || error || 'Logout failed',
        })
      );
    }
  }, [dispatch]);





  /** Clear specific error key */
  const clearError = useCallback(
    (errorKey) => {
      dispatch(clearAuthError(errorKey));
    },
    [dispatch]
  );

  /** Reset auth slice */
  const reset = useCallback(() => {
    dispatch(resetAuth());
  }, [dispatch]);


  const reauthenticate = useCallback(async (password) => {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('No authenticated user found');
    }

    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      dispatch(
        addNotification({
          type: 'success',
          message: 'Reauthentication successful',
        })
      );
      return true;
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error?.message || 'Reauthentication failed',
        })
      );
      throw error;
    }
  }, [dispatch]);

  /** Derived helpers */
  const isReady = authState.initialAuthResolved && !authState.loading;

  /** Final return (memoized to avoid unnecessary rerenders) */
  return useMemo(
    () => ({
      user: authState.user,
      role: authState.role,
      isAuthenticated: authState.isAuthenticated,
      listenerActive: authState.listenerActive,
      initialAuthResolved: authState.initialAuthResolved,
      reauthRequired: authState.reauthRequired,
      loading: authState.loading,
      error: authState.error,
      isReady,

      login,
      logout,
     
      clearError,
      reset,
      reauthenticate,
    }),
    [
      authState,
      isReady,
      login,
      logout,
    
      clearError,
      reset,
      reauthenticate,
    ]
  );
};
