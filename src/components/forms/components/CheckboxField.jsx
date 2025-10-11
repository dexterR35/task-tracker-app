import { UI_CONFIG } from '@/constants';

const CheckboxField = ({ field, register, errors, setValue, trigger, clearErrors, formValues }) => {
  const fieldError = errors[field.name];
  
  return (
    <div className="field-wrapper">
      <div className="checkbox-field space-x-2 flex justify-start items-center">
        <input
          {...register(field.name)}
          id={field.name}
          type="checkbox"
          className={`form-checkbox ${fieldError ? 'error' : ''}`}
          onChange={(e) => {
            setValue(field.name, e.target.checked);
            trigger(field.name);
            
            // Conditional field logic is now handled by Yup .when() validation
            // The form data processing in prepareTaskFormData handles setting defaults
          }}
        />
        <label htmlFor={field.name} className='m-0'>
          {field.label}
          {field.required && <span className="required-indicator">{UI_CONFIG.REQUIRED_INDICATOR}</span>}
        </label>
      </div>
      
      {/* Error message */}
      {fieldError && <div className="error-message">{fieldError.message}</div>}
    </div>
  );
};

export default CheckboxField;
