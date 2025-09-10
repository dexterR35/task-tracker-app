import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "@/features/auth";
import { showError } from "@/utils/toast";
import Loader from "@/components/ui/Loader/Loader";
import { loginSchema } from "@/components/forms/configs/useForms";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isLoading: authLoading, login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange'
  });

  // Show loading during sign-in process
  if (authLoading) {
    return (
      <div className="min-h-screen flex-center bg-primary">
        <Loader
          size="xl"
          text="Signing in..."
          variant="spinner"
          fullScreen={true}
        />
      </div>
    );
  }

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const { email, password } = data;
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      showError(error);
    }
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
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NetBet Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="Enter your NetBet email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Only @netbet.ro email addresses are accepted
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;