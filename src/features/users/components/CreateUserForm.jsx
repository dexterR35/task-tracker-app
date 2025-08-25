import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useCreateUserMutation } from "../usersApi";
import { useNotifications } from "../../../shared/hooks/useNotifications";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import { sanitizeUserCreationData, validateUserCreationData } from "../../../shared/utils/sanitization";

const CreateUserForm = ({ onSuccess, onCancel, className = "" }) => {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const { addSuccess, addError } = useNotifications();

  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    occupation: "user", // Default occupation
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required")
      .max(100, "Email must be less than 100 characters"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: Yup.string()
      .required("Please confirm your password")
      .oneOf([Yup.ref("password"), null], "Passwords must match"),
    occupation: Yup.string()
      .required("Occupation is required")
      .oneOf(["designer", "developer", "video-editor", "admin", "user"], "Please select a valid occupation"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // First sanitize the data
      const sanitizedData = sanitizeUserCreationData(values);
      
      // Then validate the sanitized data (additional server-side validation)
      const validationErrors = validateUserCreationData(sanitizedData);
      if (validationErrors.length > 0) {
        addError(validationErrors[0]); // Show first error
        return;
      }

      const result = await createUser({
        name: sanitizedData.name,
        email: sanitizedData.email,
        password: sanitizedData.password,
        confirmPassword: sanitizedData.confirmPassword,
        occupation: sanitizedData.occupation,
      }).unwrap();

      addSuccess(`User "${result.name}" created successfully!`);

      // Reset form
      resetForm();

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      addError(error.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const renderField = (field) => {
    const { meta } = field;
    const hasError = meta.touched && meta.error;
    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;
    return { baseInputClasses, hasError };
  };

  return (
    <div className="bg-primary rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create New User
        </h2>
        <p className="text-gray-600">Add a new user to the system</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="space-y-4">
            {/* Name Field */}
            <Field name="name">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Full Name *
                    </label>
                    <input
                      {...field.field}
                      type="text"
                      id="name"
                      placeholder="Enter full name"
                      className={baseInputClasses}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>

            {/* Email Field */}
            <Field name="email">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address *
                    </label>
                    <input
                      {...field.field}
                      type="email"
                      id="email"
                      placeholder="Enter email address"
                      className={baseInputClasses}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>

            {/* Password Field */}
            <Field name="password">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password *
                    </label>
                    <input
                      {...field.field}
                      type="password"
                      id="password"
                      placeholder="Enter password"
                      className={baseInputClasses}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Password must be at least 6 characters with uppercase, lowercase,
                      and number
                    </div>
                  </div>
                );
              }}
            </Field>

            {/* Confirm Password Field */}
            <Field name="confirmPassword">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password *
                    </label>
                    <input
                      {...field.field}
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirm password"
                      className={baseInputClasses}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>

            {/* Occupation Field */}
            <Field name="occupation">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label
                      htmlFor="occupation"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Occupation *
                    </label>
                    <select
                      {...field.field}
                      id="occupation"
                      className={baseInputClasses}
                      disabled={isSubmitting}
                    >
                      <option value="user">General User</option>
                      <option value="designer">Designer</option>
                      <option value="developer">Developer</option>
                      <option value="video-editor">Video Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ErrorMessage
                      name="occupation"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <DynamicButton
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </DynamicButton>
              <DynamicButton
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                loadingText="Creating..."
                disabled={!isValid}
                className="flex-1"
              >
                Create User
              </DynamicButton>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateUserForm;
