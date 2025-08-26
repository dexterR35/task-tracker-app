import DOMPurify from 'dompurify';

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

// Sanitize task data (pure sanitization, no validation)
export const sanitizeTaskData = (taskData) => {
  if (!taskData || typeof taskData !== 'object') return {};

  return {
    jiraLink: sanitizeUrl(taskData.jiraLink || ''),
    markets: Array.isArray(taskData.markets) 
      ? taskData.markets.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    product: sanitizeText(taskData.product || ''),
    taskName: sanitizeText(taskData.taskName || ''),
    aiUsed: Boolean(taskData.aiUsed),
    timeSpentOnAI: Number(taskData.timeSpentOnAI) || 0,
    // Always use arrays - empty array if not selected
    aiModels: Array.isArray(taskData.aiModels)
      ? taskData.aiModels.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    timeInHours: Number(taskData.timeInHours) || 0,
    reworked: Boolean(taskData.reworked),
    deliverables: Array.isArray(taskData.deliverables)
      ? taskData.deliverables.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    deliverablesCount: Number(taskData.deliverablesCount) || 0,
    // Always use arrays - empty array if not selected
    deliverablesOther: Array.isArray(taskData.deliverablesOther)
      ? taskData.deliverablesOther.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    taskNumber: sanitizeText(taskData.taskNumber || ''),
    reporters: Array.isArray(taskData.reporters) 
      ? taskData.reporters.map(r => sanitizeText(r)).filter(Boolean)
      : [],
    createdBy: sanitizeText(taskData.createdBy || ''),
    createdByName: sanitizeText(taskData.createdByName || ''),
    userUID: sanitizeText(taskData.userUID || ''),
    monthId: sanitizeText(taskData.monthId || ''),
  };
};

// Sanitize task creation form data (pure sanitization, no validation)
export const sanitizeTaskCreationData = (formData) => {
  if (!formData || typeof formData !== 'object') return {};

  return {
    jiraLink: sanitizeUrl(formData.jiraLink || ''),
    markets: Array.isArray(formData.markets) 
      ? formData.markets.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    product: sanitizeText(formData.product || ''),
    taskName: sanitizeText(formData.taskName || ''),
    aiUsed: Boolean(formData.aiUsed),
    timeSpentOnAI: Number(formData.timeSpentOnAI) || 0,
    // Always use arrays - empty array if not selected
    aiModels: Array.isArray(formData.aiModels)
      ? formData.aiModels.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    timeInHours: Number(formData.timeInHours) || 0,
    reworked: Boolean(formData.reworked),
    deliverables: Array.isArray(formData.deliverables)
      ? formData.deliverables.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    deliverablesCount: Number(formData.deliverablesCount) || 0,
    // Always use arrays - empty array if not selected
    deliverablesOther: Array.isArray(formData.deliverablesOther)
      ? formData.deliverablesOther.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    taskNumber: sanitizeText(formData.taskNumber || ''),
    reporters: Array.isArray(formData.reporters) 
      ? formData.reporters.map(r => sanitizeText(r)).filter(Boolean)
      : [],
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

// Sanitize user creation form data (pure sanitization, no validation)
export const sanitizeUserCreationData = (formData) => {
  if (!formData || typeof formData !== 'object') return {};

  return {
    name: sanitizeText(formData.name || ''),
    email: sanitizeEmail(formData.email || ''),
    password: formData.password || '', // Don't sanitize password
    confirmPassword: formData.confirmPassword || '', // Don't sanitize password
  };
};

// Validation functions (separate from sanitization)
export const validateUserCreationData = (formData) => {
  const errors = [];

  if (!formData.name || formData.name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!formData.password || formData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};

export const validateTaskCreationData = (formData) => {
  const errors = [];

  if (!formData.taskName || formData.taskName.length < 3) {
    errors.push('Task name must be at least 3 characters long');
  }

  if (!formData.product || formData.product.length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (formData.timeInHours <= 0) {
    errors.push('Time in hours must be greater than 0');
  }

  if (formData.aiUsed && formData.timeSpentOnAI < 0) {
    errors.push('Time spent on AI cannot be negative');
  }

  if (formData.aiUsed && (!Array.isArray(formData.aiModels) || formData.aiModels.length === 0)) {
    errors.push('Please specify at least one AI model when AI is used');
  }

  if (formData.aiUsed && formData.timeSpentOnAI < 0.5) {
    errors.push('Please specify time spent on AI (minimum 0.5h) when AI is used');
  }

  if (formData.deliverables.length === 0) {
    errors.push('Please specify at least one deliverable');
  }

  // Validate deliverablesOther if deliverables includes "others"
  if (formData.deliverables && formData.deliverables.includes("others")) {
    if (!Array.isArray(formData.deliverablesOther) || formData.deliverablesOther.length === 0) {
      errors.push('Please specify at least one other deliverable when "others" is selected');
    }
  }

  // Validate Jira link if provided
  if (formData.jiraLink) {
    const jiraValidation = validateJiraLink(formData.jiraLink);
    if (!jiraValidation.isValid) {
      errors.push(jiraValidation.error);
    }
  }

  return errors;
};

// Sanitize form data
export const sanitizeFormData = (formData, formType = 'task') => {
  switch (formType) {
    case 'task':
      return sanitizeTaskData(formData);
    case 'taskCreation':
      return sanitizeTaskCreationData(formData);
    case 'user':
      return sanitizeUserData(formData);
    case 'userCreation':
      return sanitizeUserCreationData(formData);
    default:
      return formData;
  }
};

// Validate Jira link format
export const validateJiraLink = (url) => {
  if (!url) return { isValid: false, error: 'Jira link is required' };
  
  const sanitized = sanitizeUrl(url);
  if (!sanitized) return { isValid: false, error: 'Invalid URL format' };
  
  // Check if it's a valid GMRD Atlassian link
  const jiraPattern = /^https:\/\/gmrd\.atlassian\.net\/browse\/GIMODEAR-\d+$/;
  if (!jiraPattern.test(sanitized)) {
    return { 
      isValid: false, 
      error: 'Invalid Jira link format. Must be: https://gmrd.atlassian.net/browse/GIMODEAR-{taskNumber}' 
    };
  }
  
  return { isValid: true, url: sanitized };
};

// Extract task number from Jira link
export const extractTaskNumber = (jiraLink) => {
  if (!jiraLink) return '';
  
  const match = jiraLink.match(/GIMODEAR-(\d+)/);
  return match ? match[1] : '';
};

// Sanitize and validate task number
export const sanitizeTaskNumber = (taskNumber) => {
  if (!taskNumber) return '';
  const sanitized = sanitizeText(taskNumber);
  return sanitized.replace(/[^0-9]/g, ''); // Only keep digits
};
