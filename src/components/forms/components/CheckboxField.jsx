import React from 'react';
import { FIELD_LABEL_CLASSES, REQUIRED_INDICATOR } from '../utils/formConstants';
import BaseField from './BaseField';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} hideLabel={true} formValues={formValues}>
      <div className="flex items-start space-x-3">
        <input
          {...register(field.name)}
          type="checkbox"
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          onChange={(e) => {
            setValue(field.name, e.target.checked);
            trigger(field.name);
            
            // Conditional field logic is now handled by Yup .when() validation
            // The form data processing in prepareTaskFormData handles setting defaults
          }}
        />
        <div>
          <label htmlFor={field.name} className={FIELD_LABEL_CLASSES}>
            {field.label}
            {field.required && ` ${REQUIRED_INDICATOR}`}
          </label>
        </div>
      </div>
    </BaseField>
  );
};

export default CheckboxField;
