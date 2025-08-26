import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuthActions, useAuthState } from "../../shared/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import netbetLogo from "../../assets/netbet-logo.png";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectIsAdmin } from "../../features/auth/authSlice";

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
  const { isAuthenticated, user } = useAuthState();
  const isAdmin = useSelector(selectIsAdmin);
  const navigate = useNavigate();
  const location = useLocation();

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from || "/";
      const defaultRoute = isAdmin ? "/admin" : "/user";
      const redirectTo = from === "/" ? defaultRoute : from;
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state?.from, isAdmin]);

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      await login(values);
      // Navigation will be handled by the useEffect above
      // based on authentication state and user role
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle specific field errors
      if (error.message?.includes("email")) {
        setFieldError("email", error.message);
      } else if (error.message?.includes("password")) {
        setFieldError("password", error.message);
      }
      // Global errors will be handled by the notification system
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-center min-h-screen">
      <div className="card w-full max-w-md bg-primary shadow-2xl">
        <div className="text-center mb-8">
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-fit w-45 object-contain mx-auto mb-4"
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
                  className="text-red-error text-sm mt-2"
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
                  className="text-red-error text-sm mt-2"
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
          )}
        </Formik>

        <div className="mt-8 text-center">
          <p className="text-sm !text-gray-500">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
