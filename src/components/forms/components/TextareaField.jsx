import React from 'react';
import BaseField from './BaseField';

const TextareaField = ({ field, register, errors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues}>
      <textarea
        {...register(field.name)}
        id={field.name}
        placeholder={field.placeholder}
        rows={field.rows || 4}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
        style={{ resize: 'vertical', minHeight: '80px' }}
      />
    </BaseField>
  );
};

export default TextareaField;
