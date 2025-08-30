import React from 'react';
import {
  buildFormValidationSchema,
  sanitizeFormData,
  validateFormData,
  validateConditionalFields,
  FIELD_TYPES
} from '../validation';
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
import { Field } from 'formik';

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
  onFieldChange = null, // Callback for field changes
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
  const handleSubmit = async (values, formikHelpers) => {
    try {
      // Sanitize form data
      const sanitizedData = sanitizeFormData(values, fields);
      
      // Validate form data
      const validation = validateFormData(sanitizedData, fields);
      
      if (!validation.isValid) {
        // Set field errors
        validation.errors.forEach(error => {
          formikHelpers.setFieldError(error.field, error.message);
        });
        return;
      }

      // Validate conditional fields
      const conditionalErrors = validateConditionalFields(sanitizedData, fields);
      if (Object.keys(conditionalErrors).length > 0) {
        Object.entries(conditionalErrors).forEach(([field, message]) => {
          formikHelpers.setFieldError(field, message);
        });
        return;
      }

      // Prepare data if formType is provided
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

  // Handle field changes
  const handleFieldChange = (fieldName, value, formikHelpers) => {
    // Call the onFieldChange callback if provided
    if (onFieldChange) {
      onFieldChange(fieldName, value, formikHelpers);
    }
  };

  // Render field with label, error, and help text
  const renderFieldWithWrapper = (field) => {
    const fieldOptions = options[field.name] || field.options || [];
    
    return (
      <div key={field.name} className="field-wrapper">
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
                  handleFieldChange(field.name, e.target.value, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
                  handleFieldChange(field.name, e.target.value, form);
                }}
              />
            )}
          </Field>
        );

      case FIELD_TYPES.MULTI_SELECT:
        return (
          <Field name={field.name}>
            {({ field: formikField, meta, form }) => {
              console.log('MultiSelectInput render:', { field: field.name, value: formikField.value, options: fieldOptions });
              return (
                <MultiSelectInput
                  {...formikField}
                  {...commonProps}
                  name={field.name}
                  id={field.name}
                  options={fieldOptions}
                  value={formikField.value || []}
                  onChange={(newValue) => {
                    console.log('MultiSelectInput onChange:', { field: field.name, newValue });
                    formikField.onChange({
                      target: {
                        name: field.name,
                        value: newValue
                      }
                    });
                    handleFieldChange(field.name, newValue, form);
                  }}
                />
              );
            }}
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
                  handleFieldChange(field.name, e.target.checked, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
                    handleFieldChange(field.name, newValue, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
                  handleFieldChange(field.name, e.target.value, form);
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
        onFormReady={onFormReady}
        {...props}
      >
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
