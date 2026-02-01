import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { buildSchemaFromFields, FORM_FIELD_LIMITS } from '@/components/forms/configs/validationSchemas';
import { FORM_FIELD_TYPE_MAP, getDepartmentFormConfig } from '@/components/forms/components/FormFields';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { handleValidationError } from '@/features/utils/errorHandling';
import { showValidationError } from '@/utils/toast';

export { getDepartmentFormConfig };

function getDefaultValueForField(field) {
  switch (field.type) {
    case 'number':
      return field.defaultValue ?? '';
    case 'checkbox':
      return field.defaultValue ?? false;
    case 'multiSelect':
      return field.defaultValue ?? [];
    default:
      return field.defaultValue ?? '';
  }
}

/**
 * Build defaultValues object from form config fields.
 */
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
  const config = useMemo(
    () => getDepartmentFormConfig(departmentKey, formKey),
    [departmentKey, formKey]
  );

  const fields = config?.fields ?? [];
  const defaultValues = useMemo(() => {
    const base = buildDefaultValues(fields);
    return defaultValuesOverride != null ? { ...base, ...defaultValuesOverride } : base;
  }, [fields, defaultValuesOverride]);

  const schema = useMemo(() => {
    if (schemaOverride) return schemaOverride;
    return buildSchemaFromFields(fields);
  }, [fields, schemaOverride]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit?.(data);
    } catch (_err) {
      throw _err;
    }
  };

  const handleFormError = (errs) => {
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
          if (!FieldComponent) return null;
          const resolvedField = field.limitsKey && FORM_FIELD_LIMITS[field.limitsKey]
            ? { ...field, ...FORM_FIELD_LIMITS[field.limitsKey] }
            : field;
          const commonProps = {
            field: resolvedField,
            register,
            errors,
            setValue,
            watch,
          };
          return <FieldComponent key={field.name} {...commonProps} />;
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
