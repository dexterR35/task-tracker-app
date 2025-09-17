import * as Yup from "yup";
import {
  createNetBetEmailField,
  createPasswordField,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
} from "./sharedFormUtils";

// ===== LOGIN FORM FIELD CONFIGURATION =====
export const LOGIN_FORM_FIELDS = [
  createNetBetEmailField("email", "NetBet Email Address", {
    placeholder: "Enter your NetBet email",
    helpText: "Only @netbet.ro email addresses are accepted",
  }),
  createPasswordField("password", "Password", {
    placeholder: "Enter your password",
  }),
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
    .min(6, VALIDATION_MESSAGES.MIN_LENGTH(6))
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      VALIDATION_MESSAGES.PASSWORD_STRENGTH
    ),
});
