import { extractTaskNumber } from '../validation/validationRules';
import { normalizeTimestamp } from '../../utils/dateUtils';

// Handle conditional field defaults and business logic
export const handleConditionalFieldDefaults = (values) => {
  const updatedValues = { ...values };

  // Handle AI fields
  if (!updatedValues.aiUsed) {
    updatedValues.timeSpentOnAI = 0;
    updatedValues.aiModels = [];
  } else {
    // Set default AI time if not provided
    if (!updatedValues.timeSpentOnAI) {
      updatedValues.timeSpentOnAI = 0.5;
    }
    // Ensure aiModels is an array
    if (!Array.isArray(updatedValues.aiModels)) {
      updatedValues.aiModels = [];
    }
  }

  // Handle Other Deliverables
  const deliverables = Array.isArray(updatedValues.deliverables) ? updatedValues.deliverables : [];
  const hasOthers = deliverables.includes('others');
  
  if (!hasOthers) {
    updatedValues.deliverablesOther = [];
  } else {
    // Ensure deliverablesOther is an array
    if (!Array.isArray(updatedValues.deliverablesOther)) {
      updatedValues.deliverablesOther = [];
    }
  }

  // Auto-calculate deliverables count
  updatedValues.deliverablesCount = deliverables.length;

  return updatedValues;
};

// Data preparation functions for different form types
export const prepareTaskData = (values, context = {}) => {
  const { user, monthId, reporters = [] } = context;
  
  // Extract task number from Jira link
  const taskNumber = extractTaskNumber(values.jiraLink);
  
  // Find the selected reporter to get their name
  const selectedReporter = reporters.find(reporter => 
    reporter.id === values.reporters || reporter.reporterUID === values.reporters
  );

  // Handle AI fields based on aiUsed checkbox
  const aiUsed = Boolean(values.aiUsed);
  const timeSpentOnAI = aiUsed ? (values.timeSpentOnAI || 0) : 0;
  const aiModels = aiUsed && Array.isArray(values.aiModels) ? values.aiModels : [];

  // Handle Other Deliverables based on deliverables selection
  const deliverables = Array.isArray(values.deliverables) ? values.deliverables : [];
  const hasOthers = deliverables.includes('others');
  const deliverablesOther = hasOthers && Array.isArray(values.deliverablesOther) ? values.deliverablesOther : [];

  // Auto-calculate deliverables count
  const deliverablesCount = deliverables.length;

  // Auto-calculate AI time based on models if not provided
  let finalTimeSpentOnAI = timeSpentOnAI;
  if (aiUsed && aiModels.length > 0 && !timeSpentOnAI) {
    finalTimeSpentOnAI = Math.max(0.5, aiModels.length * 0.5);
  }

  // Prepare task data
  return {
    ...values,
    taskNumber,
    aiUsed,
    timeSpentOnAI: finalTimeSpentOnAI,
    aiModels,
    timeInHours: values.timeInHours || 0,
    markets: Array.isArray(values.markets) ? values.markets : [],
    deliverables,
    deliverablesOther,
    deliverablesCount,
    reworked: Boolean(values.reworked),
    reporters: values.reporters || "",
    reporterName: selectedReporter?.name || "",
    reporterEmail: selectedReporter?.email || "",
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    userUID: user?.uid,
    monthId: monthId,
    // Remove client-side timestamps - server will handle with serverTimestamp()
  };
};

export const prepareUserData = (values, context = {}) => {
  const { user } = context;
  
  return {
    ...values,
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    // Remove client-side timestamps - server will handle with serverTimestamp()
  };
};

export const prepareReporterData = (values, context = {}) => {
  const { user } = context;
  
  return {
    ...values,
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    // Remove client-side timestamps - server will handle with serverTimestamp()
  };
};

export const prepareLoginData = (values, context = {}) => {
  // Login data doesn't need much preparation
  return {
    ...values,
    // Remove client-side timestamp - server will handle if needed
  };
};

// Generic data preparator
export const prepareFormData = (formType, values, context = {}) => {
  switch (formType) {
    case 'task':
      return prepareTaskData(values, context);
    case 'user':
      return prepareUserData(values, context);
    case 'reporter':
      return prepareReporterData(values, context);
    case 'login':
      return prepareLoginData(values, context);
    default:
      return values;
  }
};
