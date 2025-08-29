import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { logger } from '../../utils/logger';
import { sanitizeText } from '../sanitization';
import DynamicButton from '../../components/ui/DynamicButton';
import Loader from '../../components/ui/Loader';

// Conditional Field Component
const ConditionalField = ({ name, condition, children }) => {
  const { values } = useFormikContext();
  const fieldValue = values[name];
  
  // Check if condition is met
  const shouldShow = typeof condition === 'function' 
    ? condition(fieldValue, values) 
    : fieldValue === condition;
  
  if (!shouldShow) return null;
  
  return <>{children}</>;
};

const FormWrapper = ({
  initialValues,
  validationSchema,
  onSubmit,
  loading = false,
  error = null,
  className = "",
  debug = false,
  children,
  showSubmitButton = true, // New prop to control submit button display
  onFormReady = null, // Callback when form is ready
  ...props
}) => {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (values, formikHelpers) => {
    try {
      setIsSubmitting(true);
      setFormError(null);

      if (debug) {
        logger.log('Form submission:', { values });
      }

      // Call the onSubmit function (DynamicForm will handle sanitization)
      await onSubmit(values, formikHelpers);
      
    } catch (error) {
      logger.error('Form submission error:', error);
      setFormError(error.message || 'An error occurred during form submission');
      
      // Re-throw to let Formik handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, debug]);

  // Memoize form props
  const formProps = useMemo(() => ({
    initialValues,
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    ...props
  }), [initialValues, validationSchema, handleSubmit, props]);

  // Show loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <Formik {...formProps}>
      {(formikProps) => {
        const { isSubmitting: formikSubmitting, isValid, dirty, errors, touched } = formikProps;
        const submitting = isSubmitting || formikSubmitting;
        const hasErrors = Object.keys(errors).length > 0;
        const hasTouched = Object.keys(touched).length > 0;

        // Call onFormReady callback when form is ready
        useEffect(() => {
          if (onFormReady) {
            onFormReady(formikProps);
          }
        }, [onFormReady]); // Only depend on onFormReady to prevent infinite re-renders

        return (
          <div className={`form-wrapper ${className}`}>
            {/* Error Display */}
            {(error || formError) && (
              <div className="mb-4 p-3 bg-red-error/10 border border-red-error/20 rounded-lg">
                <p className="text-red-error text-sm">{error || formError}</p>
              </div>
            )}

            {/* Debug Information */}
            {!debug && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-xs">
                <h4 className="font-semibold mb-2">Debug Info:</h4>
                <div className="space-y-1">
                  <p><strong>Valid:</strong> {isValid ? 'Yes' : 'No'}</p>
                  <p><strong>Dirty:</strong> {dirty ? 'Yes' : 'No'}</p>
                  <p><strong>Errors:</strong> {Object.keys(errors).length}</p>
                  <p><strong>Touched:</strong> {Object.keys(touched).length}</p>
                  {hasErrors && (
                    <div>
                      <strong>Error Details:</strong>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(errors, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Content */}
            <Form className="space-y-6">
              {/* Render children with formik props only if they are React elements */}
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  // Only pass formikProps to React components, not DOM elements
                  const isReactComponent = typeof child.type === 'function' || typeof child.type === 'object';
                  if (isReactComponent) {
                    return React.cloneElement(child, { formikProps });
                  }
                  return child;
                }
                return child;
              })}

              {/* Submit Button */}
              {showSubmitButton && (
                <div className="flex justify-end space-x-3 pt-6">
                  <DynamicButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    loadingText="Submitting..."
                    disabled={submitting || (hasTouched && !isValid)}
                    iconName="check"
                    iconPosition="left"
                  >
                    Submit
                  </DynamicButton>
                </div>
              )}
            </Form>
          </div>
        );
      }}
    </Formik>
  );
};

// Add ConditionalField as a static property
FormWrapper.ConditionalField = ConditionalField;

export default FormWrapper;
