import { useCallback, useMemo } from 'react';

const NumberField = ({ field, register, errors, setValue, trigger, formValues }) => {
  const fieldError = errors[field.name];
  
  // Debounced validation to prevent excessive validation calls
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    // Call the setValue function passed from parent component
    if (setValue) {
      setValue(field.name, value);
    }
    // Only trigger validation on blur, not on every keystroke
    // trigger(field.name); // Removed to prevent excessive validation
  }, [field.name, trigger, setValue]);

  const handleBlur = useCallback(() => {
    // Trigger validation only on blur
    trigger(field.name);
  }, [field.name, trigger]);
  
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
        value={formValues?.[field.name] ?? field.defaultValue ?? 0}
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
        onBlur={handleBlur}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default NumberField;
