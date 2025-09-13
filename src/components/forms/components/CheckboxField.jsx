import React from 'react';
import { 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';
import { handleConditionalLogic } from '../utils/formUtilities';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors }) => {
  const fieldError = errors[field.name];
  const isFieldRequired = field.required;
  
  return (
    <div className="field-wrapper">
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
          <label htmlFor={field.name} className={FIELD_LABEL_CLASSES}>
            {field.label}
            {isFieldRequired && ` ${REQUIRED_INDICATOR}`}
          </label>
        </div>
      </div>
      
      {fieldError && (
        <div className={ERROR_MESSAGE_CLASSES}>
          {fieldError.message}
        </div>
      )}
      
      {field.helpText && (
        <p className={HELP_TEXT_CLASSES}>{field.helpText}</p>
      )}
    </div>
  );
};

export default CheckboxField;
