import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateReporterMutation, useUpdateReporterMutation } from '@/features/reporters/reportersApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { handleValidationError, handleSuccess, withMutationErrorHandling } from '@/utils/errorUtils';
import { createFormSubmissionHandler, handleFormValidation } from '@/utils/formUtils';
import { reporterFormSchema, REPORTER_FORM_FIELDS } from '../../config/useReporterForm';
import { TextField, SelectField } from '../../../../components/forms/components';
import { getInputType } from '../../../../components/forms/configs/sharedFormUtils';
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
  className = "" 
}) => {
  const { user } = useAuth();
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  
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
      logger.log('🔄 Reporter form reset with initial data:', initialData);
    }
  }, [initialData, mode, reset]);

  // Create standardized form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (data) => {
      if (mode === 'edit' && initialData?.id) {
        // Update existing reporter
        const updateReporterWithErrorHandling = withMutationErrorHandling(updateReporter, {
          operation: 'Update Reporter',
          showToast: false,
          logError: true
        });
        
        return await updateReporterWithErrorHandling({
          id: initialData.id,
          updates: data,
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
          reporter: data,
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
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {formTitle}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        <TextField
          field={REPORTER_FORM_FIELDS[0]} // name field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        <TextField
          field={REPORTER_FORM_FIELDS[1]} // email field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        <SelectField
          field={REPORTER_FORM_FIELDS[2]} // department field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        <SelectField
          field={REPORTER_FORM_FIELDS[3]} // country field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        <SelectField
          field={REPORTER_FORM_FIELDS[4]} // channel name field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        
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

