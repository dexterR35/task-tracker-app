# Constants Usage Report

## ✅ ACTIVELY USED CONSTANTS

### 1. **CARD_SYSTEM** ✅ **HEAVILY USED**
**Usage Count**: 20+ files

**Used In**:
- ✅ All Analytics Card components (AIAnalyticsCard, AcquisitionAnalyticsCard, MarketingAnalyticsCard, ProductAnalyticsCard, MiscAnalyticsCard, ReporterAnalyticsCard, MarketsByUsersCard)
- ✅ Table components (TanStackTable, AnalyticsTable, tableColumns)
- ✅ Chart components (SimplePieChart)
- ✅ UI components (Badge, DynamicButton, SmallCard)
- ✅ Pages (DynamicAnalyticsPage, LandingPages, HomePage, ProfilePage, TaskDetailPage, AnalyticsPage, ManagmentPage, HelpPage)
- ✅ Config files (analyticsSharedConfig, AIAnalyticsConfig, smallCardConfig)
- ✅ Utils (monthUtils)

**Properties Used**:
- `CARD_SYSTEM.COLOR_HEX_MAP.*` - Extensively used for colors
- `CARD_SYSTEM.CHART_DATA_TYPE.*` - Used for chart data types
- `CARD_SYSTEM.ANALYTICS_CARD_TYPES.*` - Used for card type identification

---

### 2. **FORM_OPTIONS** ✅ **HEAVILY USED**
**Usage Count**: 5+ files

**Used In**:
- ✅ `DepartmentFilter.jsx` - Uses `FORM_OPTIONS.DEPARTMENTS`
- ✅ `analyticsSharedConfig.jsx` - Uses `FORM_OPTIONS.PRODUCTS`, `FORM_OPTIONS.MARKETS`, `FORM_OPTIONS.AI_MODELS`, `FORM_OPTIONS.REPORTER_DEPARTMENTS`
- ✅ `useTaskForm.js` - Uses `FORM_OPTIONS.*`
- ✅ `useReporterForm.js` - Uses `FORM_OPTIONS.*`

**Properties Used**:
- `FORM_OPTIONS.PRODUCTS` - Product dropdown options
- `FORM_OPTIONS.MARKETS` - Market dropdown options
- `FORM_OPTIONS.DEPARTMENTS` - Department dropdown options
- `FORM_OPTIONS.AI_MODELS` - AI model dropdown options
- `FORM_OPTIONS.REPORTER_DEPARTMENTS` - Reporter department options
- `FORM_OPTIONS.REPORTER_CHANNELS` - Reporter channel options
- `FORM_OPTIONS.REPORTER_COUNTRIES` - Reporter country options

---

### 3. **TABLE_SYSTEM** ✅ **USED**
**Usage Count**: 4+ files

**Used In**:
- ✅ `TanStackTable.jsx` - Uses `PAGE_SIZE_OPTIONS`, `DEFAULT_PAGE_SIZE`, `SORT_ICONS`
- ✅ `TaskTable.jsx` - Uses `DEFAULT_PAGE_SIZE`
- ✅ `DeliverableTable.jsx` - Uses `DEFAULT_PAGE_SIZE`
- ✅ `AnalyticsTable.jsx` - Imports but may use internally
- ✅ `HelpPage.jsx` - Imports

**Properties Used**:
- `TABLE_SYSTEM.PAGE_SIZE_OPTIONS` - Pagination options
- `TABLE_SYSTEM.DEFAULT_PAGE_SIZE` - Default table page size
- `TABLE_SYSTEM.SORT_ICONS` - Sort direction icons

---

### 4. **VALIDATION** ✅ **USED**
**Usage Count**: 3+ files

**Used In**:
- ✅ `DeliverableForm.jsx` - Uses validation patterns/messages
- ✅ `useLoginForm.js` - Uses validation rules
- ✅ `useTaskForm.js` - Uses validation rules
- ✅ `useReporterForm.js` - Uses validation rules

**Properties Used**:
- `VALIDATION.PATTERNS.*` - Validation regex patterns
- `VALIDATION.MESSAGES.*` - Validation error messages
- `VALIDATION.LIMITS.*` - Validation limits

---

### 5. **AUTH** ✅ **USED**
**Usage Count**: 2+ files

**Used In**:
- ✅ `AuthContext.jsx` - Uses `AUTH.ROLES`, `AUTH.PERMISSIONS`, `AUTH.EMAIL_DOMAIN`
- ✅ `AppDataContext.jsx` - Uses `AUTH.*`

**Properties Used**:
- `AUTH.ROLES.*` - User roles
- `AUTH.PERMISSIONS.*` - Permission constants
- `AUTH.EMAIL_DOMAIN` - Email domain validation

---

### 6. **DATE_TIME** ✅ **USED**
**Usage Count**: 1+ files

**Used In**:
- ✅ `dateUtils.js` - Uses `DATE_TIME.FORMATS.*`, `DATE_TIME.LOCALE`, `DATE_TIME.TIMEZONE`, `DATE_TIME.WEEK_START`

**Properties Used**:
- `DATE_TIME.FORMATS.*` - Date format strings
- `DATE_TIME.LOCALE` - Locale setting
- `DATE_TIME.TIMEZONE` - Timezone setting
- `DATE_TIME.WEEK_START` - Week start day

---

### 7. **EXPORT_CONFIG** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `exportData.js` - Uses `EXPORT_CONFIG.CSV_DELIMITER`, `EXPORT_CONFIG.CSV_ENCODING`, `EXPORT_CONFIG.MAX_EXPORT_ROWS`

**Properties Used**:
- `EXPORT_CONFIG.CSV_DELIMITER` - CSV delimiter
- `EXPORT_CONFIG.CSV_ENCODING` - CSV encoding
- `EXPORT_CONFIG.MAX_EXPORT_ROWS` - Max rows for export

---

### 8. **ERROR_SYSTEM** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `errorHandling.js` - Uses `ERROR_SYSTEM.TYPES.*`, `ERROR_SYSTEM.SEVERITY.*`, `ERROR_SYSTEM.MESSAGES.*`

**Properties Used**:
- `ERROR_SYSTEM.TYPES.*` - Error type constants
- `ERROR_SYSTEM.SEVERITY.*` - Error severity levels
- `ERROR_SYSTEM.MESSAGES.*` - Error messages

---

### 9. **BUTTON_SYSTEM** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `DynamicButton.jsx` - Uses `BUTTON_SYSTEM.*` for button styling and configuration

**Properties Used**:
- `BUTTON_SYSTEM.VARIANTS.*` - Button variant styles
- `BUTTON_SYSTEM.SIZES.*` - Button size styles
- `BUTTON_SYSTEM.STATES.*` - Button state styles
- `BUTTON_SYSTEM.DEFAULTS.*` - Default button settings

---

### 10. **NAVIGATION_CONFIG** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `Sidebar.jsx` - Uses `NAVIGATION_CONFIG.ITEMS` for navigation menu

**Properties Used**:
- `NAVIGATION_CONFIG.ITEMS` - Navigation menu items
- `NAVIGATION_CONFIG.DEPARTMENT` - Department info

---

### 11. **APP_CONFIG** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `HomePage.jsx` - Uses `APP_CONFIG.NAME` for app name display

**Properties Used**:
- `APP_CONFIG.NAME` - App name

---

### 12. **UI_CONFIG** ✅ **USED**
**Usage Count**: 1 file

**Used In**:
- ✅ `CheckboxField.jsx` - Uses `UI_CONFIG.REQUIRED_INDICATOR` for required field indicator

**Properties Used**:
- `UI_CONFIG.REQUIRED_INDICATOR` - Required field indicator character

---

## ⚠️ POTENTIALLY UNUSED CONSTANTS

### 1. **ROUTES** ⚠️ **NOT USED - HARDCODED PATHS FOUND**
**Status**: Defined but router uses hardcoded paths

**Current State**: 
- `src/app/router.jsx` uses hardcoded paths like `"/"`, `"/login"`, `"/dashboard"`, etc.
- No imports of `ROUTES` constants found

**Recommendation**: 
- Replace hardcoded paths in `router.jsx` with `ROUTES.*` constants
- Example: `path: "login"` → `path: ROUTES.LOGIN.replace('/', '')`
- This will make route management centralized and easier to maintain

---

### 2. **API_CONFIG** ⚠️ **NOT USED - HARDCODED VALUES FOUND**
**Status**: Defined but API files don't use these constants

**Current State**:
- API files (`tasksApi.js`, `usersApi.js`, etc.) don't import `API_CONFIG`
- No timeout, retry, or limit configurations found using these constants

**Recommendation**:
- Use `API_CONFIG.TIMEOUT` for request timeouts
- Use `API_CONFIG.RETRY_ATTEMPTS` and `API_CONFIG.RETRY_DELAY` for retry logic
- Use `API_CONFIG.REQUEST_LIMITS.*` for query limits
- This will centralize API configuration

---

### 3. **NOTIFICATIONS** ⚠️ **NOT USED - HARDCODED VALUES FOUND**
**Status**: Defined but toast utility uses hardcoded values

**Current State**:
- `src/utils/toast.js` has hardcoded values:
  - `position: "top-right"` (should use `NOTIFICATIONS.POSITIONS.TOP_RIGHT`)
  - `autoClose: 3000` (should use `NOTIFICATIONS.DURATIONS.MEDIUM`)
  - Toast types like `'success'`, `'error'` (should use `NOTIFICATIONS.TYPES.*`)

**Recommendation**:
- Replace hardcoded toast config with `NOTIFICATIONS` constants
- Use `NOTIFICATIONS.TYPES.SUCCESS`, `NOTIFICATIONS.TYPES.ERROR`, etc.
- Use `NOTIFICATIONS.DURATIONS.SHORT/MEDIUM/LONG` for durations
- Use `NOTIFICATIONS.POSITIONS.*` for toast positions

---

### 4. **THEME** ⚠️ **NOT FOUND IN USAGE**
**Status**: Defined but no imports found

**Potential Usage**: Should be used in theme/color management
- Theme context/provider - Should use `THEME.MODES.*`, `THEME.COLORS.*`
- Dark mode toggle - Should use `THEME.MODES.LIGHT/DARK`

**Recommendation**: Check theme management files and use these constants

---

### 5. **DEV_CONFIG** ⚠️ **NOT FOUND IN USAGE**
**Status**: Defined but no imports found

**Potential Usage**: Should be used for development/debugging
- Logger utilities - Should use `DEV_CONFIG.ENABLE_LOGGING`
- DevTools - Should use `DEV_CONFIG.ENABLE_DEVTOOLS`
- Mock data - Should use `DEV_CONFIG.MOCK_API_DELAY`

**Recommendation**: Check logger and dev utilities, use these constants

---

### 6. **FIREBASE_CONFIG** ⚠️ **NOT FOUND IN USAGE**
**Status**: Defined but no imports found

**Potential Usage**: Should be used in Firebase initialization
- Firebase setup - Should use `FIREBASE_CONFIG.REQUIRED_FIELDS`, `FIREBASE_CONFIG.PERSISTENCE_RETRIES`

**Recommendation**: Check Firebase configuration files and use these constants

---

## 📊 SUMMARY STATISTICS

### Usage Breakdown:
- **✅ Actively Used**: 12 constant groups
- **⚠️ Potentially Unused**: 6 constant groups
- **Total Constant Groups**: 18

### Most Used Constants:
1. **CARD_SYSTEM** - 20+ files
2. **FORM_OPTIONS** - 5+ files
3. **TABLE_SYSTEM** - 4+ files
4. **VALIDATION** - 3+ files

### Least Used Constants:
1. **APP_CONFIG** - 1 file (only `NAME` property)
2. **UI_CONFIG** - 1 file (only `REQUIRED_INDICATOR` property)
3. **EXPORT_CONFIG** - 1 file
4. **ERROR_SYSTEM** - 1 file
5. **BUTTON_SYSTEM** - 1 file
6. **NAVIGATION_CONFIG** - 1 file
7. **DATE_TIME** - 1 file

---

## 🎯 RECOMMENDATIONS

### High Priority:
1. **Use ROUTES constants** in router configuration to avoid hardcoded paths
2. **Use API_CONFIG** in API service files for consistent configuration
3. **Use NOTIFICATIONS** in toast/notification utilities for consistency

### Medium Priority:
4. **Use THEME constants** in theme management for better maintainability
5. **Use DEV_CONFIG** in logger and dev utilities
6. **Use FIREBASE_CONFIG** in Firebase setup files

### Low Priority:
7. Consider expanding usage of **APP_CONFIG** (currently only `NAME` is used)
8. Consider expanding usage of **UI_CONFIG** (currently only `REQUIRED_INDICATOR` is used)

---

## ✅ CONCLUSION

**Your constants ARE being used**, but some could be used more extensively:

- **12 out of 18** constant groups are actively used
- **6 constant groups** are defined but not found in current usage
- Most critical constants (CARD_SYSTEM, FORM_OPTIONS, TABLE_SYSTEM) are heavily used
- Some constants may be used in files not covered by this search (e.g., router config, API services)

**Overall**: Your constants system is well-structured and actively used throughout the application! 🎉

