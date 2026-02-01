/**
 * Form constants – department form config names, dropdown options.
 * Import from: @/components/forms/configs/formConstants
 */

// ============================================================================
// DEPARTMENT FORM CONFIG NAMES (used by DynamicDepartmentForm)
// ============================================================================

/** Department keys – must match keys in DynamicDepartmentForm's DEPARTMENT_FORM_CONFIG. */
export const DEPARTMENT_FORM_DEPARTMENT = {
  DESIGN: 'design',
  FOOD: 'food',
};

// ============================================================================
// FORM OPTIONS & DROPDOWN DATA
// ============================================================================

export const FORM_OPTIONS = {
  PRODUCTS: [
    { value: 'crm casino', label: 'crm casino' },
    { value: 'crm sport', label: 'crm sport' },
    { value: 'crm poker', label: 'crm poker' },
    { value: 'crm lotto', label: 'crm lotto' },
    { value: 'acquisition casino', label: 'acquisition casino' },
    { value: 'acquisition sport', label: 'acquisition sport' },
    { value: 'acquisition poker', label: 'acquisition poker' },
    { value: 'acquisition lotto', label: 'acquisition lotto' },
    { value: 'product casino', label: 'product casino' },
    { value: 'product sport', label: 'product sport' },
    { value: 'product poker', label: 'product poker' },
    { value: 'product lotto', label: 'product lotto' },
    { value: 'misc', label: 'misc' },
  ],
  MARKETS: [
    { value: 'ro', label: 'ro' },
    { value: 'com', label: 'com' },
    { value: 'uk', label: 'uk' },
    { value: 'ie', label: 'ie' },
    { value: 'fi', label: 'fi' },
    { value: 'dk', label: 'dk' },
    { value: 'de', label: 'de' },
    { value: 'it', label: 'italy' },
    { value: 'gr', label: 'grece' },
    { value: 'fr', label: 'france' },
    { value: 'ca', label: 'canada' },
  ],
  AI_MODELS: [
    { value: 'Photoshop', label: 'Photoshop' },
    { value: 'ChatGpt', label: 'ChatGpt' },
    { value: 'ShutterStock', label: 'ShutterStock' },
    { value: 'FreePick', label: 'FreePick' },
    { value: 'Cursor', label: 'Cursor' },
    { value: 'run diffusion', label: 'run diffusion' },
  ],
  TIME_UNITS: [
    { value: 'min', label: 'Minutes' },
    { value: 'hr', label: 'Hours' },
  ],
  /** Food order form – dish category options. */
  FOOD_DISH_CATEGORIES: [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'snack', label: 'Snack' },
    { value: 'drink', label: 'Drink' },
    { value: 'other', label: 'Other' },
  ],
};
