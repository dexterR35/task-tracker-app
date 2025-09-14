import React from 'react';
import { INPUT_CLASSES, INPUT_ERROR_CLASSES, READONLY_CLASSES } from '../utils/formConstants';
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
        className={field.readOnly 
          ? `${fieldError ? INPUT_ERROR_CLASSES : INPUT_CLASSES} ${READONLY_CLASSES}` 
          : fieldError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
      />
    </BaseField>
  );
};

export default NumberField;
