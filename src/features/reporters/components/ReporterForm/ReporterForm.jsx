import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateReporterMutation, useUpdateReporterMutation } from '@/features/reporters/reportersApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { handleValidationError, handleSuccess, withMutationErrorHandling } from '@/features/utils/errorHandling';
import { createFormSubmissionHandler, handleFormValidation, prepareFormData } from '@/utils/formUtils';
import { reporterFormSchema, createReporterFormFields } from '@/features/reporters/config/useReporterForm';
import { TextField, SelectField } from '@/components/forms/components';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { logger } from '@/utils/logger';

/**
 * Dedicated Reporter Form Component
 * Handles creating and updating reporter records
 */
const ReporterForm = ({ 
  mode = 'create', 
  initialData = null, 
  onSuccess, 
  className = "",
  reporters = [] // Pass existing reporters for dynamic options
}) => {
  const { user } = useAuth();
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  
  // Generate dynamic form fields based on existing reporter data
  const formFields = createReporterFormFields(reporters);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm({
    resolver: yupResolver(reporterFormSchema),
    defaultValues: {
      name: '',
      email: '',
      departament: '',
      country: '',
      channelName: ''
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        name: initialData.name || '',
        email: initialData.email || '',
        departament: initialData.departament || '',
        country: initialData.country || '',
        channelName: initialData.channelName || ''
      });
    }
  }, [initialData, mode, reset]);

  // Create standardized form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (data) => {
      // Prepare reporter data with lowercase enforcement
      const transformedData = prepareFormData(data, {
        fieldsToLowercase: ['name', 'email', 'departament', 'country', 'channelName'],
        fieldsToKeepUppercase: []
      });
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing reporter
        const updateReporterWithErrorHandling = withMutationErrorHandling(updateReporter, {
          operation: 'Update Reporter',
          showToast: false,
          logError: true
        });
        
        return await updateReporterWithErrorHandling({
          id: initialData.id,
          updates: transformedData,
          userData: user
        });
      } else {
        // Create new reporter
        const createReporterWithErrorHandling = withMutationErrorHandling(createReporter, {
          operation: 'Create Reporter',
          showToast: false,
          logError: true
        });
        
        return await createReporterWithErrorHandling({
          reporter: transformedData,
          userData: user
        });
      }
    },
    {
      operation: mode === 'edit' ? 'update' : 'create',
      resource: 'reporter',
      onSuccess: (result) => {
        reset();
        onSuccess?.(result);
      }
    }
  );

  const onSubmit = async (data) => {
    await handleFormSubmit(data, { reset, setError, clearErrors });
  };

  const handleFormError = (errors) => {
    handleFormValidation(errors, 'Reporter Form');
  };

  const formTitle = mode === 'edit' ? 'Edit Reporter' : 'Create New Reporter';
  const submitButtonText = mode === 'edit' ? 'Update Reporter' : 'Create Reporter';

  return (
    <div className={`card ${className}`}>
      <h2 className="text-2xl font-bold mb-4 ">
        {/* {formTitle} */}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        {formFields.map((field, index) => {
          const FieldComponent = field.type === 'select' ? SelectField : TextField;
          return (
            <FieldComponent
              key={field.name}
              field={field}
              register={register}
              errors={errors}
              formValues={{}}
            />
          );
        })}
        
        <div className="flex justify-end">
          <DynamicButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
            iconName={mode === 'create' ? 'add' : 'edit'}
            iconPosition="left"
            loadingText="Saving..."
            className="min-w-[120px]"
          >
            {submitButtonText}
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default ReporterForm;

