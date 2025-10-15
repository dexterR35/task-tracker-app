# Task Tracker App - Source Code Documentation

This document provides a comprehensive overview of all files in the `src` directory of the Task Tracker application.

## 📁 Directory Structure Overview

```
src/
├── app/                    # Application core configuration
├── assets/                 # Static assets (images, etc.)
├── components/             # Reusable UI components
├── context/               # React context providers
├── features/              # Feature-based modules
├── hooks/                 # Custom React hooks
├── pages/                 # Page components
└── utils/                 # Utility functions
```

---

## 🏗️ Core Application Files

### `App.jsx`
**Purpose**: Main application component that sets up the React app structure
**Key Features**:
- Wraps the app with Redux Provider for state management
- Sets up React Router for navigation
- Configures Toast notifications
- Provides authentication and dark mode context
- Includes error boundary for crash handling

### `main.jsx`
**Purpose**: Application entry point
**Key Features**:
- Renders the main App component
- Sets up React 18 with createRoot
- Configures global error handling

### `index.css`
**Purpose**: Global styles and CSS utilities
**Key Features**:
- Tailwind CSS configuration
- Custom component styles (cards, forms, tables)
- Dark mode support
- Responsive design utilities
- Custom color schemes and typography

---

## ⚙️ Application Configuration (`app/`)

### `firebase.js`
**Purpose**: Firebase configuration and initialization
**Key Features**:
- Firebase app initialization with environment variables
- Authentication setup with persistence
- Firestore database configuration
- Error handling and retry logic
- Development logging configuration

### `router.jsx`
**Purpose**: React Router configuration and route protection
**Key Features**:
- Public and protected route definitions
- Authentication-based redirects
- Admin role-based access control
- Page transitions with Framer Motion
- Error page handling (404, unauthorized)

### `store.js`
**Purpose**: Redux store configuration
**Key Features**:
- RTK Query API integration
- Optimized middleware configuration
- Cache management for better performance
- Development tools configuration

---

## 🎨 UI Components (`components/`)

### Analytics Components (`components/analytics/`)

*Note: Analytics components have been consolidated into the main Cards system for better maintainability.*

### Card Components (`components/Card/` & `components/Cards/`)

#### `SmallCard.jsx`
**Purpose**: Small dashboard card component
**Key Features**:
- Dynamic content rendering
- Color-coded status indicators
- Badge support
- Responsive layout

#### `smallCardConfig.jsx`
**Purpose**: Configuration for small cards
**Key Features**:
- Predefined card types (month selection, user filter, etc.)
- Dynamic data binding
- Conditional rendering logic
- Card creation utilities

#### `AnalyticsCard.jsx`
**Purpose**: Analytics-specific card component
**Key Features**:
- Table and chart integration
- Multiple chart types support
- Loading skeleton states
- Responsive grid layout

#### `LargeAnalyticsCard.jsx`
**Purpose**: Large analytics dashboard card
**Key Features**:
- Multiple data sections
- Market badge display
- Top 3 calculations
- Color-coded metrics

#### `analyticsCardConfig.js`
**Purpose**: Configuration and utility functions for analytics cards
**Key Features**:
- Card type configurations and definitions
- Analytics calculation functions
- Market user breakdown calculations
- User by task data calculations
- Unified analytics data processing
- Direct props generation for AnalyticsCard
- Icon and color mappings
- Chart type configurations
- Category-based organization

### Chart Components (`components/Charts/`)

#### `SimpleColumnChart.jsx`
**Purpose**: Column/bar chart component using Recharts
**Key Features**:
- Multi-bar support for market data
- Responsive design
- Custom tooltips and legends
- Dark mode support

#### `SimplePieChart.jsx`
**Purpose**: Pie chart component using Recharts
**Key Features**:
- Custom label rendering
- Leader lines for better readability
- Percentage display
- Responsive design

### Form Components (`components/forms/`)

#### `LoginForm.jsx`
**Purpose**: User authentication form
**Key Features**:
- Email/password validation
- Error handling
- Success callbacks
- Responsive design

#### Form Field Components (`components/forms/components/`)

##### `CheckboxField.jsx`
**Purpose**: Checkbox input field component
**Key Features**:
- Form validation integration
- Custom styling
- Error state handling

##### `DeliverablesField.jsx`
**Purpose**: Complex deliverables selection field
**Key Features**:
- Multi-deliverable selection
- Quantity and variations support
- Time estimation display
- Dynamic validation

##### `MultiSelectField.jsx`
**Purpose**: Multi-select dropdown component
**Key Features**:
- Tag-based selection display
- Add/remove functionality
- Validation support
- Custom styling

##### `NumberField.jsx`
**Purpose**: Number input field component
**Key Features**:
- Numeric validation
- Min/max constraints
- Custom formatting

##### `PasswordField.jsx`
**Purpose**: Password input field component
**Key Features**:
- Secure input handling
- Validation integration
- Error display

##### `SearchableDeliverablesField.jsx`
**Purpose**: Searchable deliverables selection
**Key Features**:
- Search functionality
- Time estimation display
- Dynamic options loading
- Validation support

##### `SearchableSelectField.jsx`
**Purpose**: Searchable dropdown component
**Key Features**:
- Real-time search
- Keyboard navigation
- Custom option rendering
- Loading states

##### `SelectField.jsx`
**Purpose**: Standard dropdown component
**Key Features**:
- Option-based selection
- Clear functionality
- Validation support

##### `SimpleDateField.jsx`
**Purpose**: Date picker component
**Key Features**:
- Calendar navigation
- Month/year selection
- Date validation
- Custom formatting

##### `TextField.jsx`
**Purpose**: Text input field component
**Key Features**:
- Text validation
- Clear functionality
- Error state handling

##### `TextareaField.jsx`
**Purpose**: Multi-line text input component
**Key Features**:
- Resizable textarea
- Validation support
- Character counting

##### `UrlField.jsx`
**Purpose**: URL input field component
**Key Features**:
- URL validation
- Jira link detection
- Success notifications

#### Form Configuration (`components/forms/configs/`)

##### `useLoginForm.js`
**Purpose**: Login form configuration and validation
**Key Features**:
- Form schema definition
- Validation rules
- Error handling

### Icon System (`components/icons/`)

#### `index.jsx`
**Purpose**: Centralized icon system
**Key Features**:
- Icon categorization (generic, admin, buttons)
- Size variants
- Color customization
- Consistent icon usage

### Layout Components (`components/layout/`)

#### `AuthLayout.jsx`
**Purpose**: Main authenticated layout wrapper
**Key Features**:
- Sidebar navigation
- Header with user info
- Responsive design
- Dark mode support

#### `ErrorBoundary.jsx`
**Purpose**: React error boundary for crash handling
**Key Features**:
- Error catching and display
- Retry functionality
- Error reporting
- Fallback UI

#### Navigation Components (`components/layout/navigation/`)

##### `FixedHeader.jsx`
**Purpose**: Fixed header component
**Key Features**:
- Page title display
- User avatar and actions
- Sidebar toggle
- Responsive design

##### `Sidebar.jsx`
**Purpose**: Navigation sidebar
**Key Features**:
- Role-based menu items
- Active state indication
- Logout functionality
- Responsive collapse

### Table Components (`components/Table/`)

#### `TanStackTable.jsx`
**Purpose**: Advanced table component using TanStack Table
**Key Features**:
- Sorting, filtering, pagination
- Row selection
- Bulk actions
- Export functionality
- Responsive design

#### `tableColumns.jsx`
**Purpose**: Table column definitions
**Key Features**:
- Dynamic column creation
- Cell formatting
- Conditional rendering
- Type-specific columns

#### `AnalyticsTable.jsx`
**Purpose**: Analytics-specific table component
**Key Features**:
- Analytics data display
- Custom formatting
- Export support
- Loading states

#### `MarketDistributionTable.jsx`
**Purpose**: Market distribution data table
**Key Features**:
- Market-specific formatting
- User and task metrics
- Hour calculations
- Responsive columns

### UI Components (`components/ui/`)

#### Avatar (`components/ui/Avatar/`)
##### `Avatar.jsx`
**Purpose**: User avatar component
**Key Features**:
- User image or initials fallback
- Size variants
- Gradient backgrounds
- Email/name display options

#### Badge (`components/ui/Badge/`)
##### `Badge.jsx`
**Purpose**: Status badge component
**Key Features**:
- Multiple variants and colors
- Size options
- Custom styling
- Status indication

#### Button (`components/ui/Button/`)
##### `DynamicButton.jsx`
**Purpose**: Advanced button component
**Key Features**:
- Multiple variants and sizes
- Icon support
- Loading states
- Link functionality
- Success/error feedback

##### `buttonConstants.js`
**Purpose**: Button configuration constants
**Key Features**:
- Default values
- Variant definitions
- Size mappings

#### Calculation Components

##### `CalculationExamples.jsx`
**Purpose**: Deliverable calculation examples
**Key Features**:
- Interactive examples
- Time calculations
- Visual demonstrations
- Color-coded results

##### `CalculationFormula.jsx`
**Purpose**: Formula display component
**Key Features**:
- Mathematical formula rendering
- Step-by-step breakdown
- Visual formatting

#### `ComingSoon.jsx`
**Purpose**: Coming soon page component
**Key Features**:
- Placeholder content
- Navigation options
- Custom actions
- Responsive design

#### Dark Mode (`components/ui/DarkMode/`)
##### `DarkModeButtons.jsx`
**Purpose**: Dark mode toggle component
**Key Features**:
- Theme switching
- Transition animations
- Persistent settings
- Visual feedback

#### `Loader.jsx`
**Purpose**: Loading indicator component
**Key Features**:
- Multiple variants (spinner, dots)
- Size options
- Full-screen support
- Custom text

#### `MidnightCountdown.jsx`
**Purpose**: Midnight countdown component
**Key Features**:
- Real-time countdown
- Automatic updates
- Visual display
- Time calculations

#### Modal Components (`components/ui/Modal/`)

##### `Modal.jsx`
**Purpose**: Generic modal component
**Key Features**:
- Overlay and backdrop
- Customizable size
- Close functionality
- Focus management

##### `ConfirmationModal.jsx`
**Purpose**: Confirmation dialog component
**Key Features**:
- Action confirmation
- Multiple variants (danger, warning, info)
- Loading states
- Customizable text

#### `MonthSelector.jsx`
**Purpose**: Month selection component
**Key Features**:
- Month dropdown
- User-specific months
- Change callbacks
- Placeholder support

#### `Skeleton.jsx`
**Purpose**: Loading skeleton components
**Key Features**:
- Multiple skeleton types
- Animated loading states
- Component-specific skeletons
- Responsive design

### Deliverable Calculation (`components/DeliverableCalculation/`)

#### `FormattedDeliverableCalculation.jsx`
**Purpose**: Formatted deliverable time calculation display
**Key Features**:
- Time calculations
- Detailed breakdowns
- Visual formatting
- Configuration validation

---

## 🔐 Context Providers (`context/`)

### `AuthProvider.jsx`
**Purpose**: Authentication context provider
**Key Features**:
- User authentication state
- Login/logout functionality
- Permission checking
- Error handling

### `DarkModeProvider.jsx`
**Purpose**: Dark mode context provider
**Key Features**:
- Theme state management
- Toggle functionality
- Persistent storage
- Transition animations

---

## 🚀 Feature Modules (`features/`)

### Authentication (`features/auth/`)

#### `authSlice.js`
**Purpose**: Redux slice for authentication state
**Key Features**:
- User state management
- Authentication actions
- Permission utilities
- Error handling

#### `hooks/useAuth.js`
**Purpose**: Authentication hook
**Key Features**:
- User state access
- Authentication methods
- Permission checking
- Error handling

### Deliverables (`features/deliverables/`)

#### Components

##### `DeliverableForm.jsx`
**Purpose**: Deliverable creation/editing form
**Key Features**:
- Form validation
- Time configuration
- variations support
- Success callbacks

##### `DeliverableFormModal.jsx`
**Purpose**: Modal wrapper for deliverable form
**Key Features**:
- Modal integration
- Success handling
- Error management

##### `DeliverableTable.jsx`
**Purpose**: Deliverables management table
**Key Features**:
- CRUD operations
- Time calculations
- Bulk actions
- Export functionality

#### Configuration

##### `useDeliverableForm.js`
**Purpose**: Deliverable form configuration
**Key Features**:
- Form schema
- Validation rules
- Data preparation
- Error handling

### Reporters (`features/reporters/`)

#### Components

##### `ReporterForm.jsx`
**Purpose**: Reporter creation/editing form
**Key Features**:
- Form validation
- Email checking
- Success callbacks
- Error handling

##### `ReporterFormModal.jsx`
**Purpose**: Modal wrapper for reporter form
**Key Features**:
- Modal integration
- Success handling
- Error management

##### `ReporterTable.jsx`
**Purpose**: Reporters management table
**Key Features**:
- CRUD operations
- Email validation
- Bulk actions
- Export functionality

#### Configuration

##### `useReporterForm.js`
**Purpose**: Reporter form configuration
**Key Features**:
- Form schema
- Validation rules
- Data preparation
- Error handling

##### `reportersApi.js`
**Purpose**: Reporters API endpoints
**Key Features**:
- CRUD operations
- Email validation
- Cache management
- Error handling

### Settings (`features/settings/`)

#### `settingsApi.js`
**Purpose**: Settings API endpoints
**Key Features**:
- Settings management
- Deliverables configuration
- Permission validation
- Cache management

### Tasks (`features/tasks/`)

#### Components

##### `TaskForm.jsx`
**Purpose**: Task creation/editing form
**Key Features**:
- Complex form validation
- Conditional fields
- Deliverable integration
- Success callbacks

##### `TaskFormModal.jsx`
**Purpose**: Modal wrapper for task form
**Key Features**:
- Modal integration
- Success handling
- Error management

##### `TaskTable.jsx`
**Purpose**: Tasks management table
**Key Features**:
- CRUD operations
- Filtering and sorting
- Bulk actions
- Export functionality

#### Configuration

##### `useTaskForm.js`
**Purpose**: Task form configuration
**Key Features**:
- Complex form schema
- Conditional validation
- Field configurations
- Data preparation

##### `tasksApi.js`
**Purpose**: Tasks API endpoints
**Key Features**:
- CRUD operations
- Real-time updates
- Cache management
- Permission validation

### Users (`features/users/`)

#### Components

##### `UserTable.jsx`
**Purpose**: Users management table
**Key Features**:
- User display
- Role information
- Activity status
- Export functionality

##### `usersApi.js`
**Purpose**: Users API endpoints
**Key Features**:
- User data fetching
- Cache management
- Error handling
- Permission validation

### Utilities (`features/utils/`)

#### `authUtils.js`
**Purpose**: Authentication utility functions
**Key Features**:
- Permission checking
- User validation
- Role management
- Access control

#### `cacheConfig.js`
**Purpose**: Cache configuration utilities
**Key Features**:
- Cache strategies
- TTL configuration
- Invalidation rules
- Performance optimization

#### `errorHandling.js`
**Purpose**: Error handling utilities
**Key Features**:
- Error parsing
- User-friendly messages
- Error boundaries
- Logging integration

#### `firebaseListenerManager.js`
**Purpose**: Firebase listener management
**Key Features**:
- Listener lifecycle management
- Memory optimization
- Cleanup automation
- Performance monitoring

#### `requestDeduplication.js`
**Purpose**: Request deduplication utilities
**Key Features**:
- Duplicate request prevention
- Performance optimization
- Memory management
- Error handling

---

## 🎣 Custom Hooks (`hooks/`)

### `useAppData.js`
**Purpose**: Main application data hook
**Key Features**:
- User data management
- Month selection
- Filter management
- Data aggregation

### `useDeliverableCalculation.js`
**Purpose**: Deliverable time calculation hook
**Key Features**:
- Time calculations
- variations support
- Formatting utilities
- Validation

### `useDeliverablesByDepartment.js`
**Purpose**: Department-specific deliverables hook
**Key Features**:
- Department filtering
- Dynamic loading
- Cache management

### `useDeliverablesOptions.js`
**Purpose**: Deliverables options hook
**Key Features**:
- Options loading
- Cache management
- Error handling

### `useTableActions.js`
**Purpose**: Table actions management hook
**Key Features**:
- CRUD operations
- Modal management
- Success/error handling
- State management

### `useTop3Calculations.js`
**Purpose**: Top 3 calculations hook
**Key Features**:
- Data aggregation
- Ranking calculations
- Performance optimization
- Caching

---

## 📄 Page Components (`pages/`)

### Admin Pages (`pages/admin/`)

#### `AdminDashboardPage.jsx`
**Purpose**: Main admin dashboard
**Key Features**:
- Dashboard overview
- Small cards display
- Task creation
- User management

#### `AnalyticsPage.jsx`
**Purpose**: Analytics dashboard
**Key Features**:
- Multiple analytics cards
- Data visualization
- Export functionality
- Filter management

#### `ManagmentPage.jsx`
**Purpose**: User and reporter management
**Key Features**:
- User management
- Reporter management
- Role assignments
- Bulk operations

### Authentication Pages (`pages/auth/`)

#### `LoginPage.jsx`
**Purpose**: User login page
**Key Features**:
- Login form
- Error handling
- Success redirects
- Responsive design

### Error Pages (`pages/errorPages/`)

#### `NotFoundPage.jsx`
**Purpose**: 404 error page
**Key Features**:
- Error display
- Navigation options
- User-friendly design

#### `UnauthorizedPage.jsx`
**Purpose**: 403 unauthorized page
**Key Features**:
- Permission error display
- Navigation options
- Role information

### Main Pages

#### `HomePage.jsx`
**Purpose**: Landing/home page
**Key Features**:
- Welcome content
- Feature overview
- Navigation options
- Responsive design

#### `LandingPages.jsx`
**Purpose**: Landing pages management
**Key Features**:
- Page management
- Content display
- Navigation

#### `TaskDetailPage.jsx`
**Purpose**: Individual task detail view
**Key Features**:
- Task information display
- Analytics integration
- Edit functionality
- Navigation

#### `UserDataPage.jsx`
**Purpose**: User data visualization
**Key Features**:
- Personal analytics
- Task history
- Performance metrics
- Export options

---

## 🛠️ Utility Functions (`utils/`)

### `analyticsHelpers.js`
**Purpose**: Analytics calculation utilities
**Key Features**:
- Market badge calculations
- Data aggregation
- Chart data generation
- Export formatting

### `apiUtils.js`
**Purpose**: API utility functions
**Key Features**:
- Firestore operations
- Error handling
- Permission validation
- Cache management

### `cardUtils.js`
**Purpose**: Card utility functions
**Key Features**:
- Color management
- Badge utilities
- Card creation
- Styling helpers

- Responsive helpers

### `dateUtils.js`
**Purpose**: Date utility functions
**Key Features**:
- Date formatting
- Timestamp handling
- Month calculations
- Localization

### `exportData.js`
**Purpose**: Data export utilities
**Key Features**:
- CSV export
- Data formatting
- File generation
- Download handling

### `formUtils.js`
**Purpose**: Form utility functions
**Key Features**:
- Form handling
- Validation utilities
- Data transformation
- Error management

### `logger.js`
**Purpose**: Logging utility
**Key Features**:
- Console logging
- Error logging
- Development tools
- Performance monitoring

### `midnightScheduler.js`
**Purpose**: Midnight scheduling utilities
**Key Features**:
- Date change detection
- Callback scheduling
- Time calculations
- Event management

### `monthUtils.jsx`
**Purpose**: Month utility functions
**Key Features**:
- Month calculations
- Progress tracking
- Date range handling
- Board generation

### `pdfGenerator.js`
**Purpose**: PDF generation utilities
**Key Features**:
- Screenshot capture
- PDF creation
- Analytics export
- File download

### `toast.js`
**Purpose**: Toast notification utilities
**Key Features**:
- Success notifications
- Error messages
- Loading states
- Custom styling

---

## 📊 Assets (`assets/`)

### `netbet-logo.png`
**Purpose**: NetBet company logo
**Key Features**:
- PNG format
- High resolution
- Brand identity
- UI integration

---

## 🔧 Key Features Summary

### Core Functionality
- **Task Management**: Complete CRUD operations for tasks
- **User Management**: Role-based access control
- **Analytics**: Comprehensive data visualization
- **Real-time Updates**: Firebase integration
- **Responsive Design**: Mobile-friendly interface

### Technical Highlights
- **React 18**: Modern React features
- **Redux Toolkit**: State management
- **RTK Query**: API management
- **Firebase**: Backend services
- **Tailwind CSS**: Styling framework
- **Recharts**: Data visualization
- **Framer Motion**: Animations

### Performance Optimizations
- **Code Splitting**: Lazy loading
- **Caching**: RTK Query cache
- **Memoization**: React optimization
- **Bundle Optimization**: Vite build system

This documentation provides a comprehensive overview of the Task Tracker application's source code structure and functionality.
