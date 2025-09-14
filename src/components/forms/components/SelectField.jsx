import React from 'react';
import { INPUT_CLASSES } from '../utils/formConstants';
import BaseField from './BaseField';

const SelectField = ({ field, register, errors }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError}>
      <select
        {...register(field.name)}
        className={INPUT_CLASSES}
      >
        <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </BaseField>
  );
};

export default SelectField;
