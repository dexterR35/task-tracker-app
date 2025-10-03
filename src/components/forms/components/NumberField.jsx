const NumberField = ({ field, register, errors, setValue, trigger, formValues }) => {
  const fieldError = errors[field.name];
  
  const handleChange = (e) => {
    const value = e.target.value;
    // Trigger validation on every change
    trigger(field.name);
  };
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <input
        {...register(field.name, {
          valueAsNumber: true,
          onChange: handleChange
        })}
        id={field.name}
        type="number"
        step={field.step || 0.5}
        min={field.min || 0}
        defaultValue={field.defaultValue || 0}
        placeholder={field.placeholder}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input number-input-left ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
        style={{
          textAlign: 'left',
          paddingLeft: '12px',
          paddingRight: '8px'
        }}
        onInput={handleChange}
        onBlur={handleChange}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default NumberField;
