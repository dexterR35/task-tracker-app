import BaseField from '@/components/forms/components/BaseField';

const PasswordField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues}>
      <input
        {...register(field.name)}
        type="password"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete || 'current-password'}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
      />
    </BaseField>
  );
};

export default PasswordField;

