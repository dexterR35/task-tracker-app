import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAuth } from "@/context/AuthContext";
import { CARD_SYSTEM, APP_CONFIG } from "@/constants";
import { handleValidationError } from "@/utils/errorHandling";
import { showValidationError } from "@/utils/toast";
import {
  loginSchema,
  LOGIN_FORM_FIELDS,
} from "@/components/forms/configs/useLoginForm";
import {
  TextField,
  PasswordField,
} from "@/components/forms/components/FormFields";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { logger } from "@/utils/logger";

const LoginForm = ({ onSuccess, className = "" }) => {
  const { login } = useAuth();
  const emailField = LOGIN_FORM_FIELDS.find(f => f.name === "email");
  const passwordField = LOGIN_FORM_FIELDS.find(f => f.name === "password");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data) => {
    try {
      const preparedData = {
        email: data.email?.trim().toLowerCase(),
        password: data.password,
      };
      const result = await login(preparedData);
      reset(); // Clear form immediately; token is in-memory only (no localStorage)
      onSuccess?.(result);
    } catch (error) {
      // Logic for server-side errors (e.g., 401 Unauthorized)
      logger.error("Login failed:", error);
    }
  };

  const onInvalid = (errors) => {
    handleValidationError(errors, "Login Form");
    showValidationError(errors);
  };

  return (
    <div className={`relative card-small shadow-xl rounded-2xl !p-8 overflow-hidden w-full max-w-md ${className}`}>
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.color_default }}
      />

      <div className="flex flex-col relative z-10">
        <header className="mb-8">
          <h2 className="text-2xl font-semibold">Welcome</h2>
          <p className="text-sm font-medium text-app-muted">Sign in to your account</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
          <TextField
            field={emailField}
            register={register}
            errors={errors}
          />
          <PasswordField
            field={passwordField}
            register={register}
            errors={errors}
          />
          <div className="pt-2">
            <DynamicButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              loading={isSubmitting}
              iconName="login"
              className="w-full"
            >
              UNLOCK
            </DynamicButton>
          </div>
        </form>
      </div>
      <p className="text-xs text-app-muted text-center pt-4">
        Issues with your account?{" "}
        <a
          href={`mailto:${APP_CONFIG.SUPPORT_EMAIL}`}
          className="font-medium underline"
        >
          Contact Admin
        </a>
      </p>
    </div>
  );
};

export default LoginForm;