import * as Yup from 'yup';
import { 
  createTextField,
  createNumberField,
  createSelectField,
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES
} from '@/components/forms/configs/sharedFormUtils';

// ===== DELIVERABLE FORM FIELD CONFIGURATION =====
export const DELIVERABLE_FORM_FIELDS = [
  createTextField("name", "Deliverable Name", {
    placeholder: "Enter deliverable name",
    required: true,
    validation: {
      required: VALIDATION_MESSAGES.required,
      minLength: {
        value: 2,
        message: "Name must be at least 2 characters"
      },
      maxLength: {
        value: 50,
        message: "Name must be less than 50 characters"
      },
      pattern: {
        value: VALIDATION_PATTERNS.ALPHANUMERIC_SPACES,
        message: "Name can only contain letters, numbers, and spaces"
      }
    }
  }),
  createNumberField("timePerUnit", "Time Per Unit", {
    placeholder: "Enter time per unit",
    required: true,
    min: 0.1,
    max: 999,
    step: 0.1,
    validation: {
      required: VALIDATION_MESSAGES.required,
      min: {
        value: 0.1,
        message: "Time must be at least 0.1"
      },
      max: {
        value: 999,
        message: "Time must be less than 999"
      }
    }
  }),
  createSelectField("timeUnit", "Time Unit", {
    required: true,
    options: [
      { value: "min", label: "Minutes" },
      { value: "hr", label: "Hours" },
      { value: "days", label: "Days" }
    ],
    validation: {
      required: VALIDATION_MESSAGES.required
    }
  }),
  createNumberField("declinariTime", "Declinari Time", {
    placeholder: "Enter declinari time",
    required: true,
    min: 0,
    max: 999,
    step: 1,
    validation: {
      required: VALIDATION_MESSAGES.required,
      min: {
        value: 0,
        message: "Declinari time must be at least 0"
      },
      max: {
        value: 999,
        message: "Declinari time must be less than 999"
      }
    }
  })
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
      }
    }
  });
  
  return Yup.object().shape(schemaShape);
};

// ===== DELIVERABLE FORM UTILITIES =====
export const prepareDeliverableFormData = (formData) => {
  return {
    name: formData.name?.trim() || '',
    timePerUnit: parseFloat(formData.timePerUnit) || 1,
    timeUnit: formData.timeUnit || 'hr',
    requiresQuantity: true, // Always true for deliverables
    declinariTime: parseInt(formData.declinariTime) || 0
  };
};

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

export const validateDeclinariTime = (declinariTime) => {
  const time = parseInt(declinariTime);
  if (isNaN(time) || time < 0) {
    return "Declinari time must be at least 0";
  }
  if (time > 999) {
    return "Declinari time must be less than 999";
  }
  return null;
};
