import React from 'react';
import { REQUIRED_INDICATOR } from '../configs/sharedFormUtils';
import BaseField from './BaseField';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} hideLabel={true} formValues={formValues}>
      <div className="checkbox-container">
        <input
          {...register(field.name)}
          type="checkbox"
          className="checkbox-input"
          onChange={(e) => {
            setValue(field.name, e.target.checked);
            trigger(field.name);
            
            // Conditional field logic is now handled by Yup .when() validation
            // The form data processing in prepareTaskFormData handles setting defaults
          }}
        />
        <div>
          <label htmlFor={field.name} className="field-label">
            {field.label}
            {field.required && ` ${REQUIRED_INDICATOR}`}
          </label>
        </div>
      </div>
    </BaseField>
  );
};

export default CheckboxField;
