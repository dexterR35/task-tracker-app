import React from 'react';
import { 
  INPUT_CLASSES, 
  READONLY_CLASSES
} from '../utils/formConstants';
import BaseField from './BaseField';

const TextField = ({ field, register, errors, getInputType }) => {
  const fieldError = errors[field.name];
  
  return (
    <BaseField field={field} error={fieldError}>
      <input
        {...register(field.name)}
        type={getInputType(field.type)}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={false}
        className={field.readOnly ? `${INPUT_CLASSES} ${READONLY_CLASSES}` : INPUT_CLASSES}
      />
    </BaseField>
  );
};

export default TextField;
