import React from 'react';
import { 
  INPUT_CLASSES, 
  INPUT_ERROR_CLASSES,
  READONLY_CLASSES
} from '../utils/formConstants';
import BaseField from './BaseField';
import { showSuccess } from '@/utils/toast';

const TextField = ({ field, register, errors, getInputType, formValues }) => {
  const fieldError = errors[field.name];
  
  // Handle Jira link success toast on blur
  const handleBlur = (e) => {
    if (field.name === 'jiraLink' && e.target.value) {
      const jiraUrl = e.target.value.trim();
      
      // Extract task ID from Jira URL (e.g., GIMODEAR-124124 from https://gmrd.atlassian.net/browse/GIMODEAR-124124)
      const jiraMatch = jiraUrl.match(/\/browse\/([A-Z]+-\d+)/);
      if (jiraMatch) {
        const extractedTaskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
        showSuccess(`✅ Task number extracted: ${extractedTaskName}`);
      }
    }
  };
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues}>
      <input
        {...register(field.name)}
        type={getInputType(field.type)}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        onBlur={handleBlur}
        className={field.readOnly 
          ? `${fieldError ? INPUT_ERROR_CLASSES : INPUT_CLASSES} ${READONLY_CLASSES}` 
          : fieldError ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
      />
    </BaseField>
  );
};

export default TextField;
