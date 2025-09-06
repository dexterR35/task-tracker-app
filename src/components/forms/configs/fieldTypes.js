// No need to import input components - using native Formik components

// Field type definitions for validation and sanitization
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  URL: 'url',
  NUMBER: 'number',
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  DATE: 'date',
  PASSWORD: 'password',
  MULTI_VALUE: 'multiValue',
};

// Field handlers - single source of truth for all field operations
export const FIELD_HANDLERS = {
  [FIELD_TYPES.TEXT]: {
    render: 'TextInput',
    validation: 'string',
    sanitize: 'text',
    defaultProps: { type: 'text' }
  },
  
  [FIELD_TYPES.TEXTAREA]: {
    render: 'TextInput',
    validation: 'string',
    sanitize: 'text',
    defaultProps: { as: 'textarea', rows: 3 }
  },
  
  [FIELD_TYPES.EMAIL]: {
    render: 'TextInput',
    validation: 'email',
    sanitize: 'email',
    defaultProps: { type: 'email' }
  },
  
  [FIELD_TYPES.URL]: {
    render: 'TextInput',
    validation: 'url',
    sanitize: 'url',
    defaultProps: { type: 'url' }
  },
  
  [FIELD_TYPES.NUMBER]: {
    render: 'NumberInput',
    validation: 'number',
    sanitize: 'number',
    defaultProps: { type: 'number', step: 1 }
  },
  
  [FIELD_TYPES.SELECT]: {
    render: 'SelectInput',
    validation: 'string',
    sanitize: 'text',
    defaultProps: {}
  },
  
  [FIELD_TYPES.MULTI_SELECT]: {
    render: 'MultiSelectInput',
    validation: 'array',
    sanitize: 'array',
    defaultProps: { value: [] }
  },
  
  [FIELD_TYPES.CHECKBOX]: {
    render: 'CheckboxInput',
    validation: 'boolean',
    sanitize: 'boolean',
    defaultProps: { type: 'checkbox' }
  },
  
  [FIELD_TYPES.PASSWORD]: {
    render: 'TextInput',
    validation: 'string',
    sanitize: 'password',
    defaultProps: { type: 'password' }
  },
  
  [FIELD_TYPES.MULTI_VALUE]: {
    render: 'MultiValueInput',
    validation: 'array',
    sanitize: 'array',
    defaultProps: { value: [], maxValues: 10 }
  },
  
  [FIELD_TYPES.DATE]: {
    render: 'TextInput',
    validation: 'date',
    sanitize: 'date',
    defaultProps: { type: 'date' }
  }
};

// Helper functions to get field information
export const getFieldHandler = (type) => {
  return FIELD_HANDLERS[type] || FIELD_HANDLERS[FIELD_TYPES.TEXT];
};

export const getFieldValidationType = (type) => {
  return getFieldHandler(type).validation;
};

export const getFieldSanitizeType = (type) => {
  return getFieldHandler(type).sanitize;
};

export const getFieldRenderComponent = (type) => {
  return getFieldHandler(type).render;
};

export const getFieldDefaultProps = (type) => {
  return getFieldHandler(type).defaultProps || {};
};

// Get the component type for Formik Field rendering
export const getComponentForField = (type) => {
  const handler = getFieldHandler(type);
  const componentName = handler.render;
  
  switch (componentName) {
    case 'TextInput':
      return 'input';
    case 'SelectInput':
      return 'select';
    case 'MultiSelectInput':
      return 'select';
    case 'CheckboxInput':
      return 'input';
    case 'NumberInput':
      return 'input';
    case 'MultiValueInput':
      return 'input';
    default:
      return 'input'; // Fallback to input
  }
};
