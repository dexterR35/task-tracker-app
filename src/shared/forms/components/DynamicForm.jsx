import React, { useCallback } from 'react';
import {
  buildFormValidationSchema,
  validateFormData,
  validateConditionalFields,
  FIELD_TYPES
} from '../validation';
import { sanitizeFormData } from '../sanitization';
import {
  FormWrapper,
  TextInput,
  SelectInput,
  CheckboxInput,
  NumberInput,
  MultiSelectInput,
} from './index';
import MultiValueInput from './inputs/MultiValueInput';
import DynamicButton from '../../components/ui/DynamicButton';
import { prepareFormData } from '../sanitization';
import { extractTaskNumber } from '../validation/validationRules';
import { Field, useFormikContext } from 'formik';
import { showInfo } from '../../utils/toast';

// Conditional Field Wrapper Component
const ConditionalFieldWrapper = ({ field, children }) => {
  const { values } = useFormikContext();
  
  // Check if field should be visible based on conditional logic
  const shouldShowField = () => {
    if (!field.conditional) return true;
    
    const { field: conditionalField, value: conditionalValue } = field.conditional;
    const fieldValue = values[conditionalField];
    
    if (typeof conditionalValue === 'function') {
      return conditionalValue(fieldValue, values);
    }
    
    return fieldValue === conditionalValue;
  };
  
  const isVisible = shouldShowField();
  
  if (!isVisible) {
    return null;
  }
  
  return children;
};

// Dynamic form component that renders fields based on configuration
const DynamicForm = ({
  fields = [],
  initialValues = {},
  onSubmit,
  loading = false,
  error = null,
  className = "",
  title,
  subtitle,
  submitText = "Submit",
  submitButtonProps = {},
  showSubmitButton = true, // New prop to control submit button display
  options = {}, // Options for select/multiSelect fields
  formType = null, // Form type for data preparation
  context = {}, // Context data for preparation (user, monthId, etc.)
  onFormReady = null, // Callback when form is ready
  ...props
}) => {
  // Example usage:
  // - showSubmitButton={true} (default): Shows submit button (good for simple forms like login)
  // - showSubmitButton={false}: No submit button (good for complex forms with custom buttons)
  // - submitButtonProps: Customize button appearance and behavior
  // Build validation schema from field configuration
  const validationSchema = buildFormValidationSchema(fields);

  // Handle form submission with dynamic validation and sanitization
  // This bypasses FormWrapper's submit handling via bypassSubmitWrapper=true
  const handleSubmit = async (values, formikHelpers) => {
    try {
      // Clear validation errors for hidden conditional fields
      fields.forEach(field => {
        if (field.conditional) {
          const { field: conditionalField, value: conditionalValue } = field.conditional;
          const fieldValue = values[conditionalField];
          const shouldBeVisible = typeof conditionalValue === 'function' 
            ? conditionalValue(fieldValue, values)
            : fieldValue === conditionalValue;
          
          if (!shouldBeVisible) {
            formikHelpers.setFieldError(field.name, undefined);
          }
        }
      });

      // First sanitize the data
      const sanitizedData = sanitizeFormData(values, fields);
      
      // Then validate the sanitized data
      const validation = validateFormData(sanitizedData, fields);
      
      if (!validation.isValid) {
        // Set field errors
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

      // Prepare data if formType is provided (business logic only, no sanitization)
      const preparedData = formType 
        ? prepareFormData(formType, sanitizedData, context)
        : sanitizedData;

      // Call the original onSubmit with prepared data
      await onSubmit(preparedData, formikHelpers);
      
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };

  // Calculate form progress
  const calculateFormProgress = useCallback((values) => {
    // Filter out conditional fields that are not visible
    const visibleRequiredFields = fields.filter(field => {
      if (!field.required) return false;
      
      // Check if field should be visible based on conditional logic
      if (field.conditional) {
        const { field: conditionalField, value: conditionalValue } = field.conditional;
        const fieldValue = values[conditionalField];
        
        if (typeof conditionalValue === 'function') {
          return conditionalValue(fieldValue, values);
        }
        
        return fieldValue === conditionalValue;
      }
      
      return true;
    });
    
    const filledRequiredFields = visibleRequiredFields.filter(field => {
      const value = values[field.name];
      if (field.type === 'checkbox') return value !== undefined;
      if (field.type === 'multiSelect' || field.type === 'multiValue') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((filledRequiredFields.length / visibleRequiredFields.length) * 100);
  }, [fields]);

  // Get form validation feedback
  const getFormValidationFeedback = useCallback((progress) => {
    if (progress === 100) {
      return { type: 'success', message: 'All required fields completed!' };
    } else if (progress >= 75) {
      return { type: 'info', message: 'Almost done! Just a few more fields to go.' };
    } else if (progress >= 50) {
      return { type: 'warning', message: 'Halfway there! Keep going.' };
    } else if (progress >= 25) {
      return { type: 'info', message: 'Good start! Fill in more required fields.' };
    } else {
      return { type: 'warning', message: 'Please fill in the required fields to continue.' };
    }
  }, []);



  // Render field with label, error, and help text
  const renderFieldWithWrapper = (field) => {
    const fieldOptions = options[field.name] || field.options || [];
    
    return (
      <ConditionalFieldWrapper key={field.name} field={field}>
        <div className="field-wrapper">
          {/* Field Label */}
          {field.label && (
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          
          {/* Field Component */}
          {renderField(field, fieldOptions)}
          
          {/* Help Text */}
          {field.helpText && (
            <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
          )}
          
          {/* Error Display */}
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

    switch (field.type) {
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.TEXTAREA:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.EMAIL:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                type="email"
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

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
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <NumberInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                min={field.validation?.minValue}
                max={field.validation?.maxValue}
                step={field.props?.step || 1}
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.SELECT:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <SelectInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                options={fieldOptions}
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.MULTI_SELECT:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <MultiSelectInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                options={fieldOptions}
                value={formikField.value || []}
                onChange={(newValue) => {
                  formikField.onChange({
                    target: {
                      name: field.name,
                      value: newValue
                    }
                  });
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.CHECKBOX:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <CheckboxInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                renderLabel={false} // Don't show label in CheckboxInput since DynamicForm handles it
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.PASSWORD:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                type="password"
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

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
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                type="date"
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );

      default:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => (
              <TextInput
                {...formikField}
                {...commonProps}
                name={field.name}
                id={field.name}
                onChange={(e) => {
                  formikField.onChange(e);
                }}
              />
            )}
          </Field>
        );
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

  return (
    <div className={`dynamic-form ${className}`}>
      {(title || subtitle) && (
        <div className="form-header mb-6">
          {title && <h2 className="text-xl font-semibold mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
      )}

      <FormWrapper
        initialValues={buildInitialValues()}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        className="space-y-6"
        showSubmitButton={false} // Don't show FormWrapper's submit button since DynamicForm has its own
        bypassSubmitWrapper={true} // Bypass FormWrapper's submit handling since DynamicForm handles it
        onFormReady={onFormReady}
        {...props}
      >
        {/* Progress Display */}
        <Field name="__formValues">
          {({ form }) => {
            const progress = calculateFormProgress(form.values);
            const feedback = getFormValidationFeedback(progress);
            
            return (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600">
                    Progress: {progress}%
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress === 100 ? 'bg-green-500' :
                        progress >= 75 ? 'bg-blue-500' :
                        progress >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Validation feedback */}
                {progress > 0 && (
                  <div className={`p-3 rounded-md text-sm ${
                    feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    feedback.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {feedback.message}
                  </div>
                )}
              </div>
            );
          }}
        </Field>

        {fields.map((field) => renderFieldWithWrapper(field))}
        
        {/* Submit Button */}
        {showSubmitButton && (
          <div className="pt-4">
            <DynamicButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              loadingText="Submitting..."
              {...submitButtonProps}
            >
              {submitText}
            </DynamicButton>
          </div>
        )}
      </FormWrapper>
    </div>
  );
};

export default DynamicForm;
