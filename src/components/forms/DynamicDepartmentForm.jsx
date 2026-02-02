


import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { buildSchemaFromFields, FORM_FIELD_LIMITS } from '@/components/forms/configs/validationSchemas';
import { FORM_FIELD_TYPE_MAP, getDepartmentFormConfig } from '@/components/forms/components/FormFields';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { handleValidationError } from '@/utils/errorHandling';
import { showValidationError } from '@/utils/toast';

export { getDepartmentFormConfig };

function getDefaultValueForField(field) {
  switch (field.type) {
    case 'number':
      // Return null or undefined allows yup .nullable() to work, 
      // whereas '' triggers a type error on number validation.
      return field.defaultValue ?? ''; 
    case 'checkbox':
      return field.defaultValue ?? false;
    case 'multiSelect':
      return field.defaultValue ?? [];
    default:
      return field.defaultValue ?? '';
  }
}

function buildDefaultValues(fields) {
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, f) => {
    acc[f.name] = getDefaultValueForField(f);
    return acc;
  }, {});
}

const DynamicDepartmentForm = ({
  departmentKey,
  formKey,
  onSubmit,
  defaultValues: defaultValuesOverride,
  schema: schemaOverride,
  submitButtonProps = {},
  className = '',
  hideTitle = false,
}) => {
  // 1. Memoize Config
  const config = useMemo(
    () => getDepartmentFormConfig(departmentKey, formKey),
    [departmentKey, formKey]
  );

  const fields = config?.fields ?? [];

  // 2. Memoize Default Values
  const defaultValues = useMemo(() => {
    const base = buildDefaultValues(fields);
    return defaultValuesOverride != null ? { ...base, ...defaultValuesOverride } : base;
  }, [fields, defaultValuesOverride]);

  // 3. Memoize Schema
  const schema = useMemo(() => {
    if (schemaOverride) return schemaOverride;
    return buildSchemaFromFields(fields);
  }, [fields, schemaOverride]);

  // 4. Initialize Hook Form
  const {
    register,
    handleSubmit,
    reset, // Destructure reset
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    // CHANGED: 'onBlur' is much more performant than 'onChange'
    mode: 'onBlur', 
  });

  // 5. CRITICAL FIX: Reset form when configuration/defaults change
  // Without this, switching between departments won't update the inputs
  useEffect(() => {
    if (config) {
        reset(defaultValues);
    }
  }, [reset, defaultValues, config]);

  const handleFormSubmit = async (data) => {
    // No need for try/catch if you are just rethrowing.
    // RHF handles the isSubmitting state based on the promise returned here.
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  const handleFormError = (errs) => {
    // Ensure we don't duplicate logic. 
    // If handleValidationError does logging and showValidationError does UI, keep both.
    handleValidationError(errs, config?.title ?? 'Form');
    showValidationError(errs);
  };

  if (!config) {
    return (
      <div className={`p-4 text-red-500 dark:text-red-400 ${className}`}>
        Form not found: {departmentKey} / {formKey}
      </div>
    );
  }

  const { title, submitLabel, category } = config;

  return (
    <div className={className}>
      {!hideTitle && (
        <div className="mb-6">
          {category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {category}
            </span>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {title}
          </h2>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-5">
        {fields.map((field) => {
          const FieldComponent = FORM_FIELD_TYPE_MAP[field.type];
          
          if (!FieldComponent) {
            console.warn(`No component found for type: ${field.type}`);
            return null;
          }

          // Merge limits if applicable
          const resolvedField = field.limitsKey && FORM_FIELD_LIMITS[field.limitsKey]
            ? { ...field, ...FORM_FIELD_LIMITS[field.limitsKey] }
            : field;
            
          return (
            <FieldComponent 
                key={field.name} 
                field={resolvedField}
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
            />
          );
        })}

        <div className="pt-2">
          <DynamicButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Sending…"
            className="w-full font-semibold"
            {...submitButtonProps}
          >
            {submitLabel}
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default DynamicDepartmentForm;