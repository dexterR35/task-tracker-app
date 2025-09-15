import React from 'react';
import BaseField from './BaseField';

const NumberField = ({ field, register, errors, setValue, trigger, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues}>
      <input
        {...register(field.name, {
          valueAsNumber: true,
          onChange: (e) => {
            const value = parseFloat(e.target.value) || 0;
            setValue(field.name, value);
            trigger(field.name);
          }
        })}
        type="number"
        step={field.step || 0.5}
        placeholder={field.placeholder}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
      />
    </BaseField>
  );
};

export default NumberField;
