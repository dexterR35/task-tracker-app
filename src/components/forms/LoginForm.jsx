import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showSuccess, showError } from '@/utils/toast';
import { handleValidationError, handleSuccess } from '@/features/utils/errorHandling';
import { loginSchema, LOGIN_FORM_FIELDS } from './configs/useLoginForm';
import { TextField, PasswordField } from './components';
import { getInputType } from './configs/sharedFormUtils';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { logger } from '@/utils/logger';

/**
 * Dedicated Login Form Component
 * Handles user authentication with proper validation and error handling
 */
const LoginForm = ({ onSuccess, className = "" }) => {
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const onSubmit = async (data) => {
    try {
      logger.log('🔐 Login attempt started:', { email: data.email });
      const result = await login(data);
      logger.log('✅ Login successful:', result);
      handleSuccess('Login successful!', result, 'User Login');
      // Reset form
      reset();
      // Call success callback if provided
      onSuccess?.(result);
    } catch (error) {
      logger.error('❌ Login failed:', error);
      showError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleFormError = (errors) => {
    handleValidationError(errors, 'Login Form');
  };

  return (
    <div className={`${className} card-container  p-6 w-1/5 rounded-lg mx-auto border-2 border-gray-300 `}>
      <h3 className='text-2xl font-bold text-gray-800 dark:text-gray-200 mb-0'>
        Login
      </h3>
      <p className='mb-6'>
     Sign in to your account
    </p>
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        <TextField
          field={LOGIN_FORM_FIELDS[0]} // email field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        <PasswordField
          field={LOGIN_FORM_FIELDS[1]} // password field
          register={register}
          errors={errors}
          getInputType={getInputType}
          formValues={{}}
        />
        
        <div className="flex justify-center">
          <DynamicButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
            iconName="login"
            iconPosition="left"
            loadingText="Logging in..."
            className="w-full"
          >
            Login
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

