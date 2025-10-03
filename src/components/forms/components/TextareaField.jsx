const TextareaField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <textarea
        {...register(field.name)}
        id={field.name}
        placeholder={field.placeholder}
        rows={field.rows || 4}
        maxLength={field.maxLength}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
        style={{ resize: 'vertical', minHeight: '80px' }}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default TextareaField;
