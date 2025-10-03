import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useUpdateSettingsTypeMutation } from '@/features/settings/settingsApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { handleValidationError, withMutationErrorHandling } from '@/features/utils/errorHandling';
import { createFormSubmissionHandler } from '@/utils/formUtils';
import { 
  DELIVERABLE_FORM_FIELDS,
  createDeliverableFormSchema,
  prepareDeliverableFormData,
  validateDeliverableName,
  validateTimePerUnit,
  validateDeclinariTime
} from '@/features/deliverables/config/useDeliverableForm';
import { 
  TextField, 
  NumberField, 
  SelectField 
} from '@/components/forms/components/';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { useAppData } from '@/hooks/useAppData';

/**
 * Dedicated Deliverable Form Component
 * Handles creating and updating deliverable records
 */
const DeliverableForm = ({ 
  mode = 'create', 
  deliverable = null,
  onSuccess,
  onCancel,
  className = "" 
}) => {
  const { deliverables: existingDeliverables } = useAppData();
  const { user } = useAuth();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsTypeMutation();
  
  // Debug: Log all deliverables to see what's in the database
  console.log('🔍 All deliverables in database:', existingDeliverables);
  console.log('📊 Total count:', existingDeliverables?.length || 0);
  if (existingDeliverables) {
    existingDeliverables.forEach((deliverable, index) => {
      console.log(`  ${index + 1}. ${deliverable.name} (ID: ${deliverable.id || 'no-id'})`);
    });
  }
  
  // Form setup
  const form = useForm({
    resolver: yupResolver(createDeliverableFormSchema(DELIVERABLE_FORM_FIELDS)),
    defaultValues: {
      name: deliverable?.name || '',
      department: deliverable?.department || '',
      timePerUnit: deliverable?.timePerUnit || 1,
      timeUnit: deliverable?.timeUnit || 'hr',
      declinariTime: deliverable?.declinariTime || 10
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, trigger } = form;
  const formValues = watch();


  // Form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (formData) => {
      const preparedData = prepareDeliverableFormData(formData);
      const currentDeliverables = existingDeliverables || [];
      
      if (mode === 'create') {
        // Check for duplicates within the same department only
        const duplicateInDepartment = currentDeliverables.some(d => 
          d.name?.toLowerCase() === preparedData.name?.toLowerCase() && 
          d.department === preparedData.department
        );
        
        if (duplicateInDepartment) {
          throw new Error(`A deliverable with the name "${preparedData.name}" already exists in the ${preparedData.department} department. Please choose a different name or department.`);
        }

        const createDeliverableWithErrorHandling = withMutationErrorHandling(updateSettings, {
          operationName: 'create deliverable',
          showToast: true,
          logError: true
        });

        // Create new deliverable with unique ID
        const newDeliverable = {
          ...preparedData,
          id: `deliverable_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add new deliverable to existing array
        const updatedDeliverables = [...currentDeliverables, newDeliverable];

        await createDeliverableWithErrorHandling({
          settingsType: 'deliverables',
          settingsData: {
            deliverables: updatedDeliverables
          },
          userData: user
        });
      } else {
        // Check for duplicates within the same department (excluding current deliverable)
        const duplicateInDepartment = currentDeliverables.some(d => 
          d.id !== deliverable.id &&
          d.name?.toLowerCase() === preparedData.name?.toLowerCase() && 
          d.department === preparedData.department
        );
        
        if (duplicateInDepartment) {
          throw new Error(`A deliverable with the name "${preparedData.name}" already exists in the ${preparedData.department} department. Please choose a different name or department.`);
        }

        const updateDeliverableWithErrorHandling = withMutationErrorHandling(updateSettings, {
          operationName: 'update deliverable',
          showToast: true,
          logError: true
        });

        // Update existing deliverable in the array
        const updatedDeliverables = currentDeliverables.map(d => 
          d.id === deliverable.id 
            ? { ...d, ...preparedData, updatedAt: new Date().toISOString() }
            : d
        );

        await updateDeliverableWithErrorHandling({
          settingsType: 'deliverables',
          settingsData: {
            deliverables: updatedDeliverables
          },
          userData: user
        });
      }

      // Success toast is handled by createFormSubmissionHandler
      onSuccess?.();
    },
    {
      formName: 'deliverable',
      showToast: true,
      logError: true
    }
  );

  const handleFormError = (errors) => {
    handleValidationError(errors, 'deliverable');
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  return (
    <div className={`deliverable-form ${className} card`}>
      <form onSubmit={handleSubmit(handleFormSubmit, handleFormError)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deliverable Name */}
          <TextField
            field={DELIVERABLE_FORM_FIELDS[0]}
            register={register}
            errors={errors}
            formValues={formValues}
          />

          {/* Department */}
          <SelectField
            field={DELIVERABLE_FORM_FIELDS[1]}
            register={register}
            errors={errors}
            formValues={formValues}
          />

          {/* Time Per Unit */}
          <NumberField
            field={DELIVERABLE_FORM_FIELDS[2]}
            register={register}
            errors={errors}
            setValue={setValue}
            trigger={trigger}
            formValues={formValues}
          />

          {/* Time Unit */}
          <SelectField
            field={DELIVERABLE_FORM_FIELDS[3]}
            register={register}
            errors={errors}
            formValues={formValues}
          />

          {/* Declinari Time */}
          <NumberField
            field={DELIVERABLE_FORM_FIELDS[4]}
            register={register}
            errors={errors}
            setValue={setValue}
            trigger={trigger}
            formValues={formValues}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <DynamicButton
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </DynamicButton>
          
          <DynamicButton
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            {mode === 'create' ? 'Create Deliverable' : 'Update Deliverable'}
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default DeliverableForm;
