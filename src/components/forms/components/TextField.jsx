import BaseField from '@/components/forms/components/BaseField';
import { showSuccess } from '@/utils/toast';

const TextField = ({ field, register, errors, getInputType, formValues, hideLabel = false }) => {
  const fieldError = errors[field.name];
  
  // Handle Jira link success toast on blur
  const handleBlur = (e) => {
    if (field.name === 'jiraLink' && e.target.value) {
      const jiraUrl = e.target.value.trim();
      
      // Extract task ID from Jira URL (e.g., GIMODEAR-124124 from https://gmrd.atlassian.net/browse/GIMODEAR-124124)
      const jiraMatch = jiraUrl.match(/\/browse\/([A-Z]+-\d+)/);
      if (jiraMatch) {
        const extractedTaskName = jiraMatch[1].toUpperCase(); // e.g., "GIMODEAR-124124" - ensure uppercase
        showSuccess(`✅ Task number extracted: ${extractedTaskName}`);
      }
    }
  };
  
  return (
    <BaseField field={field} error={fieldError} formValues={formValues} hideLabel={hideLabel}>
      <input
        {...register(field.name)}
        id={field.name}
        type={getInputType(field.type)}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        onBlur={handleBlur}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
      />
    </BaseField>
  );
};

export default TextField;
