import { extractTaskNumber } from './sanitization';

// Data preparation functions for different form types
export const prepareTaskData = (values, context = {}) => {
  const { user, monthId, reporters = [] } = context;
  
  // Extract task number from Jira link
  const taskNumber = extractTaskNumber(values.jiraLink);
  
  // Find the selected reporter to get their name
  const selectedReporter = reporters.find(reporter => 
    reporter.id === values.reporters || reporter.reporterUID === values.reporters
  );

  // Prepare task data
  return {
    ...values,
    taskNumber,
    timeSpentOnAI: values.aiUsed ? parseFloat(values.timeSpentOnAI) || 0 : 0,
    timeInHours: parseFloat(values.timeInHours) || 0,
    aiModels: Array.isArray(values.aiModels) ? values.aiModels : [],
    markets: Array.isArray(values.markets) ? values.markets : [],
    deliverables: Array.isArray(values.deliverables) ? values.deliverables : [],
    deliverablesOther: Array.isArray(values.deliverablesOther) ? values.deliverablesOther : [],
    deliverablesCount: Number(values.deliverablesCount) || 0,
    reporters: values.reporters || "",
    reporterName: selectedReporter?.name || "",
    reporterEmail: selectedReporter?.email || "",
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    userUID: user?.uid,
    monthId: monthId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const prepareUserData = (values, context = {}) => {
  const { user } = context;
  
  return {
    ...values,
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const prepareReporterData = (values, context = {}) => {
  const { user } = context;
  
  return {
    ...values,
    createdBy: user?.uid,
    createdByName: user?.displayName || user?.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const prepareLoginData = (values, context = {}) => {
  // Login data doesn't need much preparation
  return {
    ...values,
    timestamp: new Date().toISOString(),
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
