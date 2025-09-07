import React from "react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { useCreateReporterMutation, useUpdateReporterMutation } from "@/features/reporters";
import { useAuth } from "@/features/auth";
import { reporterFormSchema, getReporterFormInitialValues, REPORTER_FORM_OPTIONS } from './reporterFormSchema';
import { sanitizeText, sanitizeEmail } from "@/components/forms/utils/sanitization";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { DynamicButton } from "@/components/ui";

const ReporterForm = ({
  mode = 'create', // 'create' or 'edit'
  reporterId = null,
  initialValues = null,
  onSuccess = null,
  className = "",
}) => {
  const { user } = useAuth();
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  
  // Get validation schema and initial values
  const validationSchema = reporterFormSchema;
  const formInitialValues = getReporterFormInitialValues(user, initialValues);
  
  // Form submission handler
  const handleSubmit = async (values, { setSubmitting, resetForm, setValues, setTouched, setErrors }) => {
    try {
      // Sanitize data directly
      const sanitizedData = {
        name: sanitizeText(values.name),
        email: sanitizeEmail(values.email),
        role: sanitizeText(values.role),
        departament: sanitizeText(values.departament),
        occupation: sanitizeText(values.occupation)
      };
      
      // Prepare data for database
      const dataForDatabase = {
        ...sanitizedData,
        createdBy: user?.uid || '',
        createdByName: user?.displayName || user?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (mode === 'create') {
        // Create new reporter
        await createReporter(dataForDatabase).unwrap();
        showSuccess('Reporter created successfully!');
        logger.log('Reporter created successfully', { reporterData: dataForDatabase });
      } else {
        // Update existing reporter
        await updateReporter({ id: reporterId, data: dataForDatabase }).unwrap();
        showSuccess('Reporter updated successfully!');
        logger.log('Reporter updated successfully', { reporterId, reporterData: dataForDatabase });
      }
      
      // Reset form to default values for create mode
      if (mode === 'create') {
        const resetValues = {
          name: "",
          email: "",
          role: "reporter",
          departament: "",
          occupation: "",
          createdBy: user?.uid || "",
          createdByName: user?.displayName || user?.email || ""
        };
        setValues(resetValues);
        setTouched({});
        setErrors({});
      } else {
        // For edit mode, just reset to initial values
        resetForm();
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      logger.error('Reporter submission failed', error);
      showError(error?.data?.message || 'Failed to save reporter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  
  const renderFormHeader = () => {
    const title = mode === 'edit' ? 'Edit Reporter' : 'Create New Reporter';
    const subtitle = mode === 'edit' 
      ? 'Update reporter information and save changes'
      : 'Fill in the details below to create a new reporter';
    
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
    );
  };
  
  return (
    <div className={`card bg-white-dark ${className}`}>
        {renderFormHeader()}
        
        <Formik
          initialValues={formInitialValues}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Field
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter reporter name"
                />
                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Field
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Role Field - Hidden, always reporter */}
              <Field name="role" type="hidden" value="reporter" />

              {/* Department Field */}
              <div>
                <label htmlFor="departament" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <Field
                  name="departament"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter department"
                />
                <ErrorMessage name="departament" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Occupation Field */}
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Occupation <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="occupation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select occupation</option>
                  {REPORTER_FORM_OPTIONS.occupations.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="occupation" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <DynamicButton
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  variant="primary"
                  size="md"
                  loadingText="Saving..."
                >
                  {mode === 'edit' ? 'Update Reporter' : 'Create Reporter'}
                </DynamicButton>
              </div>
            </Form>
          )}
        </Formik>
      </div>
  );
};

export default ReporterForm;