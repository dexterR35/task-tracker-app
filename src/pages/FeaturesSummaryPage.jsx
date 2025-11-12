import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";

const FeaturesSummaryPage = () => {
  const { canAccess } = useAuth();
  const isAdmin = canAccess("admin");

  const features = [
    {
      title: "Analytics System",
      icon: "chart",
      description: "Analytics system that processes task data across multiple dimensions to generate insights and reports.",
      details: [
        "Marketing Analytics: Tracks marketing subcategories, market distribution, and time allocation across marketing activities",
        "Acquisition Analytics: Monitors acquisition efforts, showing which markets receive focus and how resources are distributed",
        "Product Analytics: Analyzes product development activities, priorities, and time investment across product categories",
        "AI Analytics: Tracks artificial intelligence usage, identifying which AI models are used most frequently, time spent using AI tools, and effectiveness metrics",
        "Reporter Analytics: Examines individual reporter performance, showing task counts, hours invested, market coverage, and contribution patterns",
        "Markets by Users: Visualizes task distribution across users and markets, revealing workload balance and market focus",
        "Real-time calculations that update automatically as new tasks are recorded",
        "Dynamic filtering capabilities to focus on specific time periods, individuals, or product categories",
        "Visual chart representations including pie charts, bar charts, and biaxial charts for easy data comprehension"
      ]
    },
    {
      title: "User & Reporter Management",
      icon: "users",
      description: "Unified management system for users and reporters with the same operations, filtering, and analytics capabilities.",
      details: [
        "Full operations for both users and reporters: create, read, update, and delete",
        "User management: Role-based access control with admin and user roles",
        "User management: Explicit permission system allowing granular control over user capabilities",
        "User management: User status management (active/inactive) to control system access",
        "User management: User profile management with detailed information tracking",
        "User management: Permission validation ensures users can only perform actions they're authorized for",
        "User management: User filtering in analytics and dashboards to view individual or team performance",
        "Reporter management: Reporter information storage and retrieval for tracking work sources",
        "Reporter management: Reporter filtering in analytics to analyze work by source",
        "Reporter management: Reporter performance tracking showing tasks, hours, and market coverage",
        "Reporter management: Integration with task forms for reporter assignment",
        "Reporter management: Searchable reporter selection in forms with search functionality",
        "Reporter management: Reporter analytics showing individual contribution patterns and effectiveness",
        "Shared features: Real-time data synchronization across the application",
        "Shared features: Searchable selection in forms with consistent search functionality",
        "Shared features: Analytics integration for both users and reporters",
        "Shared features: Filtering capabilities in dashboards and analytics views"
      ]
    },
    {
      title: "Deliverables Management",
      icon: "package",
      description: "System for tracking deliverables associated with tasks, including quantities and variations.",
      details: [
        "Deliverable creation, editing, and deletion capabilities",
        "Deliverable categorization and organization",
        "Quantity tracking per deliverable in tasks",
        "Variations support for deliverables with multiple versions or types",
        "Searchable deliverable selection in task forms",
        "Deliverable analytics showing usage patterns and frequency",
        "Total deliverables counting across filtered data sets",
        "Integration with task tracking to link work to specific outputs"
      ]
    },
    {
      title: "Calculations & Metrics",
      icon: "target",
      description: "Advanced calculation engine that processes task data to generate meaningful metrics and statistics.",
      details: [
        "Total task counts across filtered datasets",
        "Total hours calculation summing time investment across tasks",
        "Average metrics calculation for performance analysis",
        "Percentage calculations for distribution analysis",
        "Category breakdown calculations grouping tasks by product type",
        "Market distribution calculations showing task allocation per market",
        "User distribution calculations tracking individual contributions",
        "AI usage calculations tracking time spent and model frequency",
        "Week-based calculations for weekly performance tracking",
        "Month-based aggregations for monthly reporting",
        "Real-time calculation updates as data changes",
        "Memoized calculations for optimal performance"
      ]
    },
    {
      title: "Charts & Visualizations",
      icon: "chart",
      description: "Rich charting system that transforms data into visual representations for easy understanding and analysis.",
      details: [
        "Pie charts for categorical distribution visualization (markets, products, AI models)",
        "Bar charts for comparing metrics across different categories",
        "Biaxial bar charts for displaying multiple metrics simultaneously",
        "Color-coded visualizations with consistent color schemes",
        "Hash-based color assignment ensuring consistent colors for same categories",
        "Interactive chart components with hover states and tooltips",
        "Dynamic chart generation based on filtered data",
        "Chart data processing that transforms raw data into chart-ready formats",
        "Responsive chart design adapting to different screen sizes"
      ]
    },
    {
      title: "Dynamic Tables & Data Display",
      icon: "table",
      description: "Powerful dynamic table system with advanced filtering, multiple value selection, search capabilities, and real-time data updates.",
      details: [
        "Dynamic table generation that adapts to data structure and content automatically",
        "Advanced table functionality with sorting, filtering, and pagination",
        "Column sorting capabilities (ascending, descending, toggle) with visual indicators",
        "Global search filtering across all table columns with real-time results",
        "Multiple value filtering supporting selection of multiple filter values simultaneously",
        "Column-specific filtering for targeted data searches on individual columns",
        "Combined filter logic allowing multiple filters to work together (AND logic)",
        "Task-specific filters: filter by task type, status, department, deliverable, and more",
        "Department filtering with multi-select capability for multiple departments",
        "Deliverable filtering supporting multiple deliverable selection",
        "Searchable filter dropdowns with type-ahead search functionality",
        "URL parameter synchronization for bookmarkable filtered table views",
        "Pagination with configurable page sizes (10, 25, 50, 100 rows per page)",
        "Column visibility toggling to customize table views per user preference",
        "Row selection with single selection mode and bulk action support",
        "Bulk action capabilities when rows are selected (edit, delete, export)",
        "CSV export functionality for filtered and visible data with all active filters",
        "Dynamic column generation based on data structure and user permissions",
        "Real-time table updates as data changes in the system",
        "Responsive table design for mobile and desktop viewing",
        "Color-coded cells for markets, AI models, departments, and status indicators",
        "Clickable links for Jira tickets and external resources",
        "Formatted date and number columns for better readability",
        "Custom filter components integrated directly into table headers",
        "Filter state persistence across page navigation and refreshes"
      ]
    },
    {
      title: "Task Forms & Data Entry",
      icon: "document",
      description: "Dynamic form system with multiple input types, searchable fields, multi-select capabilities, conditional logic, and validation.",
      details: [
        "Dynamic task form generation adapting to task type and user permissions",
        "Form state management for efficient handling of user inputs",
        "Data validation ensuring information is correct and complete",
        "Multiple input field types: text, number, date, select, multi-select, checkbox, textarea, URL",
        "Searchable select fields with type-ahead search for users, reporters, and deliverables",
        "Multi-select fields supporting multiple value selection (markets, AI models, deliverables)",
        "Searchable deliverables field with quantity input per deliverable and variations support",
        "Conditional field display based on user selections (deliverables, AI tools)",
        "Dynamic field rendering that shows/hides fields based on checkbox selections",
        "Multiple value inputs: markets (multi-select), AI models (multi-select), deliverables (searchable multi-select)",
        "Search functionality in all select fields with real-time filtering of options",
        "Filtered options based on department selection for deliverables",
        "Required field validation with visual indicators and error messages",
        "Format validation for dates, URLs, numeric values, and Jira links",
        "Business rule validation (date ranges, time increments, minimum/maximum values)",
        "Conditional validation: deliverables required only when 'has deliverables' is checked",
        "Conditional validation: AI models and time required only when 'AI tools used' is checked",
        "Permission validation before form submission ensuring user has create/update rights",
        "Duplicate task prevention checking for existing tasks by name, user, and gimodear",
        "Month board validation ensuring tasks can only be created for active months",
        "Auto-resolution of reporter names from IDs for seamless data entry",
        "Real-time form error display with helpful messages and field-level validation",
        "Form submission handling with loading states, success notifications, and error recovery",
        "Form data preparation before submission",
        "Hidden field support for storing data like quantities and variations",
        "Form state persistence during navigation and modal interactions",
        "Dynamic form sections organized by category (Basic Info, Deliverables, AI Tools, Notes)"
      ]
    },
    {
      title: "Dynamic Features",
      icon: "zap",
      description: "Dynamic system that adapts and generates content based on data, filters, and user selections.",
      details: [
        "Dynamic analytics page generation based on URL parameters",
        "Dynamic card generation creating cards based on configuration",
        "Dynamic filter application combining multiple filters simultaneously",
        "Dynamic table column generation based on data structure",
        "Dynamic chart generation adapting to available data",
        "Dynamic form field rendering based on task type and permissions",
        "Dynamic navigation menu based on user roles and permissions",
        "Dynamic color assignment using hash-based algorithms",
        "Dynamic month selection with automatic current month detection",
        "Dynamic week calculation based on selected month",
        "Dynamic data processing that adapts to filter combinations",
        "Real-time dynamic updates as data changes in the system"
      ]
    },
    {
      title: "Landing Pages",
      icon: "home",
      description: "Customizable landing page system for creating and managing different landing page views.",
      details: [
        "Landing page creation and management",
        "Customizable landing page content and layout",
        "Landing page routing and navigation",
        "Integration with main application navigation",
        "Landing page access control and permissions"
      ]
    },
    {
      title: "Management Features",
      icon: "settings",
      description: "Administrative management capabilities for overseeing the entire application and user activities.",
      details: [
        "Admin dashboard with overview of system activity",
        "User management interface for creating and managing user accounts",
        "Month board management for creating and organizing monthly work periods",
        "System-wide analytics access for administrators",
        "Permission management for controlling user access",
        "Data management tools for overseeing tasks, users, and reporters",
        "System configuration and settings management",
        "Activity monitoring and oversight capabilities"
      ]
    },
    {
      title: "Month Logic & Board System",
      icon: "calendar",
      description: "Sophisticated month-based organization system that structures work tracking around monthly cycles.",
      details: [
        "Month board creation for each work period (YYYY-MM format)",
        "Automatic current month detection and selection",
        "Month board validation ensuring tasks can only be created for active boards",
        "Month selection dropdown with available months",
        "Month switching that updates all data views to selected month",
        "Month progress tracking with visual progress bars",
        "Days in month calculation for accurate time tracking",
        "Month start and end date management",
        "Month-based task filtering and organization",
        "Historical month access for viewing past work periods",
        "Month context that persists across the application",
        "Month board lifecycle management (creation, activation, archival)"
      ]
    },
    {
      title: "Task Logic & Management",
      icon: "task",
      description: "Task management system with filtering, multiple value selection, search capabilities, and real-time updates.",
      details: [
        "Task creation with metadata (Jira link, products, departments, markets, time, dates)",
        "Task editing and updating with change tracking and validation",
        "Task deletion with permission validation and confirmation",
        "Task detail pages showing complete task information with all associations",
        "Advanced task filtering supporting multiple filter combinations simultaneously",
        "Task filtering by month, user, reporter, week, department, deliverable, and task type",
        "Multiple value filtering: select multiple markets, departments, deliverables, or task types",
        "Task search with global search filtering across all task fields",
        "Searchable task filters with type-ahead search in filter dropdowns",
        "Combined filter logic: apply multiple filters together (month + user + reporter + week + department + deliverable)",
        "URL parameter synchronization for task filters enabling shareable filtered views",
        "Task status tracking and management with visual indicators",
        "Task association with deliverables and quantities with variations support",
        "AI usage tracking within tasks (multiple AI models and time spent per model)",
        "Market assignment to tasks with multi-market support (select multiple markets)",
        "Product category assignment (marketing, acquisition, product) with subcategories",
        "Department categorization for organizational structure and filtering",
        "VIP task flagging for important tasks with visual highlighting",
        "Reworked task tracking for revised work with status indicators",
        "Task observations and notes for additional context and documentation",
        "Real-time task updates across all users with instant synchronization",
        "Task duplicate prevention checking multiple criteria (name, user, gimodear)",
        "Task permission validation ensuring users can only modify authorized tasks",
        "Task filtering by multiple criteria: combine user, reporter, department, deliverable, week, and month",
        "Dynamic task table with real-time filtering and search capabilities"
      ]
    },
    {
      title: "Advanced Filtering System",
      icon: "globe",
      description: "Filtering system with multiple value selection, searchable filters, dynamic combinations, and real-time updates.",
      details: [
        "Month filtering to view data for specific months with dropdown selection",
        "User filtering to focus on individual or team member work with searchable selection",
        "Reporter filtering to analyze work by source with searchable dropdown",
        "Week filtering to view weekly performance and activity with week selector",
        "Department filtering with multiple value selection supporting multiple departments",
        "Deliverable filtering with searchable multi-select for multiple deliverables",
        "Task type filtering with multiple value selection for different task categories",
        "Multiple value filtering: select multiple markets, departments, deliverables, or task types simultaneously",
        "Searchable filter inputs: all filter dropdowns support type-ahead search functionality",
        "Independent filter combination allowing multiple filters to work together",
        "AND logic filtering showing only data matching all active filters simultaneously",
        "Filter combination examples: Month + User + Reporter + Week + Department + Deliverable + Task Type",
        "URL parameter synchronization for bookmarkable filtered views (?user=, ?reporter=, ?week=, ?department=, ?deliverable=, ?filter=)",
        "Filter persistence across page navigation and browser refreshes",
        "Filter reset capabilities for clearing individual or all filters",
        "Real-time filter application updating views immediately as filters change",
        "Filter state management across the application with context sharing",
        "Dynamic filter options that update based on available data",
        "Filter validation ensuring only valid filter combinations are applied",
        "Filter indicators showing active filter count and selected values",
        "Global search filtering that works alongside specific filters",
        "Filter export: active filters included in CSV exports for data traceability"
      ]
    },
    {
      title: "Week Logic & Calculations",
      icon: "clock",
      description: "Week-based organization and calculation system for tracking and analyzing weekly work patterns.",
      details: [
        "Week calculation within months considering only weekdays (Monday-Friday)",
        "Current week number detection and display",
        "Week filtering to view tasks within specific weeks",
        "Week selector dropdown for easy week selection",
        "Week-based analytics and reporting",
        "Week progress tracking and visualization",
        "Week date range calculation for accurate filtering",
        "Week-based task aggregation and statistics",
        "Week navigation and selection in analytics views"
      ]
    },
    {
      title: "Real-Time Synchronization",
      icon: "refresh",
      description: "Real-time data synchronization ensuring all users see the latest information instantly.",
      details: [
        "Firestore real-time listeners for automatic data updates",
        "Instant task updates when tasks are created, modified, or deleted",
        "Real-time user data synchronization",
        "Real-time analytics updates as data changes",
        "Listener management preventing duplicate connections",
        "Efficient listener cleanup on component unmount",
        "Listener pausing when browser tabs are hidden",
        "Listener resuming when tabs become visible",
        "Real-time collaboration enabling multiple users to work simultaneously"
      ]
    },
    {
      title: "Permission & Security System",
      icon: "check",
      description: "Security system with role-based and explicit permissions for access control.",
      details: [
        "Role-based access control with admin and user roles",
        "Explicit permission system for granular access control",
        "Permission validation on all data mutations",
        "Route protection ensuring only authorized users access pages",
        "Permission checks before form submissions",
        "User data isolation (users see only their own tasks unless admin)",
        "Admin bypass capabilities for administrative operations",
        "Permission hierarchy with admin role granting all permissions",
        "Session management with 8-hour sessions and refresh",
        "CSRF protection via session tokens",
        "Authentication state management",
        "Unauthorized access prevention and error handling"
      ]
    },
    {
      title: "Caching & Performance",
      icon: "package",
      description: "Intelligent caching system optimizing performance and reducing redundant data fetches.",
      details: [
        "Static data caching (users, reporters, deliverables) with infinite TTL",
        "Month data caching with 30-day time-to-live",
        "Cache invalidation on data mutations",
        "Memory management with size limits and cleanup",
        "Cache key management for efficient data retrieval",
        "Performance optimization through memoized calculations",
        "Efficient data fetching reducing Firestore reads",
        "Cache cleanup for expired entries"
      ]
    }
  ];

  return (
    <div className="min-h-screen  bg-primary py-8 px-4">
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Application Documentation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            An overview of features, systems, and capabilities available in the Task Tracker Application
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6">
          {features.map((feature, index) => {
            const Icon = Icons.generic[feature.icon] || Icons.generic.help;
            return (
              <div
                key={index}
                className="card  rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                    {React.createElement(Icon, {
                      className: "w-6 h-6 text-blue-600 dark:text-blue-400"
                    })}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {feature.description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Key Capabilities:
                  </h3>
                  <ul className="space-y-1.5">
                    {feature.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                      >
                        <span className="text-blue-500 mr-2 mt-1.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2">Core Functionality</h3>
              <p className="text-sm">
                The application provides a task tracking and analytics platform with real-time synchronization, 
                filtering, and dynamic content generation. All features work together to provide 
                a unified experience for task management, data analysis, and organizational oversight.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data Management</h3>
              <p className="text-sm">
                The system manages tasks, users, reporters, deliverables, and month boards with full CRUD operations, 
                real-time updates, and intelligent caching. Data is organized by months, filtered by multiple dimensions, 
                and processed for analytics and reporting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Analytics & Reporting</h3>
              <p className="text-sm">
                Advanced analytics engine processes task data across six dimensions (Marketing, Acquisition, Product, AI, 
                Reporter, Markets by Users) with real-time calculations, visual charts, and detailed tables. All analytics 
                support dynamic filtering and update automatically as data changes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">User Experience</h3>
              <p className="text-sm">
                The application provides intuitive forms, responsive tables, interactive charts, and dynamic filtering. 
                All features include permission checks, validation, error handling, and real-time updates to ensure a 
                smooth and secure user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSummaryPage;

