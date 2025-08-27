import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DynamicButton from "../ui/DynamicButton";
import Loader from "../ui/Loader";

const ReauthModal = ({ isOpen, onClose, onReauth, error, isProcessing }) => {
  // Validation schema for password
  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const initialValues = {
    password: "",
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await onReauth(values.password);
      resetForm();
      // Don't close modal immediately, let the parent component handle it
      // onClose will be called by the parent after auth state is restored
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {isProcessing ? (
        // Full screen loader when processing
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Loader 
            size="xl" 
            text="Reauthenticating..." 
            variant="spinner"
            fullScreen={true}
          />
        </div>
      ) : (
        <div className="bg-primary rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Session Expired</h3>
          <p className="text-gray-300 mb-4">
            Your session has expired. Please enter your password to continue.
          </p>
          
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <Field
                    name="password"
                    type="password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password && touched.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <DynamicButton
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </DynamicButton>
                  <DynamicButton
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Continue
                  </DynamicButton>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
};

export default ReauthModal; 