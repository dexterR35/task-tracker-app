import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useReporters } from '@/features/reporters/reportersApi';
import { useAuth } from '@/context/AuthContext';
import { createFormSubmissionHandler, handleFormValidation, prepareFormData } from '@/utils/formUtils';
import { reporterFormSchema, createReporterFormFields } from '@/features/reporters/config/useReporterForm';
import { TextField, SelectField } from '@/components/forms/components';
import DynamicButton from '@/components/ui/Button/DynamicButton';


const ReporterForm = ({ 
  mode = 'create', 
  initialData = null, 
  onSuccess, 
  className = ""
}) => {
  const { user } = useAuth();
  const { createReporter, updateReporter } = useReporters();
  
  // Generate static form fields from constants
  const formFields = createReporterFormFields();
  
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
        fieldsToKeepUppercase: [] // Convert all fields to lowercase
      });
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing reporter
        return await updateReporter(initialData.id, transformedData, user);
      } else {
        // Create new reporter
        return await createReporter(transformedData, user);
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

  const submitButtonText = mode === 'edit' ? 'Update Reporter' : 'Create Reporter';

  return (
    <div className={`card ${className}`}>
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        {formFields.map((field) => {
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

