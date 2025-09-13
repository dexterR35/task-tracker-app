import React from 'react';
import { 
  INPUT_CLASSES, 
  FIELD_LABEL_CLASSES, 
  ERROR_MESSAGE_CLASSES, 
  HELP_TEXT_CLASSES, 
  REQUIRED_INDICATOR 
} from '../utils/formConstants';

const NumberField = ({ field, register, errors, setValue, trigger }) => {
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
        {...register(field.name, {
          valueAsNumber: true,
          onChange: (e) => {
            const value = parseFloat(e.target.value) || 0;
            setValue(field.name, value);
            trigger(field.name);
          }
        })}
        type="number"
        step={field.step || 0.5}
        min={field.min || 0.5}
        max={field.max || 999}
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

export default NumberField;
