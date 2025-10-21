/**
 * Password Field Component
 * 
 * @fileoverview Reusable password input field with validation and error handling
 * @author Senior Developer
 * @version 2.0.0
 */

/**
 * Password Field Component
 * @param {Object} props - Component props
 * @param {Object} props.field - Field configuration object
 * @param {Function} props.register - React Hook Form register function
 * @param {Object} props.errors - Form errors object
 * @param {Object} props.formValues - Current form values
 * @returns {JSX.Element} - Password field component
 */
const PasswordField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <input
        {...register(field.name)}
        type="password"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete || 'current-password'}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default PasswordField;
