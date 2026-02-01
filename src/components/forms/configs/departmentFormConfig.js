/**
 * Department form config – one form per department (and per "form key").
 * Each form: title, submitLabel, optional category, and fields array.
 * Field: name, type, label, placeholder?, required?, options? (for select types), min/max/step (number), rows (textarea), etc.
 *
 * Field `type` must match a key in FORM_FIELD_TYPE_MAP (FormFields.jsx). Allowed: text, email, number, textarea, url, select, multiSelect, searchableSelect, checkbox, date.
 */

import { FORM_OPTIONS } from '@/components/forms/configs/formConstants';

// ============================================================================
// DESIGN – Task form (Add a task)
// ============================================================================

export const DESIGN_ADD_TASK_FORM = {
  title: 'Add a task',
  submitLabel: 'Create task',
  category: 'Design',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Task title',
      placeholder: 'Short title for the task',
      required: true,
    },
    {
      name: 'jiraLink',
      type: 'url',
      label: 'Jira link',
      placeholder: 'https://gmrd.atlassian.net/browse/PROJ-123',
      required: false,
    },
    {
      name: 'product',
      type: 'select',
      label: 'Product',
      placeholder: 'Select product',
      required: true,
      options: FORM_OPTIONS.PRODUCTS,
    },
    {
      name: 'market',
      type: 'select',
      label: 'Market',
      placeholder: 'Select market',
      required: false,
      options: FORM_OPTIONS.MARKETS,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Describe the task',
      required: false,
      rows: 4,
      maxLength: 500,
    },
    {
      name: 'estimatedTime',
      type: 'number',
      label: 'Estimated time',
      placeholder: '0',
      required: false,
      min: 0.1,
      max: 999,
      step: 0.5,
    },
    {
      name: 'timeUnit',
      type: 'select',
      label: 'Time unit',
      placeholder: 'Select unit',
      required: false,
      options: FORM_OPTIONS.TIME_UNITS,
    },
  ],
};

// ============================================================================
// FOOD – Order form (Send food)
// ============================================================================

const FOOD_DISH_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'drink', label: 'Drink' },
  { value: 'other', label: 'Other' },
];

export const FOOD_ADD_ORDER_FORM = {
  title: 'Send food order',
  submitLabel: 'Send order',
  category: 'Food',
  fields: [
    {
      name: 'dishName',
      type: 'text',
      label: 'Dish / item',
      placeholder: 'e.g. Sandwich, Coffee',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      placeholder: 'Select category',
      required: false,
      options: FOOD_DISH_OPTIONS,
    },
    {
      name: 'quantity',
      type: 'number',
      label: 'Quantity',
      placeholder: '1',
      required: true,
      min: 1,
      max: 99,
      step: 1,
    },
    {
      name: 'orderDate',
      type: 'date',
      label: 'Delivery date',
      placeholder: 'Select date',
      required: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
      placeholder: 'Allergies, preferences…',
      required: false,
      rows: 3,
    },
  ],
};

// ============================================================================
// CONFIG MAP – department key → form key → form config
// ============================================================================

export const DEPARTMENT_FORM_CONFIG = {
  design: {
    addTask: DESIGN_ADD_TASK_FORM,
  },
  food: {
    addOrder: FOOD_ADD_ORDER_FORM,
  },
};

/**
 * Get form config for a department and form key.
 * @param {string} departmentKey – e.g. 'design' | 'food'
 * @param {string} formKey – e.g. 'addTask' | 'addOrder'
 * @returns {object|undefined} – form config or undefined
 */
export function getDepartmentFormConfig(departmentKey, formKey) {
  return DEPARTMENT_FORM_CONFIG[departmentKey]?.[formKey];
}
