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

// Sanitize task data
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
    aiModels: Array.isArray(taskData.aiModels)
      ? taskData.aiModels.map(m => sanitizeText(m)).filter(Boolean)
      : [],
    timeInHours: Number(taskData.timeInHours) || 0,
    reworked: Boolean(taskData.reworked),
    deliverables: Array.isArray(taskData.deliverables)
      ? taskData.deliverables.map(d => sanitizeText(d)).filter(Boolean)
      : [],
    deliverablesCount: Number(taskData.deliverablesCount) || 0,
    deliverablesOther: sanitizeText(taskData.deliverablesOther || ''),
    taskNumber: sanitizeText(taskData.taskNumber || ''),
    createdBy: sanitizeText(taskData.createdBy || ''),
    createdByName: sanitizeText(taskData.createdByName || ''),
    userUID: sanitizeText(taskData.userUID || ''),
    monthId: sanitizeText(taskData.monthId || ''),
  };
};

// Sanitize user data
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

// Sanitize form data
export const sanitizeFormData = (formData, formType = 'task') => {
  switch (formType) {
    case 'task':
      return sanitizeTaskData(formData);
    case 'user':
      return sanitizeUserData(formData);
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
