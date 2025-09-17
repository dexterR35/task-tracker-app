import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateReporterMutation, useUpdateReporterMutation } from '@/features/reporters/reportersApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { handleValidationError, handleSuccess, withMutationErrorHandling } from '@/features/utils/errorHandling';
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
    reset
  } = useForm({
    resolver: yupResolver(reporterFormSchema),
    defaultValues: {
      name: '',
      email: '',
      departament: '',
      country: ''
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
        country: initialData.country || ''
      });
      logger.log('🔄 Reporter form reset with initial data:', initialData);
    }
  }, [initialData, mode, reset]);

  const onSubmit = async (data) => {
    try {
      logger.log('👤 Reporter form submission started:', { mode, data });
      
      let result;
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing reporter
        const updateReporterWithErrorHandling = withMutationErrorHandling(updateReporter, {
          operation: 'Update Reporter',
          showToast: false,
          logError: true
        });
        
        result = await updateReporterWithErrorHandling({
          id: initialData.id,
          updates: data,
          userData: user
        });
        
        logger.log('✅ Reporter updated successfully:', result);
        handleSuccess('Reporter updated successfully!', result, 'Update Reporter');
        
      } else {
        // Create new reporter
        const createReporterWithErrorHandling = withMutationErrorHandling(createReporter, {
          operation: 'Create Reporter',
          showToast: false,
          logError: true
        });
        
        result = await createReporterWithErrorHandling({
          reporter: data,
          userData: user
        });
        
        logger.log('✅ Reporter created successfully:', result);
        handleSuccess('Reporter created successfully!', result, 'Create Reporter');
      }
      
      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);
      
    } catch (error) {
      logger.error('❌ Reporter form submission failed:', error);
      
      // Handle permission errors specifically
      if (error?.message?.includes('permission') || error?.message?.includes('User lacks required')) {
        const action = mode === 'create' ? 'create' : 'update';
        showAuthError(`You do not have permission to ${action} reporters`);
      } else {
        showError(error.message || 'Failed to save reporter. Please try again.');
      }
    }
  };

  const handleFormError = (errors) => {
    handleValidationError(errors, 'Reporter Form');
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

