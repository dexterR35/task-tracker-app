import React from "react";
import { Formik, Field } from "formik";
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
  
  // Custom field change handler for field-specific logic
  const handleFieldChange = useCallback((fieldName, event, formikHelpers) => {
    const fieldConfig = fields.find(f => f.name === fieldName);
    
    // Create form object for field-specific logic
    const form = {
      setFieldValue: formikHelpers.setFieldValue,
      getFieldValue: (name) => formikHelpers.values[name],
      values: formikHelpers.values
    };
    
    // Call field-specific onChange if it exists (no sanitization here)
    fieldConfig?.onChange?.(event, form);
  }, [fields]);
  
  // Custom field blur handler for field-specific logic
  const handleFieldBlur = useCallback((fieldName, event, formikHelpers) => {
    const fieldConfig = fields.find(f => f.name === fieldName);
    
    // Create form object for field-specific logic
    const form = {
      setFieldValue: formikHelpers.setFieldValue,
      getFieldValue: (name) => formikHelpers.values[name],
      values: formikHelpers.values
    };
    
    // Call field-specific onBlur if it exists
    fieldConfig?.onBlur?.(event, form);
  }, [fields]);
  
  
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
          {(formik) => (
            <>
              {fields.map(field => (
                <div key={field.name} className="field-wrapper">
                  {field.label && (
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  
                  <Field name={field.name}>
                    {({ field: fieldProps, meta }) => (
                      <>
                        {field.type === FIELD_TYPES.SELECT ? (
                        <select
                          {...fieldProps}
                          {...field}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                          onChange={(e) => {
                            fieldProps.onChange(e);
                            handleFieldChange(field.name, e, formik);
                          }}
                          onBlur={(e) => {
                            fieldProps.onBlur(e);
                            handleFieldBlur(field.name, e, formik);
                          }}
                        >
                          <option value="">{field.placeholder || 'Select an option'}</option>
                          {field.options?.map((option) => (
                            <option key={option.value || option} value={option.value || option}>
                              {option.label || option}
                            </option>
                          ))}
                        </select>
                      ) : field.type === FIELD_TYPES.CHECKBOX ? (
                        <div className="flex items-start space-x-3">
                          <input
                            {...fieldProps}
                            {...field}
                            type="checkbox"
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            onChange={(e) => {
                              fieldProps.onChange(e);
                              handleFieldChange(field.name, e, formik);
                            }}
                            onBlur={(e) => {
                              fieldProps.onBlur(e);
                              handleFieldBlur(field.name, e, formik);
                            }}
                          />
                          {field.description && (
                            <span className="text-sm text-gray-500">{field.description}</span>
                          )}
                        </div>
                      ) : (
                        <input
                          {...fieldProps}
                          {...field}
                          type={field.type === FIELD_TYPES.EMAIL ? 'email' : 'text'}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                          onChange={(e) => {
                            fieldProps.onChange(e);
                            handleFieldChange(field.name, e, formik);
                          }}
                          onBlur={(e) => {
                            fieldProps.onBlur(e);
                            handleFieldBlur(field.name, e, formik);
                          }}
                        />
                      )}
                      {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                    </>
                  )}
                </Field>
                
                {field.helpText && (
                  <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <DynamicButton
                onClick={formik.handleSubmit}
                disabled={formik.isSubmitting}
                loading={formik.isSubmitting}
                variant="primary"
                size="md"
                loadingText="Saving..."
              >
                {mode === 'edit' ? 'Update Reporter' : 'Create Reporter'}
              </DynamicButton>
            </div>
          </>
        )}
      </Formik>
      </div>
  );
};

export default ReporterForm;