import React from 'react';
import { INPUT_CLASSES, INPUT_ERROR_CLASSES, READONLY_CLASSES } from '../utils/formConstants';
import BaseField from './BaseField';

const UrlField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues}>
      <input
        {...register(field.name)}
        type="url"
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

export default UrlField;
