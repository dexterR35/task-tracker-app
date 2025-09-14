import React from 'react';
import { INPUT_CLASSES } from '../utils/formConstants';
import BaseField from './BaseField';

const UrlField = ({ field, register, errors }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError}>
      <input
        {...register(field.name)}
        type="url"
        placeholder={field.placeholder}
        className={INPUT_CLASSES}
      />
    </BaseField>
  );
};

export default UrlField;
