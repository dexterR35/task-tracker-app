import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { showError } from "@/utils/toast";
import ReactHookFormWrapper from "@/components/forms/ReactHookFormWrapper";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();

  // Handle form success (login successful)
  const onSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  // Handle form error (login failed)
  const onError = (error) => {
    showError(error);
  };

  return (
    <div className="min-h-screen flex-center bg-primary">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your account
            </p>
          </div>
          
          <ReactHookFormWrapper
            formType="login"
            mode="create"
            onSuccess={onSuccess}
            onError={onError}
            className=""
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;