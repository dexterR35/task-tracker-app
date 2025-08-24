// src/features/auth/AuthProvider.jsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initAuthListener, unsubscribeAuthListener } from "../../features/auth/authSlice";
import { useAuth } from "../hooks/useAuth";

// Spinner loader component using Tailwind CSS
const Spinner = () => (
  <div className="border-4 border-t-4 border-gray-200 border-t-red-500 rounded-full w-12 h-12 animate-spin"></div>
);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  // Get the single source of truth for the app's ready state
  const { initialAuthResolved } = useSelector((state) => state.auth);
  const { user } = useAuth();

  useEffect(() => {
    // Start the persistent auth listener on mount
    dispatch(initAuthListener());

    // Clean up the listener on unmount to prevent memory leaks
    return () => {
      unsubscribeAuthListener();
    };
  }, [dispatch]);

  // If auth state hasn't been resolved, show the spinner
  if (!initialAuthResolved) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#141C33]">
        <Spinner />
      </div>
    );
  }

  // Once resolved, render the rest of the app
  return children;
};
