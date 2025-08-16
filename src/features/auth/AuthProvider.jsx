import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { prehydrateAuth } from './authSlice';

let listenerBooted = false;

// Boots the persistent auth listener; prehydrates from cached user to avoid flicker.
export const AuthProvider = ({ children }) => {
  const { startListener } = useAuth();
  const dispatch = useDispatch();
  const initialAuthResolved = useSelector(s => s.auth.initialAuthResolved);
  const prehydrateRun = useRef(false);

  // Synchronous prehydrate attempt (runs during render once) before effect
  if (!prehydrateRun.current && !initialAuthResolved) {
    prehydrateRun.current = true;
    dispatch(prehydrateAuth());
  }

  useEffect(() => {
    if (listenerBooted) return;
    listenerBooted = true;
    startListener();
  }, [startListener]);

  return children;
};
