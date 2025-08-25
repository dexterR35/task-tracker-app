import React from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "../../shared/components/ui/Loader";

const HomePage = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  // Show loading only if auth state is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]">
        <Loader 
          text="Checking authentication..." 
          size="lg"
          variant="dots"
        />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, redirect based on role
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // Default to user dashboard
  return <Navigate to="/user" replace />;
};

export default HomePage;
