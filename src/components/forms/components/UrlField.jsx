import { showSuccess } from '@/utils/toast';

const UrlField = ({ field, register, errors, formValues }) => {
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
    <div className="field-wrapper">
      {field.label && (
        <label htmlFor={field.name} className="field-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <input
        {...register(field.name)}
        id={field.name}
        type="url"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly || false}
        disabled={field.disabled || false}
        onBlur={handleBlur}
        className={`form-input ${field.readOnly ? 'readonly' : ''} ${fieldError ? 'error' : ''}`}
      />
      
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default UrlField;
