import { useCallback, useMemo } from 'react';

const NumberField = ({ field, register, errors, setValue, trigger, formValues }) => {
  const fieldError = errors[field.name];
  
  // Debounced validation to prevent excessive validation calls
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    const parsed = value === '' ? '' : Number(value);
    if (setValue) {
      setValue(field.name, parsed);
    }
  }, [field.name, setValue]);

  const handleBlur = useCallback(() => {
    // Trigger validation only on blur
    trigger(field.name);
  }, [field.name, trigger]);
  
  const value = formValues?.[field.name] ?? field.defaultValue ?? '';

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
          onChange: handleChange
        })}
        id={field.name}
        name={field.name}
        type="number"
        step={field.step || 0.5}
        min={field.min || 0}
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input number-input-left ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
        style={{
          textAlign: 'left',
          paddingLeft: '12px',
          paddingRight: '8px'
        }}
        onBlur={handleBlur}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default NumberField;
