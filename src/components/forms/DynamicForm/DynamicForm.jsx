import React, { useCallback, useMemo } from 'react';
import { Formik, Form, Field } from 'formik';
import { buildFormValidationSchema } from '@/components/forms';
import { getComponentForField, getFieldDefaultProps } from '@/components/forms/configs/fieldTypes';
import { extractTaskNumber } from '@/components/forms/utils/validation/validationRules';
import { showInfo, showError } from '@/utils/toast';
import { logger } from '@/utils/logger';
import { FIELD_TYPES } from '@/components/forms/configs/fieldTypes';

// Helper function to check if field should be visible
const shouldShowField = (field, values) => {
  if (!field.conditional) return true;
  
  const { field: conditionalField, value: conditionalValue, and } = field.conditional;
  const fieldValue = values[conditionalField];
  
  // Check main condition
  let mainCondition = false;
  if (typeof conditionalValue === 'function') {
    mainCondition = conditionalValue(fieldValue, values);
  } else {
    mainCondition = fieldValue === conditionalValue;
  }
  
  // If no 'and' condition, return main condition
  if (!and) return mainCondition;
  
  // Check 'and' condition (for complex cases like deliverables + "others")
  const { field: andField, value: andValue } = and;
  const andFieldValue = values[andField];
  
  let andCondition = false;
  if (typeof andValue === 'function') {
    andCondition = andValue(andFieldValue, values);
  } else {
    andCondition = andFieldValue === andValue;
  }
  
  return mainCondition && andCondition;
};

const DynamicForm = ({ 
  fields = [], 
  initialValues = {}, 
  onSubmit, 
  options = {},
  className = '',
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  onCancel,
  showCancelButton = false,
  isLoading = false,
  disabled = false
}) => {
  // Build validation schema using the dedicated validation system
  const validationSchema = useMemo(() => 
    buildFormValidationSchema(fields), 
    [fields]
  );

  // Handle form submission - let Formik handle all validation
  const handleSubmit = useCallback(async (values, formikHelpers) => {
    try {
      await onSubmit(values, formikHelpers);
    } catch (error) {
      logger.error('Form submission error:', error);
      throw error;
    }
  }, [onSubmit]);

  // Build initial values from field configuration
  const buildInitialValues = () => {
    const values = { ...initialValues };
    
    fields.forEach(field => {
      if (values[field.name] === undefined) {
        values[field.name] = field.defaultValue || 
          (field.type === FIELD_TYPES.CHECKBOX ? false :
           field.type === FIELD_TYPES.MULTI_SELECT || field.type === FIELD_TYPES.MULTI_VALUE ? [] :
           '');
      }
    });
    
    return values;
  };

  // Memoize form props
  const formProps = useMemo(() => ({
    initialValues: buildInitialValues(),
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true
  }), [validationSchema, initialValues, fields, handleSubmit]);

  // Render field with label, error, and help text
  const renderFieldWithWrapper = (field) => {
    const fieldOptions = field.options || options[field.name] || [];
    
    return (
      <div key={field.name} className="field-wrapper">
        {field.label && (
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {renderField(field, fieldOptions)}
        
        {field.helpText && (
          <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
        )}
      </div>
    );
  };

  // Render field based on type using handlers
  const renderField = (field, fieldOptions) => {
    const Component = getComponentForField(field.type);
    
    // Set prop priority: user props first, then defaults as fallback
    const commonProps = {
      placeholder: field.placeholder,
      showError: false,
      ...field.props,  // User props first (highest priority)
      ...getFieldDefaultProps(field.type)  // Defaults as fallback
    };

    // Handle conditional fields - check visibility using Field render prop
    if (field.conditional) {
      return (
        <Field name={field.name}>
          {({ field: formikField, meta, form }) => {
            // Check if field should be visible based on conditional logic
            const shouldShow = shouldShowField(field, form.values);
            
            // If field should be hidden, return null
            if (!shouldShow) {
              return null;
            }
            
            // Field is visible, render it normally
            return renderFieldContent(field, fieldOptions, commonProps, formikField, meta, form);
          }}
        </Field>
      );
    }

    // Non-conditional fields render normally
    return renderFieldContent(field, fieldOptions, commonProps);
  };

  // Helper function to render field content (extracted for reuse)
  const renderFieldContent = (field, fieldOptions, commonProps, formikField = null, meta = null, form = null) => {
    const Component = getComponentForField(field.type);
    
    // Handle special cases that need custom logic
    if (field.type === FIELD_TYPES.URL && field.name === 'jiraLink') {
      return (
        <Field name={field.name}>
          {({ field: formikField, meta, form }) => (
            <Component
              {...formikField}
              {...commonProps}
              type="url"
              onBlur={(e) => {
                formikField.onBlur(e);
                
                // Auto-extract task number from Jira link
                if (e.target.value) {
                  const taskNumber = extractTaskNumber(e.target.value);
                  if (taskNumber) {
                    form.setFieldValue('taskNumber', taskNumber);
                    showInfo(`Task number "${taskNumber}" auto-extracted from Jira link`);
                  }
                }
              }}
            />
          )}
        </Field>
      );
    }

    // Handle multi-select and multi-value fields with proper prop passing
    if (field.type === FIELD_TYPES.MULTI_SELECT || field.type === FIELD_TYPES.MULTI_VALUE) {
      return (
        <Field name={field.name}>
          {({ field: formikField, meta, form }) => (
            <Component
              {...formikField}
              {...commonProps}
              options={fieldOptions}  // Pass options for select fields
              onChange={(value) => {
                // Handle array values properly
                const finalValue = Array.isArray(value) ? value : [value];
                formikField.onChange({
                  target: {
                    name: field.name,
                    value: finalValue
                  }
                });
              }}
            />
          )}
        </Field>
      );
    }

    // Handle regular fields with proper prop passing
    return (
      <Field name={field.name}>
        {({ field: formikField, meta, form }) => (
          <Component
            {...formikField}
            {...commonProps}
            options={fieldOptions}  // Pass options for all fields (will be ignored by non-select fields)
            onChange={(e) => {
              // Handle both event objects and direct values
              if (e && e.target) {
                formikField.onChange(e);
              } else {
                // Handle direct value changes (for custom inputs)
                formikField.onChange({
                  target: {
                    name: field.name,
                    value: e
                  }
                });
              }
            }}
          />
        )}
      </Field>
    );
  };

  return (
    <div className={`dynamic-form ${className}`}>
      <Formik {...formProps}>
        <Form className="space-y-6">
          {/* Render all fields */}
          {fields.map((field) => (
            <div key={field.name}>
              {renderFieldWithWrapper(field)}
            </div>
          ))}
          
          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            {showCancelButton && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isLoading || disabled}
              >
                {cancelButtonText}
              </button>
            )}
            
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || disabled}
            >
              {isLoading ? 'Submitting...' : submitButtonText}
            </button>
          </div>
        </Form>
      </Formik>
    </div>
  );
};

export default DynamicForm;
