# Constants Documentation

This directory contains all application-wide constants for the Task Tracker application. All constants are centralized here to ensure consistency and maintainability across the entire codebase.

## 📁 File Structure

```
src/constants/
├── index.js           # Main constants file with all application constants
└── README.md         # This documentation file
```

## 🎯 Purpose

The centralized constants file serves several important purposes:

1. **Consistency**: Ensures all parts of the application use the same values
2. **Maintainability**: Single source of truth for all configuration values
3. **Type Safety**: Reduces typos and errors from hardcoded strings
4. **Documentation**: Self-documenting code with clear constant names
5. **Refactoring**: Easy to update values across the entire application

## 📋 Available Constants

### Application Configuration (`APP_CONFIG`)
- Application name, version, and metadata
- Company information and support details
- Default locale and timezone settings

### Authentication & Authorization (`AUTH`)
- Valid user roles and permissions
- Email domain validation
- Permission constants for access control

### Validation (`VALIDATION`)
- Regex patterns for form validation
- Error messages for user feedback
- Input limits and constraints

### Form Options (`FORM_OPTIONS`)
- Dropdown options for all forms
- Product, market, and department lists
- AI model and time unit options

### Card System (`CARD_SYSTEM`)
- Color definitions and hex mappings
- Small card and analytics card types
- Consistent styling across all cards

### Button System (`BUTTON_SYSTEM`)
- Button variants, sizes, and states
- CSS classes for consistent styling
- Default values and mappings

### Table System (`TABLE_SYSTEM`)
- Page size options and sort icons
- Column types and date formats
- Default table configurations

### Error Handling (`ERROR_SYSTEM`)
- Error types and severity levels
- Standard error messages
- Consistent error handling patterns

### Cache Configuration (`CACHE_CONFIG`)
- Cache durations and TTL settings
- Data volatility categories
- Performance optimization settings

### Routing (`ROUTES`)
- All application route paths
- Public and protected route definitions
- Consistent URL structure

### API Configuration (`API_CONFIG`)
- Request timeouts and retry settings
- Batch sizes and concurrency limits
- Performance tuning parameters

### UI/UX Configuration (`UI_CONFIG`)
- Animation durations and transitions
- Breakpoints and responsive settings
- Component dimensions and spacing

### Date & Time (`DATE_TIME`)
- Date format patterns
- Locale and timezone settings
- Working hours and calendar constants

### Export Configuration (`EXPORT_CONFIG`)
- CSV and PDF export settings
- File encoding and formatting options
- Export limits and constraints

### Notifications (`NOTIFICATIONS`)
- Toast notification types and durations
- Position and styling options
- User feedback configurations

### Theme (`THEME`)
- Light and dark mode settings
- Color schemes and transitions
- Consistent theming across the app

### Development (`DEV_CONFIG`)
- Development-only settings
- Debug mode and logging options
- Mock API configurations

## 🚀 Usage

### Importing Constants

```javascript
// Import specific constants
import { VALIDATION, FORM_OPTIONS, CARD_SYSTEM } from '@/constants';

// Import all constants
import constants from '@/constants';

// Import with destructuring
import { 
  VALIDATION, 
  FORM_OPTIONS, 
  CARD_SYSTEM,
  BUTTON_SYSTEM 
} from '@/constants';
```

### Using Constants in Forms

```javascript
import { VALIDATION, FORM_OPTIONS } from '@/constants';

// Form validation
const schema = Yup.object().shape({
  email: Yup.string()
    .required(VALIDATION.MESSAGES.REQUIRED)
    .matches(VALIDATION.PATTERNS.NETBET_EMAIL, VALIDATION.MESSAGES.NETBET_EMAIL),
  
  name: Yup.string()
    .min(VALIDATION.LIMITS.NAME_MIN, VALIDATION.MESSAGES.MIN_LENGTH(VALIDATION.LIMITS.NAME_MIN))
    .max(VALIDATION.LIMITS.NAME_MAX, VALIDATION.MESSAGES.MAX_LENGTH(VALIDATION.LIMITS.NAME_MAX))
});

// Form options
const productOptions = FORM_OPTIONS.PRODUCTS;
const marketOptions = FORM_OPTIONS.MARKETS;
```

### Using Constants in Components

```javascript
import { CARD_SYSTEM, BUTTON_SYSTEM } from '@/constants';

// Card colors
const cardColor = CARD_SYSTEM.COLORS.ADMIN;
const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor];

// Button styling
const buttonVariant = BUTTON_SYSTEM.VARIANTS.PRIMARY;
const buttonSize = BUTTON_SYSTEM.SIZES.MD;
```

### Using Constants in API Calls

```javascript
import { API_CONFIG, CACHE_CONFIG } from '@/constants';

// API configuration
const timeout = API_CONFIG.TIMEOUT;
const retryAttempts = API_CONFIG.RETRY_ATTEMPTS;

// Cache settings
const cacheDuration = CACHE_CONFIG.DURATIONS.MEDIUM;
const dataVolatility = CACHE_CONFIG.DATA_VOLATILITY.HIGH;
```

## 🔧 Adding New Constants

When adding new constants, follow these guidelines:

1. **Choose the right category**: Add constants to the most appropriate existing category
2. **Use descriptive names**: Make constant names self-explanatory
3. **Follow naming conventions**: Use UPPER_SNAKE_CASE for constant names
4. **Add documentation**: Include comments explaining the purpose
5. **Update this README**: Document new constants in the appropriate section

### Example: Adding New Constants

```javascript
// In src/constants/index.js

export const NEW_CATEGORY = {
  CONSTANT_NAME: 'value',
  ANOTHER_CONSTANT: 42,
  ARRAY_CONSTANT: ['item1', 'item2'],
  OBJECT_CONSTANT: {
    key: 'value',
    nested: {
      property: true
    }
  }
};
```

## 🧪 Testing Constants

To verify all constants are working properly, you can:

1. **Import and use constants** in your components
2. **Check for linting errors** when importing constants
3. **Run your application** to ensure all constants are accessible
4. **Use TypeScript** (if available) for compile-time type checking

The constants are designed to be:
- ✅ Accessible from anywhere in the application
- ✅ Type-safe and consistent
- ✅ Well-documented and self-explanatory
- ✅ Easy to maintain and update

## 📝 Best Practices

1. **Never hardcode values**: Always use constants instead of magic strings/numbers
2. **Import only what you need**: Use destructuring to import specific constants
3. **Keep constants immutable**: Don't modify constants at runtime
4. **Use meaningful names**: Make constant names descriptive and self-documenting
5. **Group related constants**: Keep related constants together in the same category
6. **Document complex constants**: Add comments for complex or non-obvious values

## 🔄 Migration Guide

If you're updating existing code to use centralized constants:

1. **Identify hardcoded values**: Look for strings, numbers, and objects that should be constants
2. **Find the appropriate category**: Determine which constant category the value belongs to
3. **Replace hardcoded values**: Update the code to use the constant instead
4. **Test thoroughly**: Ensure the functionality still works after the change
5. **Update imports**: Add the necessary import statement for the constants

### Before (Hardcoded)
```javascript
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@netbet\.ro$/;
const errorMessage = "This field is required";
```

### After (Using Constants)
```javascript
import { VALIDATION } from '@/constants';

const emailPattern = VALIDATION.PATTERNS.NETBET_EMAIL;
const errorMessage = VALIDATION.MESSAGES.REQUIRED;
```

## 🚨 Important Notes

- **Don't modify constants at runtime**: Constants should be immutable
- **Keep constants simple**: Avoid complex logic or functions in constants
- **Use TypeScript**: Consider adding TypeScript for better type safety
- **Version control**: Track changes to constants carefully as they affect the entire app
- **Documentation**: Keep this README updated when adding new constants

## 📞 Support

If you have questions about constants or need to add new ones:

1. Check this documentation first
2. Look at existing examples in the codebase
3. Follow the established patterns and naming conventions
4. Test your changes thoroughly
5. Update this documentation if needed

---

**Remember**: Constants are the foundation of a maintainable application. Keep them organized, well-documented, and consistent!
