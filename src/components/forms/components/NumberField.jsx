import { useCallback, useMemo } from 'react';

const NumberField = ({ field, register, errors, setValue, trigger, formValues }) => {
  const fieldError = errors[field.name];
  
  // Handle change - pass value as-is (string) to allow free editing
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    // Pass the value as-is (string) to allow empty strings and partial input
    // The parent component will handle parsing and validation
    if (setValue) {
      setValue(field.name, value);
    }
  }, [field.name, setValue]);

  const handleBlur = useCallback((e) => {
    // Enforce minimum value on blur if field has min and value is empty or below minimum
    if (field.min !== undefined && field.min !== null) {
      const currentValue = e.target.value;
      const numValue = currentValue === '' ? NaN : Number(currentValue);
      if (isNaN(numValue) || numValue < field.min) {
        const minValue = field.min;
        if (setValue) {
          setValue(field.name, String(minValue));
        }
      }
    }
    // Trigger validation only on blur
    trigger(field.name);
  }, [field.name, field.min, setValue, trigger]);
  
  // Convert value to string for input display, handling both number and string types
  const rawValue = formValues?.[field.name] ?? field.defaultValue ?? '';
  const value = rawValue === '' || rawValue === null || rawValue === undefined ? '' : String(rawValue);

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
