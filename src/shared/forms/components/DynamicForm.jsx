import React, { useMemo, useEffect } from 'react';
import { Formik, Form, Field, useFormikContext } from 'formik';
import {
  buildFormValidationSchema,
  validateFormData,
  validateConditionalFields,
  FIELD_TYPES
} from '../validation';
import { sanitizeFormData } from '../sanitization';
import {
  TextInput,
  SelectInput,
  CheckboxInput,
  NumberInput,
  MultiSelectInput,
} from './index';
import MultiValueInput from './inputs/MultiValueInput';
import DynamicButton from '../../components/ui/DynamicButton';
import { extractTaskNumber } from '../validation/validationRules';
import { showInfo } from '../../utils/toast';

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
  
  // Check 'and' condition
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

// Conditional Field Wrapper Component
const ConditionalFieldWrapper = ({ field, children }) => {
  const { values } = useFormikContext();
  const isVisible = shouldShowField(field, values);
  
  if (!isVisible) return null;
  return children;
};

// Dynamic form component that renders fields based on configuration
const DynamicForm = ({
  fields = [],
  initialValues = {},
  onSubmit,
  error = null,
  className = "",
  title,
  subtitle,
  submitText = "Submit",
  submitButtonProps = {},
  options = {}, // Options for select/multiSelect fields
  onFormReady = null, // Callback when form is ready
  debug = true, // Debug mode for form state
  ...props
}) => {

  // Build validation schema from field configuration
  const validationSchema = buildFormValidationSchema(fields);

  // Handle form submission with dynamic validation and sanitization
  const handleSubmit = async (values, formikHelpers) => {
    try {
      // First sanitize the data
      const sanitizedData = sanitizeFormData(values, fields);
      
      // Then validate the sanitized data
      const validation = validateFormData(sanitizedData, fields);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          formikHelpers.setFieldError(error.field, error.message);
        });
        return;
      }

      // Validate conditional fields on sanitized data
      const conditionalErrors = validateConditionalFields(sanitizedData, fields);
      if (Object.keys(conditionalErrors).length > 0) {
        Object.entries(conditionalErrors).forEach(([field, message]) => {
          formikHelpers.setFieldError(field, message);
        });
        return;
      }

      await onSubmit(sanitizedData, formikHelpers);
      
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };





  // Render field with label, error, and help text
  const renderFieldWithWrapper = (field) => {
    const fieldOptions = options[field.name] || field.options || [];
    
    return (
      <ConditionalFieldWrapper key={field.name} field={field}>
        <div className="field-wrapper">
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
          
          <Field name={field.name}>
            {({ meta }) => (
              meta.touched && meta.error ? (
                <div className="text-red-500 text-sm mt-1">{meta.error}</div>
              ) : null
            )}
          </Field>
        </div>
      </ConditionalFieldWrapper>
    );
  };

  // Render field based on type
  const renderField = (field, fieldOptions) => {
    const commonProps = {
      placeholder: field.placeholder,
      showError: false,
      ...field.props
    };

    const renderBasicField = (Component, additionalProps = {}) => (
      <Field name={field.name}>
        {({ field: formikField }) => (
          <Component
            {...formikField}
            {...commonProps}
            {...additionalProps}
            name={field.name}
            id={field.name}
            onChange={(e) => formikField.onChange(e)}
          />
        )}
      </Field>
    );

    switch (field.type) {
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.TEXTAREA:
        return renderBasicField(TextInput);

      case FIELD_TYPES.EMAIL:
        return renderBasicField(TextInput, { type: "email" });

      case FIELD_TYPES.URL:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                type="url"
                onChange={(e) => {
                  formikField.onChange(e);
                }}
                onBlur={(e) => {
                  formikField.onBlur(e);
                  
                  // Auto-extract task number from Jira link
                  if (field.name === 'jiraLink' && e.target.value) {
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

      case FIELD_TYPES.NUMBER:
        return renderBasicField(NumberInput, {
          min: field.validation?.minValue,
          max: field.validation?.maxValue,
          step: field.props?.step || 1
        });

      case FIELD_TYPES.SELECT:
        return renderBasicField(SelectInput, { options: fieldOptions });

      case FIELD_TYPES.MULTI_SELECT:
        return (
          <Field name={field.name}>
            {({ field: formikField }) => (
              <MultiSelectInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                options={fieldOptions}
                value={formikField.value || []}
                onChange={(newValue) => {
                  formikField.onChange({
                    target: { name: field.name, value: newValue }
                  });
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.CHECKBOX:
        return renderBasicField(CheckboxInput, { renderLabel: false });

      case FIELD_TYPES.PASSWORD:
        return renderBasicField(TextInput, { type: "password" });

      case FIELD_TYPES.MULTI_VALUE:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => {
              // Extract custom props that shouldn't be passed to DOM
              const {
                addButtonText,
                removeButtonText,
                maxValues,
                ...otherProps
              } = field.props || {};
              
              return (
                <MultiValueInput
                  name={field.name}
                  value={formikField.value || []}
                  onChange={(newValue) => {
                    formikField.onChange({
                      target: {
                        name: field.name,
                        value: newValue
                      }
                    });
                  }}
                  placeholder={field.placeholder}
                  maxValues={maxValues || 10}
                  addButtonText={addButtonText}
                  removeButtonText={removeButtonText}
                  {...otherProps}
                />
              );
            }}
          </Field>
        );

      case FIELD_TYPES.DATE:
        return renderBasicField(TextInput, { type: "date" });

      default:
        return renderBasicField(TextInput);
    }
  };

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
    validateOnBlur: true,
    ...props
  }), [validationSchema, handleSubmit, props]);

  return (
    <div className={`dynamic-form ${className}`}>
      {(title || subtitle) && (
        <div className="form-header mb-6">
          {title && <h2 className="text-xl font-semibold mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}

      <Formik {...formProps}>
        {(formikProps) => {
          const { isValid, dirty, errors, touched } = formikProps;
          const hasErrors = Object.keys(errors).length > 0;
          const hasTouched = Object.keys(touched).length > 0;

          // Call onFormReady callback when form is ready
          useEffect(() => {
            if (onFormReady) {
              onFormReady(formikProps);
            }
          }, [onFormReady]);

          return (
            <div className="form-wrapper space-y-6 ">
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 rounded-lg">
                  <p className="text-red-error text-sm">{error}</p>
                </div>
              )}

              {/* Debug Information */}
              {debug && (
                <div className="mb-4 p-3 bg-white border border-blue-300 rounded-lg text-xs">
                  <h4 className="font-semibold mb-2">Debug Info:</h4>
                  <div className="space-y-1 text-gray-800">
                    <p className='text-gray-800"'><strong>Valid:</strong> {isValid ? 'Yes' : 'No'}</p>
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
                    {!hasErrors && Object.keys(errors).length > 0 && (
                      <div>
                        <strong>Raw Errors Object:</strong>
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
                {fields.map((field) => renderFieldWithWrapper(field))}
                
                {/* Submit Button */}
                <div className="pt-4">
                  <DynamicButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loadingText="Submitting..."
                    {...submitButtonProps}
                  >
                    {submitText}
                  </DynamicButton>
                </div>
              </Form>
            </div>
          );
        }}
      </Formik>
    </div>
  );
};

export default DynamicForm;
