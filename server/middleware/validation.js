/**
 * Production-ready input validation middleware
 * Validates and sanitizes request data before it reaches controllers
 */

/**
 * Validates UUID format
 */
export function validateUuid(value, fieldName = 'ID') {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a valid UUID.` };
  }
  if (!UUID_REGEX.test(value.trim())) {
    return { valid: false, error: `${fieldName} format is invalid.` };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validates email format
 */
export function validateEmail(email, fieldName = 'Email') {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: `${fieldName} is required.` };
  }
  const trimmed = email.trim().toLowerCase();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: `${fieldName} format is invalid.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates non-empty string
 */
export function validateRequiredString(value, fieldName, minLength = 1, maxLength = null) {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} is required.` };
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} character(s).` };
  }
  if (maxLength && trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters.` };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates optional string
 */
export function validateOptionalString(value, fieldName, maxLength = null) {
  if (value === null || value === undefined) {
    return { valid: true, value: null };
  }
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string.` };
  }
  const trimmed = value.trim();
  if (maxLength && trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters.` };
  }
  return { valid: true, value: trimmed || null };
}

/**
 * Validates integer
 */
export function validateInteger(value, fieldName, min = null, max = null) {
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required.` };
  }
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) {
    return { valid: false, error: `${fieldName} must be an integer.` };
  }
  if (min !== null && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}.` };
  }
  if (max !== null && num > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}.` };
  }
  return { valid: true, value: num };
}

/**
 * Validates date string (ISO format)
 */
export function validateDate(value, fieldName = 'Date') {
  if (value === null || value === undefined) {
    return { valid: true, value: null };
  }
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string.` };
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} format is invalid. Use ISO format (YYYY-MM-DD).` };
  }
  return { valid: true, value: value.trim() };
}

/**
 * Validates enum value
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required.` };
  }
  if (!allowedValues.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(', ')}.` };
  }
  return { valid: true, value };
}

/**
 * Validates array
 */
export function validateArray(value, fieldName, minLength = 0, maxLength = null) {
  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array.` };
  }
  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} must have at least ${minLength} item(s).` };
  }
  if (maxLength !== null && value.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} item(s).` };
  }
  return { valid: true, value };
}

/**
 * Express middleware: validate request body against schema
 * Usage: validateBody({ title: 'required|string|max:255', status: 'optional|enum:todo,in-progress,completed' })
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body?.[field];
      const ruleParts = rules.split('|');
      const isRequired = ruleParts.includes('required');
      const isOptional = ruleParts.includes('optional');

      // Skip validation if optional and value is missing
      if (isOptional && (value === null || value === undefined)) {
        sanitized[field] = null;
        continue;
      }

      // Check required
      if (isRequired && (value === null || value === undefined || value === '')) {
        errors.push({ field, error: `${field} is required.` });
        continue;
      }

      // Skip if optional and empty
      if (isOptional && (value === null || value === undefined || value === '')) {
        sanitized[field] = null;
        continue;
      }

      // Validate based on rules
      for (const rule of ruleParts) {
        if (rule === 'required' || rule === 'optional') continue;

        if (rule === 'uuid') {
          const result = validateUuid(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'email') {
          const result = validateEmail(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule.startsWith('string')) {
          const maxMatch = rule.match(/max:(\d+)/);
          const minMatch = rule.match(/min:(\d+)/);
          const maxLength = maxMatch ? parseInt(maxMatch[1], 10) : null;
          const minLength = minMatch ? parseInt(minMatch[1], 10) : 1;
          const result = validateRequiredString(value, field, minLength, maxLength);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'integer') {
          const result = validateInteger(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'date') {
          const result = validateDate(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule.startsWith('enum:')) {
          const allowedValues = rule.split(':')[1].split(',');
          const result = validateEnum(value, allowedValues, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'array') {
          const result = validateArray(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'json') {
          // JSON validation - already parsed by express.json()
          sanitized[field] = value;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    // Attach sanitized body to request
    req.sanitizedBody = sanitized;
    next();
  };
}

/**
 * Express middleware: validate query parameters
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query?.[field];
      const ruleParts = rules.split('|');
      const isRequired = ruleParts.includes('required');
      const isOptional = ruleParts.includes('optional');

      if (isOptional && (value === null || value === undefined)) {
        sanitized[field] = null;
        continue;
      }

      if (isRequired && (value === null || value === undefined || value === '')) {
        errors.push({ field, error: `Query parameter ${field} is required.` });
        continue;
      }

      // Validate based on rules (similar to validateBody)
      for (const rule of ruleParts) {
        if (rule === 'required' || rule === 'optional') continue;

        if (rule === 'uuid') {
          const result = validateUuid(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else if (rule === 'integer') {
          const result = validateInteger(value, field);
          if (!result.valid) {
            errors.push({ field, error: result.error });
            break;
          }
          sanitized[field] = result.value;
        } else {
          sanitized[field] = value;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Query validation failed.',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    req.sanitizedQuery = sanitized;
    next();
  };
}
