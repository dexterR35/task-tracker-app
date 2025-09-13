import React from 'react';
import { 
  INPUT_CLASSES, 
  READONLY_CLASSES, 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR, 
  INPUT_TYPE_MAP 
} from '../utils/formConstants';

const TextField = ({ field, register, errors, getInputType }) => {
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
        type={getInputType(field.type)}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={false}
        className={field.readOnly ? `${INPUT_CLASSES} ${READONLY_CLASSES}` : INPUT_CLASSES}
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

export default TextField;
