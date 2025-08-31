import DOMPurify from 'dompurify';
import { FIELD_TYPES } from '../configs/fieldTypes';


// Sanitize HTML content
export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

// Sanitize text content
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/[<>]/g, '');
};

// Sanitize email
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

// Sanitize URL
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  // Basic URL validation
  try {
    const urlObj = new URL(trimmed);
    return urlObj.toString();
  } catch {
    return '';
  }
};

// Handle conditional field defaults
const handleConditionalFieldDefaults = (data) => {
  const updatedData = { ...data };

  // Handle AI fields
  if (!updatedData.aiUsed) {
    updatedData.timeSpentOnAI = 0;
    updatedData.aiModels = [];
  } else {
    if (!updatedData.timeSpentOnAI) {
      updatedData.timeSpentOnAI = 0.5;
    }
    if (!Array.isArray(updatedData.aiModels)) {
      updatedData.aiModels = [];
    }
  }

  // Handle Other Deliverables
  const deliverables = Array.isArray(updatedData.deliverables) ? updatedData.deliverables : [];
  const hasOthers = deliverables.includes('others');
  
  if (!hasOthers) {
    updatedData.deliverablesOther = [];
  } else {
    if (!Array.isArray(updatedData.deliverablesOther)) {
      updatedData.deliverablesOther = [];
    }
  }

  // Auto-calculate deliverables count
  updatedData.deliverablesCount = deliverables.length;

  return updatedData;
};

// Sanitize form data based on field configuration
export const sanitizeFormData = (data, fields) => {
  // Handle conditional field defaults first
  const dataWithDefaults = handleConditionalFieldDefaults(data);
  
  const sanitizedData = {};
  
  fields.forEach(field => {
    const value = dataWithDefaults[field.name];
    sanitizedData[field.name] = sanitizeFieldValue(value, field);
  });
  
  return sanitizedData;
};

// Sanitize individual field value based on field type
export const sanitizeFieldValue = (value, fieldConfig) => {
  const { type, sanitization = {} } = fieldConfig;
  
  if (value === null || value === undefined) {
    return value;
  }

  let sanitizedValue = value;

  // Apply type-specific sanitization
  switch (type) {
    case FIELD_TYPES.TEXT:
    case FIELD_TYPES.TEXTAREA:
      sanitizedValue = sanitizeText(value);
      break;
      
    case FIELD_TYPES.EMAIL:
      sanitizedValue = sanitizeEmail(value);
      break;
      
    case FIELD_TYPES.URL:
      sanitizedValue = sanitizeUrl(value);
      break;
      
    case FIELD_TYPES.NUMBER:
      sanitizedValue = Number(value) || 0;
      break;
      
    case FIELD_TYPES.CHECKBOX:
      sanitizedValue = Boolean(value);
      break;
      
    case FIELD_TYPES.MULTI_SELECT:
    case FIELD_TYPES.MULTI_VALUE:
      if (Array.isArray(value)) {
        sanitizedValue = value.map(item => sanitizeText(item)).filter(Boolean);
      } else {
        sanitizedValue = [];
      }
      break;
      
    case FIELD_TYPES.SELECT:
      sanitizedValue = sanitizeText(value);
      break;
      
    case FIELD_TYPES.DATE:
      sanitizedValue = typeof value === 'string' ? value.trim() : value;
      break;
      
    case FIELD_TYPES.PASSWORD:
      sanitizedValue = typeof value === 'string' ? value.trim() : String(value).trim();
      break;
      
    default:
      sanitizedValue = sanitizeText(value);
  }

  // Apply custom sanitization
  if (sanitization.custom) {
    sanitizedValue = sanitization.custom(sanitizedValue);
  }

  return sanitizedValue;
};



// Extract and normalize document ID from various formats (Firestore paths, objects, etc.)
export const extractDocumentId = (documentId) => {
  if (!documentId) return null;
  
  // If it's already a simple ID, return it
  if (typeof documentId === 'string' && !documentId.includes('/')) {
    return documentId;
  }
  
  // If it's a full Firestore path, extract the last part
  if (typeof documentId === 'string' && documentId.includes('/')) {
    const pathParts = documentId.split('/');
    return pathParts[pathParts.length - 1];
  }
  
  // If it's an object with id property
  if (typeof documentId === 'object' && documentId.id) {
    return extractDocumentId(documentId.id);
  }
  
  return documentId;
};

// Normalize task data for API operations
export const normalizeTaskData = (taskData, context = {}) => {
  const { monthId } = context;
  
  // Extract document ID
  const taskId = extractDocumentId(taskData.id || taskData);
  
  // Preserve original monthId or use context
  const taskMonthId = taskData.monthId || monthId;
  
  return {
    taskId,
    monthId: taskMonthId,
    originalData: taskData
  };
};



// Sanitize task data (pure sanitization only)
export const sanitizeTaskData = (taskData) => {
  if (!taskData || typeof taskData !== 'object') return {};

  return {
    jiraLink: sanitizeUrl(taskData.jiraLink || ''),
    taskNumber: sanitizeText(taskData.taskNumber || ''),
    markets: Array.isArray(taskData.markets) 
      ? taskData.markets.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    product: sanitizeText(taskData.product || ''),
    taskName: sanitizeText(taskData.taskName || ''),
    aiUsed: Boolean(taskData.aiUsed),
    timeSpentOnAI: Number(taskData.timeSpentOnAI) || 0,
    aiModels: Array.isArray(taskData.aiModels) 
      ? taskData.aiModels.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    timeInHours: Number(taskData.timeInHours) || 0,
    reworked: Boolean(taskData.reworked),
    deliverables: Array.isArray(taskData.deliverables)
      ? taskData.deliverables.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    deliverablesOther: Array.isArray(taskData.deliverablesOther)
      ? taskData.deliverablesOther.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    deliverablesCount: Number(taskData.deliverablesCount) || 0,
    reporters: sanitizeText(taskData.reporters || ''),
    createdBy: sanitizeText(taskData.createdBy || ''),
    createdByName: sanitizeText(taskData.createdByName || ''),
    userUID: sanitizeText(taskData.userUID || ''),
    monthId: sanitizeText(taskData.monthId || ''),
  };
};



// Sanitize user data (pure sanitization, no validation)
export const sanitizeUserData = (userData) => {
  if (!userData || typeof userData !== 'object') return {};

  return {
    name: sanitizeText(userData.name || ''),
    email: sanitizeEmail(userData.email || ''),
    role: sanitizeText(userData.role || 'user'),
    userUID: sanitizeText(userData.userUID || ''),
    isActive: Boolean(userData.isActive),
  };
};

// Sanitize reporter data
export const sanitizeReporterData = (reporterData) => {
  if (!reporterData || typeof reporterData !== 'object') return {};

  return {
    name: sanitizeText(reporterData.name || ''),
    email: sanitizeEmail(reporterData.email || ''),
    role: sanitizeText(reporterData.role || ''),
    departament: sanitizeText(reporterData.departament || ''),
    occupation: sanitizeText(reporterData.occupation || ''),
    createdBy: sanitizeText(reporterData.createdBy || ''),
    createdByName: sanitizeText(reporterData.createdByName || ''),
  };
};

// Sanitize login form data
export const sanitizeLoginData = (loginData) => {
  if (!loginData || typeof loginData !== 'object') return {};

  return {
    email: sanitizeEmail(loginData.email || ''),
    password: typeof loginData.password === 'string' ? loginData.password.trim() : '',
    rememberMe: Boolean(loginData.rememberMe),
  };
};



// Format task display name for table
export const formatTaskDisplayName = (taskId, taskNumber) => {
  if (!taskId) return 'Unknown Task';
  
  // Use taskNumber if available, otherwise use document ID
  const displayNumber = taskNumber || taskId;
  return `gimodear-${displayNumber}`;
};
