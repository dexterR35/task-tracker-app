import BaseField from '@/components/forms/components/BaseField';

const SelectField = ({ field, register, errors, formValues, hideLabel = false }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues} hideLabel={hideLabel}>
      <select
        {...register(field.name)}
        id={field.name}
        className={`form-input ${fieldError ? 'error' : ''}`}
      >
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </BaseField>
  );
};

export default SelectField;
