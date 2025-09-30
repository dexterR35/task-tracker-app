import { useAppData } from '@/hooks/useAppData';
import { getMonthBoundaries } from '@/utils/monthUtils';
import BaseField from '@/components/forms/components/BaseField';


const SimpleDateField = ({ 
  field, 
  register, 
  errors, 
  setValue, 
  watch, 
  trigger, 
  clearErrors,
  formValues 
}) => {
  const { monthId, monthName } = useAppData();
  
  const fieldName = field.name;
  const error = errors[fieldName];

  // Get month boundaries for date restrictions - ALWAYS restrict to current month only
  const getMonthBoundariesLocal = () => {
    return getMonthBoundaries(monthId);
  };

  const monthBoundaries = getMonthBoundariesLocal();
  // const currentMonthName = monthName;

  return (
    <BaseField field={field} error={error} formValues={formValues}>
      <div className="simple-date-field-container">
        {/* <div className="mb-2">
          <p className="text-xs">
            Select a day within {currentMonthName} 
          </p>
        </div> */}
        
        <input
          type="date"
          {...register(fieldName)}
          id={fieldName}
          min={monthBoundaries.min}
          max={monthBoundaries.max}
          className={`form-input ${error ? 'error' : ''} cursor-pointer`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            // Force the date picker to open when clicking anywhere on the input
            e.target.focus();
            // Use a small delay to ensure focus happens first
            setTimeout(() => {
              if (e.target.showPicker) {
                e.target.showPicker();
              }
            }, 10);
          }}
        />
        
    
      </div>
    </BaseField>
  );
};

export default SimpleDateField;
