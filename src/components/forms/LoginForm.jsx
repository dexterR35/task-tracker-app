/**
 * Login Form Component
 * 
 * @fileoverview Authentication login form with validation and error handling
 * @author Senior Developer
 * @version 2.0.0
 */

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';
import { handleValidationError, handleSuccess } from '@/features/utils/errorHandling';
import { prepareFormData, createFormSubmissionHandler, handleFormValidation } from '@/utils/formUtils';
import { loginSchema, LOGIN_FORM_FIELDS } from '@/components/forms/configs/useLoginForm';
import TextField from '@/components/forms/components/TextField';
import PasswordField from '@/components/forms/components/PasswordField';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { logger } from '@/utils/logger';


/**
 * Login Form Component
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback function
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Login form component
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

  // Create standardized form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (data) => {
      // Prepare login data with lowercase enforcement for email
      const preparedData = prepareFormData(data, {
        fieldsToLowercase: ['email'],
        fieldsToKeepUppercase: [] // No uppercase exceptions for login
      });
      
      return await login(preparedData);
    },
    {
      operation: 'login',
      resource: 'user',
      onSuccess: (result) => {
        handleSuccess('Login successful!', result, 'User Login');
        onSuccess?.(result);
      },
      showSuccessToast: false // Success toast is handled in onSuccess callback
    }
  );

  const onSubmit = async (data) => {
    await handleFormSubmit(data, { reset, setError: () => {}, clearErrors: () => {} });
  };

  const handleFormError = (errors) => {
    handleFormValidation(errors, 'Login Form');
  };

  return (
    <div className={`${className} card w-100 p-6`}>
      <h2 className='font-bold mb-1'>
        Login
      </h2>
      <p className='mb-10 text-sm'>
     Sign in to your account
    </p>
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-8">
        <TextField
          field={LOGIN_FORM_FIELDS[0]} 
          register={register}
          errors={errors}
        />
        <PasswordField
          field={LOGIN_FORM_FIELDS[1]} 
          register={register}
          errors={errors}
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
            className="w-full h-12"
          >
            UNlock
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

