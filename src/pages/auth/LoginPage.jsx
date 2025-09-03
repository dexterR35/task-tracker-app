import { useLocation, useNavigate } from "react-router-dom";
import netbetLogo from "@/assets/netbet-logo.png";
import { useEffect, useState } from "react";
import { logger } from "@/utils/logger";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase";
import { useAuth } from "@/features/auth";
import { DynamicForm } from "@/components/forms";
import { LOGIN_FORM_FIELDS } from "@/components/forms/configs";
import { showSuccess, showError } from "@/utils/toast";


const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthChecking, isLoading: authLoading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isAuthChecking && !authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthChecking, authLoading, navigate]);

  // Show loading while checking authentication
  const showLoading = isAuthChecking || authLoading;

  // Clear errors when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  // Clear errors when location changes to login page
  useEffect(() => {
    if (location.pathname === "/login") {
      setError(null);
    }
  }, [location.pathname]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use Firebase auth directly without Redux
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        values.email, 
        values.password
      );
      
      logger.log("Login successful:", userCredential.user.email);
      
      // Show success message
      showSuccess("Login successful! first message");
      
      // After successful login, redirect to dashboard
      // The user data will be available after Firebase auth completes
      navigate('/dashboard', { replace: true });
      
    } catch (error) {
      logger.error("Login failed:", error);
      setError(error.message);
      
      // Handle rate limiting error
      if (error.message?.includes("Too many login attempts")) {
        setFieldError("password", error.message);
      }
      // Handle specific field errors
      else if (error.message?.includes("email")) {
        setFieldError("email", error.message);
      } else if (error.message?.includes("password")) {
        setFieldError("password", error.message);
      }
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-center min-h-screen">
      {showLoading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      ) : !user ? (
        <div className="card w-full max-w-md">
          {/* <div className="text-center mb-8 mt-4">
            <img
              src={netbetLogo}
              alt="NetBet Logo"
              className="h-fit w-38 object-contain mx-auto"
            />
          </div> */}

          <DynamicForm
            fields={LOGIN_FORM_FIELDS}
            initialValues={{ 
              email: "", 
              password: "", 
              rememberMe: false 
            }}
            onSubmit={handleSubmit}

            error={error}
            className="space-y-6"
            submitText="Login"
            submitButtonProps={{
              loadingText: "Signing In...",
              iconName: "login",
              iconPosition: "left"
            }}
          />

          <div className="mt-6 text-center">
            <p className="text-xs">
              Need help? Contact your <span className="text-blue-default underline">administrator 2</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LoginPage;
