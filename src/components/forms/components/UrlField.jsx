import React from 'react';
import { 
  INPUT_CLASSES, 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';

const UrlField = ({ field, register, errors }) => {
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
      
      <input
        {...register(field.name)}
        type="url"
        placeholder={field.placeholder}
        className={INPUT_CLASSES}
      />
      
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

export default UrlField;
