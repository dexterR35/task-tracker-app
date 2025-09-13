import React from 'react';
import { 
  INPUT_CLASSES, 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';

const SelectField = ({ field, register, errors }) => {
  const fieldError = errors[field.name];
  const isFieldRequired = field.required;
  
  return (
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className={FIELD_LABEL_CLASSES}>
          {field.label}
          {isFieldRequired && ` ${REQUIRED_INDICATOR}`}
        </label>
      )}
      
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

export default SelectField;
