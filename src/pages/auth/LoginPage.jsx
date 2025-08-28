import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
import { useEffect, useState } from "react";
import { logger } from "../../shared/utils/logger";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../app/firebase";
import { useAuth } from "../../shared/hooks/useAuth";

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, canAccess, isAuthChecking, isLoading: authLoading } = useAuth();

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (!isAuthChecking && !authLoading && user) {
      const isAdmin = canAccess('admin');
      const redirectTo = isAdmin ? '/admin' : '/user';
      navigate(redirectTo, { replace: true });
    }
  }, [user, canAccess, isAuthChecking, authLoading, navigate]);

  // Show loading while checking authentication
  const showLoading = isAuthChecking || authLoading;

  // Don't render login form if user is authenticated
  // Instead of conditional return, we'll conditionally render the content

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
      
      // After successful login, redirect to appropriate dashboard
      // The user data will be available after Firebase auth completes
      const isAdmin = canAccess('admin');
      const redirectTo = isAdmin ? '/admin' : '/user';
      navigate(redirectTo, { replace: true });
      
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
              <>
                {error && (
                  <div className="mb-4 p-3 bg-red-error/10 border border-red-error/20 rounded-lg">
                    <p className="text-red-error text-sm">{error}</p>
                  </div>
                )}
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
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    loadingText="Signing In..."
                    iconName="login"
                    iconPosition="left"
                  >
                    Login
                  </DynamicButton>
                </Form>
              </>
            )}
          </Formik>

          <div className="mt-6 text-center">
            <p className="text-xs">
              Need help? Contact your <span className="text-blue-default underline">administrator</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LoginPage;
