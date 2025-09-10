import React, { useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { showSuccess, showError } from '@/utils/toast';
import { sanitizeFormData, shouldShowField, buildFormValidationSchema } from './configs/useForms';

/**
 * React Hook Form Wrapper Component
 * Centralized form component using React Hook Form v7
 * Works with any field configuration from useForms.js
 * Supports any CRUD operations through apiMutations
 * 
 * @param {Object} props - Component props
 * @param {Array} props.fields - Field configuration array from useForms.js
 * @param {Function} props.onSubmit - Form submission handler (optional - can use built-in handlers)
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema (optional - auto-generated from fields)
 * @param {string} props.submitButtonText - Text for submit button
 * @param {boolean} props.isSubmitting - Loading state
 * @param {Object} props.additionalProps - Additional props to pass to form
 * @param {Object} props.formConfig - Complete form configuration object
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {string} props.mode - Form mode ('create' or 'edit')
 * @param {Object} props.apiMutations - API mutation functions { create, update }
 * @param {Object} props.contextData - Additional context data (user, monthId, etc.)
 * @param {string} props.entityType - Entity type for logging/debugging (optional)
 */
const ReactHookFormWrapper = ({
  fields,
  onSubmit,
  initialValues,
  validationSchema,
  submitButtonText = 'Submit',
  isSubmitting = false,
  additionalProps = {},
  formConfig = null,
  onSuccess = null,
  onError = null,
  mode = 'create',
  apiMutations = {},
  contextData = {},
  entityType = 'record'
}) => {
  // Auto-generate validation schema if not provided - optimized for React Hook Form
  const finalValidationSchema = useMemo(() => {
    if (validationSchema) return validationSchema;
    if (formConfig?.validationSchema) return formConfig.validationSchema;
    if (fields) {
      return buildFormValidationSchema(fields);
    }
    return null;
  }, [validationSchema, formConfig, fields]);

  // Initialize React Hook Form
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    trigger
  } = useForm({
    resolver: finalValidationSchema ? yupResolver(finalValidationSchema) : undefined,
    defaultValues: initialValues,
    mode: 'onChange',
    ...additionalProps
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Centralized form submission handler
  const handleFormSubmit = useCallback(async (data) => {
    try {
      // Debug logging for form submission
      console.log('🚀 Form Submission Started:', {
        mode,
        rawFormData: data,
        contextData
      });

      // Use custom onSubmit if provided, otherwise use built-in logic
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      // Built-in form submission logic
      if (!formConfig || !apiMutations) {
        showError('Form configuration or API mutations not provided');
        return;
      }

      // Sanitize form data
      const sanitizedData = sanitizeFormData(data, fields);
      console.log('🧹 Sanitized Data:', sanitizedData);
      
      // Prepare data for database
      const dataForDatabase = {
        ...sanitizedData,
        ...contextData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Remove id from dataForDatabase if it's null or undefined to let database generate it
      if (dataForDatabase.id === null || dataForDatabase.id === undefined) {
        delete dataForDatabase.id;
      }

      console.log('💾 Final Data for Database:', dataForDatabase);

      let result;
      if (mode === 'edit' && contextData.id) {
        // Update existing record
        const updateMutation = apiMutations.update || apiMutations.updateMutation;
        if (!updateMutation) {
          throw new Error(`Update mutation not provided for ${entityType}`);
        }
        
        // Handle mutation (works for both direct functions and RTK Query)
        const mutationResult = updateMutation({
          id: contextData.id,
          data: dataForDatabase
        });
        result = typeof mutationResult === 'object' && 'unwrap' in mutationResult 
          ? await mutationResult.unwrap() 
          : await mutationResult;
        
        showSuccess(formConfig.successMessages?.update || `${entityType} updated successfully!`);
      } else {
        // Create new record
        const createMutation = apiMutations.create || apiMutations.createMutation;
        if (!createMutation) {
          throw new Error(`Create mutation not provided for ${entityType}`);
        }
        
        // Handle mutation (works for both direct functions and RTK Query)
        const mutationResult = createMutation(dataForDatabase);
        result = typeof mutationResult === 'object' && 'unwrap' in mutationResult 
          ? await mutationResult.unwrap() 
          : await mutationResult;
        
        showSuccess(formConfig.successMessages?.create || `${entityType} created successfully!`);
      }

      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);

    } catch (error) {
      console.error(`${entityType} form submission error:`, error);
      const errorMessage = formConfig?.errorMessages?.default || `Failed to save ${entityType}. Please try again.`;
      showError(errorMessage);
      onError?.(error);
    }
  }, [onSubmit, formConfig, apiMutations, contextData, mode, fields, onSuccess, onError, entityType, reset]);

  // Helper function to get input type
  const getInputType = useCallback((fieldType) => {
    const typeMap = {
      email: 'email',
      password: 'password',
      text: 'text'
    };
    return typeMap[fieldType] || 'text';
  }, []);

  /**
   * Generic field renderer that works with any field configuration
   * Memoized to prevent unnecessary re-renders
   */
  const renderField = useCallback((field) => {
    const { sanitize, validation, conditional, ...fieldProps } = field;
    
    // Check if field should be visible based on conditional logic
    if (!shouldShowField(field, watchedValues)) {
      return null; // Don't render the field
    }

    const fieldError = errors[field.name];
    const isFieldRequired = field.required;
    
    return (
      <div key={field.name} className="field-wrapper">
        {field.label && (
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
            {isFieldRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {field.type === 'select' ? (
          <select
            {...register(field.name)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'multiSelect' ? (
          <MultiSelectField
            field={field}
            setValue={setValue}
            watch={watch}
            errors={errors}
          />
        ) : field.type === 'checkbox' ? (
          <div className="flex items-start space-x-3">
            <input
              {...register(field.name)}
              type="checkbox"
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              onChange={(e) => {
                setValue(field.name, e.target.checked);
                trigger(field.name);
                
                // Handle conditional field logic
                if (field.name === 'hasDeliverables' && !e.target.checked) {
                  setValue('deliverables', []);
                  clearErrors('deliverables');
                } else if (field.name === 'usedAI' && !e.target.checked) {
                  setValue('aiModels', []);
                  setValue('aiTime', 0);
                  clearErrors('aiModels');
                  clearErrors('aiTime');
                }
              }}
            />
            <div>
              <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
            </div>
          </div>
        ) : field.type === 'number' ? (
          <input
            {...register(field.name, {
              valueAsNumber: true,
              onChange: (e) => {
                const value = parseFloat(e.target.value) || 0;
                setValue(field.name, value);
                trigger(field.name);
              }
            })}
            type="number"
            step={field.step || 0.5}
            min={field.min || 0.5}
            max={field.max || 999}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        ) : field.type === 'url' ? (
          <input
            {...register(field.name)}
            type="url"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        ) : (
          <input
            {...register(field.name)}
            type={getInputType(field.type)}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            readOnly={field.readOnly || false}
            disabled={false}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${field.readOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
          />
        )}
        
        {fieldError && (
          <div className="text-red-500 text-sm mt-1">
            {fieldError.message}
          </div>
        )}
        
        {field.helpText && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{field.helpText}</p>
        )}
      </div>
    );
  }, [watchedValues, errors, register, setValue, trigger, clearErrors, getInputType]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {fields?.map((field) => renderField(field)) || []}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || formIsSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isSubmitting || formIsSubmitting) ? 'Submitting...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};

/**
 * MultiSelect Field Component for React Hook Form
 */
const MultiSelectField = ({ field, setValue, watch, errors }) => {
  const selectedValues = watch(field.name) || [];
  const availableOptions = field.options?.filter(option => !selectedValues.includes(option.value)) || [];

  const handleAddValue = (value) => {
    if (value && !selectedValues.includes(value)) {
      const newValues = [...selectedValues, value];
      setValue(field.name, newValues, { shouldValidate: true });
    }
  };

  const handleRemoveValue = (index) => {
    const newValues = selectedValues.filter((_, i) => i !== index);
    setValue(field.name, newValues, { shouldValidate: true });
  };

  return (
    <div>
      <select
        value=""
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        onChange={(e) => handleAddValue(e.target.value)}
      >
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {availableOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Selected Items Display */}
      {selectedValues.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {field.options?.find(opt => opt.value === item)?.label || item}
                <button
                  type="button"
                  onClick={() => handleRemoveValue(index)}
                  className="ml-2 hover:opacity-75"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Memoize the component to prevent unnecessary re-renders
export default React.memo(ReactHookFormWrapper);
