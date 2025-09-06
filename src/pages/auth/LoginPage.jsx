import { useLocation, useNavigate } from "react-router-dom";
import netbetLogo from "@/assets/netbet-logo.png";
import { useEffect, useRef } from "react";
import { Formik, Field } from "formik";
import { useAuth } from "@/features/auth";
import { LOGIN_FORM_FIELDS } from "@/components/forms/configs/useForms";
import { buildFormValidationSchema } from "@/components/forms/utils/validation";
import { showError, showSuccess } from "@/utils/toast";
import { FIELD_TYPES } from "@/components/forms/configs/fieldTypes";
import { DynamicButton } from "@/components/ui";
import Loader from "@/components/ui/Loader/Loader";
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthChecking, isLoading: authLoading, login } = useAuth();
  const hasShownWelcome = useRef(false);
  
  
  const fields = LOGIN_FORM_FIELDS;
  
  // Build validation schema
  const validationSchema = buildFormValidationSchema(fields);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isAuthChecking && !authLoading && user) {
      // Show welcome message if we just logged in (not on page refresh)
      if (!hasShownWelcome.current) {
        const welcomeMessage = `Welcome, ${user.name || user.email}! 👋`;
        showSuccess(welcomeMessage, { 
          autoClose: 3000,
          position: "top-center"
        });
        hasShownWelcome.current = true;
      }
      
      // Navigate to intended destination or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, isAuthChecking, authLoading, navigate, location.state]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const { email, password, rememberMe } = values;
      
      // Use Redux auth system - this will properly update auth state
      await login({ email, password });
      
      // Don't navigate here - let the auth state change and useEffect handle the redirect
      // This prevents the login form from briefly flashing after successful login
      
    } catch (error) {
      // Handle specific auth errors
      if (error.includes('email')) {
        setFieldError('email', error);
      } else if (error.includes('password')) {
        setFieldError('password', error);
      } else {
        showError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderField = (field, formik) => {
    const hasError = formik.touched[field.name] && formik.errors[field.name];
    
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";
    const errorClasses = hasError ? "border-red-500" : "border-gray-300";
    const disabledClasses = field.disabled ? "bg-gray-100 cursor-not-allowed" : "";
    const inputClasses = `${baseClasses} ${errorClasses} ${disabledClasses}`;
    
    // Filter out properties that shouldn't be passed to input elements
    const { sanitize, validation, conditional, ...fieldProps } = field;
    
    return (
      <div key={field.name} className="field-wrapper">
        {field.label && (
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <Field name={field.name}>
          {({ field: formikFieldProps, meta }) => {
            if (field.type === FIELD_TYPES.CHECKBOX) {
              return (
                <>
                  <div className="flex items-start space-x-3">
                    <input
                      {...formikFieldProps}
                      {...fieldProps}
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    {field.description && (
                      <span className="text-sm text-gray-500">{field.description}</span>
                    )}
                  </div>
                  {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                </>
              );
            }
            
            return (
              <>
                <input
                  {...formikFieldProps}
                  {...fieldProps}
                  type={field.type === FIELD_TYPES.EMAIL ? 'email' : field.type === FIELD_TYPES.PASSWORD ? 'password' : 'text'}
                  className={inputClasses}
                />
                {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
              </>
            );
          }}
        </Field>
        
        {field.helpText && (
          <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex justify-center">
            <img className="h-12 w-auto" src={netbetLogo} alt="NetBet" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to access the task tracker
          </p>
        </div>
        
        <Formik
          initialValues={{
            email: '',
            password: '',
            rememberMe: false
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
              <div className="space-y-4">
                {fields.map(field => renderField(field, formik))}
              </div>
              
              <div>
                <DynamicButton
                  type="submit"
                  disabled={formik.isSubmitting}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Sign in
                </DynamicButton>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;