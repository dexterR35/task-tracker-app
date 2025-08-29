# Dynamic Form System

## Overview

The new dynamic form system provides a centralized, configuration-driven approach to form validation and sanitization. This makes it easy to add new fields, modify validation rules, and maintain consistency across your application.

## Key Features

- ✅ **Centralized Configuration** - All field definitions in one place
- ✅ **Automatic Validation** - Yup schemas generated from configuration
- ✅ **Automatic Sanitization** - Input sanitization based on field type
- ✅ **Easy Field Addition** - Add new fields with minimal code changes
- ✅ **Type Safety** - Strong typing for field configurations
- ✅ **Conditional Fields** - Show/hide fields based on conditions
- ✅ **Reusable Components** - Use the same system across all forms

## How It Works

### 1. Field Configuration

Fields are defined using a simple configuration object:

```javascript
{
  name: 'fieldName',
  type: FIELD_TYPES.TEXT,
  label: 'Field Label',
  required: true,
  validation: {
    minLength: 3,
    maxLength: 50
  },
  helpText: 'Help text for the field'
}
```

### 2. Field Types

Available field types:

- `TEXT` - Regular text input
- `EMAIL` - Email input with validation
- `URL` - URL input with validation
- `NUMBER` - Number input
- `SELECT` - Dropdown select
- `MULTI_SELECT` - Multi-select dropdown
- `CHECKBOX` - Checkbox input
- `TEXTAREA` - Multi-line text input
- `DATE` - Date picker
- `PASSWORD` - Password input
- `MULTI_VALUE` - Multi-value input (tags)

### 3. Validation Rules

Validation is defined in the field configuration:

```javascript
validation: {
  minLength: 3,
  maxLength: 50,
  minValue: 0,
  maxValue: 100,
  pattern: /^[a-zA-Z]+$/,
  custom: {
    test: (value) => value.includes('test'),
    message: 'Value must contain "test"'
  }
}
```

### 4. Conditional Fields

Fields can be shown/hidden based on other field values:

```javascript
conditional: {
  field: 'aiUsed',
  value: true,
  required: true
}
```

## Usage Examples

### Basic Form

```javascript
import { DynamicForm, PREDEFINED_FIELDS } from '../shared/components/ui/form';

const MyForm = () => {
  const fields = [
    {
      name: 'name',
      type: FIELD_TYPES.TEXT,
      label: 'Name',
      required: true,
      validation: { minLength: 2 }
    },
    {
      name: 'email',
      type: FIELD_TYPES.EMAIL,
      label: 'Email',
      required: true
    }
  ];

  const handleSubmit = (values) => {
    console.log('Form submitted:', values);
  };

  return (
    <DynamicForm
      fields={fields}
      onSubmit={handleSubmit}
      title="My Form"
    />
  );
};
```

### Using Predefined Fields

```javascript
import { DynamicForm, PREDEFINED_FIELDS } from '../shared/components/ui/form';

const TaskForm = () => {
  const fields = [...PREDEFINED_FIELDS.TASK_FIELDS];
  
  const options = {
    markets: marketOptions,
    product: productOptions,
    // ... other options
  };

  return (
    <DynamicForm
      fields={fields}
      options={options}
      onSubmit={handleSubmit}
    />
  );
};
```

## Adding New Fields

### Step 1: Add Field Configuration

```javascript
// In formValidation.js
export const PREDEFINED_FIELDS = {
  TASK_FIELDS: [
    // ... existing fields ...
    {
      name: 'priority',
      type: FIELD_TYPES.SELECT,
      label: 'Priority',
      required: true,
      validation: {
        custom: {
          test: (value) => ['low', 'medium', 'high'].includes(value),
          message: 'Please select a valid priority'
        }
      },
      helpText: 'Select the priority level for this task'
    }
  ]
};
```

### Step 2: Add Options (if needed)

```javascript
const options = {
  // ... existing options ...
  priority: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ]
};
```

### Step 3: Use in Your Form

```javascript
const TaskForm = () => {
  const fields = [...PREDEFINED_FIELDS.TASK_FIELDS];
  const options = { /* your options */ };
  
  return (
    <DynamicForm
      fields={fields}
      options={options}
      onSubmit={handleSubmit}
    />
  );
};
```

## Field Configuration Schema

```javascript
{
  name: string,              // Required: Field name
  type: FIELD_TYPES,         // Required: Field type
  label: string,             // Required: Display label
  required: boolean,         // Optional: Is field required
  validation: {              // Optional: Validation rules
    minLength?: number,
    maxLength?: number,
    minValue?: number,
    maxValue?: number,
    pattern?: RegExp,
    custom?: {
      test: (value) => boolean,
      message: string
    }
  },
  conditional?: {            // Optional: Conditional display
    field: string,
    value: any,
    required?: boolean
  },
  options?: array,           // Optional: Options for select fields
  placeholder?: string,      // Optional: Placeholder text
  helpText?: string,         // Optional: Help text
  defaultValue?: any,        // Optional: Default value
  props?: object            // Optional: Additional props
}
```

## Benefits

1. **Maintainability** - All form logic in one place
2. **Consistency** - Same validation and sanitization across forms
3. **Reusability** - Share field configurations between forms
4. **Type Safety** - Strong typing prevents configuration errors
5. **Easy Testing** - Test field configurations independently
6. **Future-Proof** - Easy to add new field types and validation rules

## Migration Guide

### From Manual Forms

1. **Extract field configurations** from your existing forms
2. **Define field types** using `FIELD_TYPES`
3. **Add validation rules** to field configurations
4. **Replace manual forms** with `DynamicForm`
5. **Test thoroughly** to ensure same behavior

### Example Migration

**Before:**
```javascript
<FormField label="Name" name="name" required>
  <TextInput name="name" />
</FormField>
```

**After:**
```javascript
const fields = [
  {
    name: 'name',
    type: FIELD_TYPES.TEXT,
    label: 'Name',
    required: true
  }
];

<DynamicForm fields={fields} onSubmit={handleSubmit} />
```

## Best Practices

1. **Use predefined fields** when possible
2. **Group related fields** in separate configurations
3. **Test field configurations** independently
4. **Document custom validation** logic
5. **Use meaningful field names** that match your data model
6. **Provide helpful error messages** in validation rules
