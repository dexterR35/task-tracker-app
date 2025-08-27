import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuthActions, useAuthState } from "../../shared/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
import { useEffect, useState } from "react";
import { 
  getRateLimitTimeRemaining, 
  getLockoutTimeRemaining,
  isAccountLocked,
  getSecurityRecommendations 
} from "../../shared/utils/security";


const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const { login, clearError } = useAuthActions();
  const { 
    isAuthenticated, 
    user, 
    lastLoginAttempt, 
    failedAttempts, 
    lastFailedAttempt 
  } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState(0);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Clear errors when location changes to login page
  useEffect(() => {
    if (location.pathname === "/login") {
      clearError();
    }
  }, [location.pathname, clearError]);

  // Update rate limit and lockout countdowns
  useEffect(() => {
    const updateCountdowns = () => {
      if (lastLoginAttempt) {
        const rateRemaining = getRateLimitTimeRemaining(lastLoginAttempt);
        setRateLimitTimeRemaining(rateRemaining);
      }
      
      if (lastFailedAttempt) {
        const lockoutRemaining = getLockoutTimeRemaining(lastFailedAttempt);
        setLockoutTimeRemaining(lockoutRemaining);
      }
    };
    
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, [lastLoginAttempt, lastFailedAttempt]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from || "/";
      const defaultRoute = user.role === "admin" ? "/admin" : "/user";
      const redirectTo = from === "/" ? defaultRoute : from;
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state?.from]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      await login(values);
      // Navigation will be handled by the useEffect above
      // based on authentication state and user role
    } catch (error) {
      logger.error("Login failed:", error);
      
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
      // Global errors will be handled by the notification system
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user is rate limited or account is locked
  const isRateLimited = rateLimitTimeRemaining > 0;
  const isAccountLocked = lockoutTimeRemaining > 0;
  const isDisabled = isRateLimited || isAccountLocked;

  return (
    <div className="flex-center min-h-screen">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8 mt-4">
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-fit w-38 object-contain mx-auto"
          />
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-6">
              <div>
                <label className="label" htmlFor="email">
                  Email Address
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className={`input w-full ${
                    errors.email && touched.email ? 'border-red-error' : ''
                  }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-error text-sm mt-1"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className={`input w-full ${
                    errors.password && touched.password ? 'border-red-error' : ''
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-error text-sm mt-1"
                />
              </div>

              <DynamicButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting || isDisabled}
                loading={isSubmitting}
                loadingText="Signing In..."
                iconName="login"
                iconPosition="left"
              >
                {isAccountLocked 
                  ? `Locked ${Math.ceil(lockoutTimeRemaining / (1000 * 60))}m` 
                  : isRateLimited 
                    ? `Wait ${Math.ceil(rateLimitTimeRemaining / 1000)}s` 
                    : "Login"
                }
              </DynamicButton>
              
              {/* Failed attempts counter */}
              {failedAttempts > 0 && !isAccountLocked && (
                <div className="text-center text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <p>Failed login attempts: {failedAttempts}/5</p>
                  <p className="text-xs mt-1">
                    Account will be locked after 5 failed attempts
                  </p>
                </div>
              )}

              {/* Account lockout warning */}
              {isAccountLocked && (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p>Account temporarily locked due to too many failed attempts.</p>
                  <p className="text-xs mt-1">
                    Time remaining: {Math.ceil(lockoutTimeRemaining / (1000 * 60))} minutes
                  </p>
                </div>
              )}

              {/* Rate limit warning */}
              {isRateLimited && !isAccountLocked && (
                <div className="text-center text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p>Too many rapid login attempts. Please wait before trying again.</p>
                  <p className="text-xs mt-1">
                    Time remaining: {Math.ceil(rateLimitTimeRemaining / 1000)} seconds
                  </p>
                </div>
              )}
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-xs">
            Need help? Contact your <span className="text-blue-default underline">administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
