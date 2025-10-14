import * as Yup from 'yup';
import { VALIDATION, FORM_OPTIONS } from '@/constants';
import { TASK_FORM_OPTIONS } from '@/features/tasks/config/useTaskForm';

// ===== DELIVERABLE FORM FIELD CONFIGURATION =====
export const DELIVERABLE_FORM_FIELDS = [
  {
    name: "name",
    type: "text",
    label: "Deliverable Name",
    required: true,
    placeholder: "Enter deliverable name",
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED,
      minLength: {
        value: VALIDATION.LIMITS.NAME_MIN,
        message: VALIDATION.MESSAGES.MIN_LENGTH(VALIDATION.LIMITS.NAME_MIN)
      },
      maxLength: {
        value: VALIDATION.LIMITS.NAME_MAX,
        message: VALIDATION.MESSAGES.MAX_LENGTH(VALIDATION.LIMITS.NAME_MAX)
      },
      pattern: {
        value: VALIDATION.PATTERNS.ALPHANUMERIC_SPACES,
        message: "Name can only contain letters, numbers, and spaces"
      }
    }
  },
  {
    name: "department",
    type: "select",
    label: "Department",
    required: true,
    options: TASK_FORM_OPTIONS.departments,
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED
    }
  },
  {
    name: "timePerUnit",
    type: "number",
    label: "Time Per Unit",
    required: true,
    placeholder: "Enter time per unit",
    min: 0.1,
    max: 999,
    step: 0.1,
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED,
      min: {
        value: VALIDATION.LIMITS.TIME_MIN,
        message: VALIDATION.MESSAGES.MIN_VALUE(VALIDATION.LIMITS.TIME_MIN)
      },
      max: {
        value: VALIDATION.LIMITS.TIME_MAX,
        message: VALIDATION.MESSAGES.MAX_VALUE(VALIDATION.LIMITS.TIME_MAX)
      }
    }
  },
  {
    name: "timeUnit",
    type: "select",
    label: "Time Unit",
    required: true,
    options: [
      { value: "min", label: "Minutes" },
      { value: "hr", label: "Hours" },
      { value: "days", label: "Days" }
    ],
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED
    }
  },
  {
    name: "variationsTime",
    type: "number",
    label: "Variations Time",
    required: true,
    placeholder: "Enter variations time",
    min: 0,
    max: 999,
    step: 1,
    validation: {
      required: VALIDATION.MESSAGES.REQUIRED,
      min: {
        value: 0,
        message: "variations time must be at least 0"
      },
      max: {
        value: 999,
        message: "variations time must be less than 999"
      }
    }
  },
  {
    name: "requiresQuantity",
    type: "checkbox",
    label: "Requires Quantity",
    required: false,
    validation: {
      required: false
    }
  }
];

// ===== DELIVERABLE FORM SCHEMA =====
export const createDeliverableFormSchema = (fields) => {
  const schemaShape = {};
  
  fields.forEach(field => {
    if (field.validation) {
      // Convert react-hook-form validation to Yup schema
      if (field.type === 'text') {
        let yupField = Yup.string();
        if (field.validation.required) {
          yupField = yupField.required(field.validation.required);
        }
        if (field.validation.minLength) {
          yupField = yupField.min(field.validation.minLength.value, field.validation.minLength.message);
        }
        if (field.validation.maxLength) {
          yupField = yupField.max(field.validation.maxLength.value, field.validation.maxLength.message);
        }
        if (field.validation.pattern) {
          yupField = yupField.matches(field.validation.pattern.value, field.validation.pattern.message);
        }
        schemaShape[field.name] = yupField;
      } else if (field.type === 'number') {
        let yupField = Yup.number();
        if (field.validation.required) {
          yupField = yupField.required(field.validation.required);
        }
        if (field.validation.min) {
          yupField = yupField.min(field.validation.min.value, field.validation.min.message);
        }
        if (field.validation.max) {
          yupField = yupField.max(field.validation.max.value, field.validation.max.message);
        }
        schemaShape[field.name] = yupField;
      } else if (field.type === 'select') {
        let yupField = Yup.string();
        if (field.validation.required) {
          yupField = yupField.required(field.validation.required);
        }
        schemaShape[field.name] = yupField;
      } else if (field.type === 'checkbox') {
        let yupField = Yup.boolean();
        if (field.validation.required) {
          yupField = yupField.required(field.validation.required);
        }
        schemaShape[field.name] = yupField;
      }
    }
  });
  
  return Yup.object().shape(schemaShape);
};

// ===== DELIVERABLE FORM UTILITIES =====
// Note: Data preparation is now handled by the centralized prepareFormData function in formUtils.js

// ===== DELIVERABLE VALIDATION UTILITIES =====
export const validateDeliverableName = (name, existingDeliverables = [], excludeIndex = -1) => {
  if (!name || name.trim().length < 2) {
    return "Name must be at least 2 characters";
  }
  
  if (name.trim().length > 50) {
    return "Name must be less than 50 characters";
  }
  
  // Check for duplicates
  const trimmedName = name.trim().toLowerCase();
  const duplicate = existingDeliverables.find((deliverable, index) => 
    index !== excludeIndex && 
    deliverable?.name && 
    deliverable.name.toLowerCase() === trimmedName
  );
  
  if (duplicate) {
    return "A deliverable with this name already exists";
  }
  
  return null;
};

export const validateTimePerUnit = (timePerUnit) => {
  const time = parseFloat(timePerUnit);
  if (isNaN(time) || time < 0.1) {
    return "Time per unit must be at least 0.1";
  }
  if (time > 999) {
    return "Time per unit must be less than 999";
  }
  return null;
};

export const validateVariationsTime = (variationsTime) => {
  const time = parseInt(variationsTime);
  if (isNaN(time) || time < 0) {
    return "variations time must be at least 0";
  }
  if (time > 999) {
    return "variations time must be less than 999";
  }
  return null;
};
