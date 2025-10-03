const SelectField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
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
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default SelectField;
