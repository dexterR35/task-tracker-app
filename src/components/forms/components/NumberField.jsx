import React from 'react';
import { INPUT_CLASSES } from '../utils/formConstants';
import BaseField from './BaseField';

const NumberField = ({ field, register, errors, setValue, trigger }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError}>
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
        min={field.min || 0.5}
        max={field.max || 999}
        placeholder={field.placeholder}
        className={INPUT_CLASSES}
      />
    </BaseField>
  );
};

export default NumberField;
