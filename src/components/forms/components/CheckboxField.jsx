import React from 'react';
import { REQUIRED_INDICATOR } from '../configs/sharedFormUtils';
import BaseField from './BaseField';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} hideLabel={true} formValues={formValues}>
      <div className="checkbox-field space-x-2 flex justify-start items-center">
        <input
          {...register(field.name)}
          id={field.name}
          type="checkbox"
          onChange={(e) => {
            setValue(field.name, e.target.checked);
            trigger(field.name);
            
            // Conditional field logic is now handled by Yup .when() validation
            // The form data processing in prepareTaskFormData handles setting defaults
          }}
        />
        <label htmlFor={field.name} className='m-0'>
          {field.label}
          {field.required && <span className="required-indicator">{REQUIRED_INDICATOR}</span>}
        </label>
      </div>
    </BaseField>
  );
};

export default CheckboxField;
