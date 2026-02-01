import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/icons';
import { CARD_SYSTEM } from '@/constants';

import { handleValidationError } from '@/features/utils/errorHandling';
import { showValidationError } from '@/utils/toast';
import { loginSchema, LOGIN_FORM_FIELDS } from '@/components/forms/configs/useLoginForm';
import { TextField, PasswordField } from '@/components/forms/components';
import DynamicButton from '@/components/ui/Button/DynamicButton';

const LoginIcon = Icons.buttons.login;



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
    const preparedData = {
      email: data.email?.trim().toLowerCase() ?? '',
      password: data.password ?? '',
    };
    try {
      const result = await login(preparedData);
      reset?.();
      onSuccess?.(result);
    } catch (_err) {
      // AuthContext handles error toast
      throw _err;
    }
  };

  const handleFormError = (errors) => {
    handleValidationError(errors, 'Login Form');
    showValidationError(errors);
  };

  // Top bar uses color_default from COLOR_HEX_MAP
  const cardColorHex = useMemo(
    () => CARD_SYSTEM.COLOR_HEX_MAP.color_default,
    []
  );

  return (
    <div className={`${className} relative bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl overflow-hidden w-full max-w-md`}>
      {/* Accent border on top - clean solid color */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{
          backgroundColor: cardColorHex,
        }}
      />

      <div className="flex flex-col p-8 relative z-10">
        {/* Modern Header Section */}
        <div className="flex items-center gap-4 mb-8">
          {/* Clean Icon with solid background */}
       

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-0">
              Welcome
            </h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Form Section - Clean modern design */}
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-5">
          <div className="space-y-2">
            <TextField
              field={LOGIN_FORM_FIELDS[0]}
              register={register}
              errors={errors}
            />
          </div>

          <div className="space-y-2">
            <PasswordField
              field={LOGIN_FORM_FIELDS[1]}
              register={register}
              errors={errors}
            />
          </div>

          <div className="pt-2">
            <DynamicButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              loading={isSubmitting}
              iconName="login"
              iconPosition="left"
              loadingText="Logging in..."
              className="w-full h-12 font-semibold "
           
            >
              UNLOCk
            </DynamicButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

