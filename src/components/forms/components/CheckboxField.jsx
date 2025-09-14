import React from 'react';
import { handleConditionalLogic } from '../utils/formUtilities';
import BaseField from './BaseField';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError} className="field-wrapper">
      <div className="flex items-start space-x-3">
        <input
          {...register(field.name)}
          type="checkbox"
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          onChange={(e) => {
            setValue(field.name, e.target.checked);
            trigger(field.name);
            
            // Handle conditional field logic
            handleConditionalLogic(field.name, e.target.checked, setValue, clearErrors);
          }}
        />
        <div>
          <label htmlFor={field.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && ` *`}
          </label>
        </div>
      </div>
    </BaseField>
  );
};

export default CheckboxField;
