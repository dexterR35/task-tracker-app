import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "../hooks/useImports";
import DynamicButton from "../components/button/DynamicButton";
import netbetLogo from "../assets/netbet-logo.png";
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await login(values);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-center min-h-screen">
      <div className="card w-full max-w-md">
        <img
          src={netbetLogo}
          alt="NetBet Logo"
          className="h-fit w-45 object-contain mb-10 mx-auto"
        />
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label className="label" htmlFor="email">
                  Email Address
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="input w-full"
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
                  className="input w-full"
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
                loadingText="Log In..."
                successMessage="Login successful!"
                errorMessage="Login failed. Please try again."
              >
                Login
              </DynamicButton>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;
