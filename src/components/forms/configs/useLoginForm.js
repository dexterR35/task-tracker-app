import * as Yup from "yup";
// ===== VALIDATION CONSTANTS =====
const VALIDATION_PATTERNS = {
  NETBET_EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/,
};

const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  NETBET_EMAIL: "Please enter a valid NetBet email address (@netbet.ro)",
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
};

// ===== LOGIN FORM FIELD CONFIGURATION =====
export const LOGIN_FORM_FIELDS = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    required: true,
    placeholder: "Enter your NetBet email",
    autoComplete: "email"
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    required: true,
    placeholder: "Enter your password",
    autoComplete: "current-password"
  }
];

// ===== LOGIN FORM VALIDATION SCHEMA =====
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL)
    .matches(
      VALIDATION_PATTERNS.NETBET_EMAIL,
      VALIDATION_MESSAGES.NETBET_EMAIL
    ),

  password: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(6, VALIDATION_MESSAGES.MIN_LENGTH(6)),
});
