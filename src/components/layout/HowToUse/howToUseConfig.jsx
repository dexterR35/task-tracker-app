/**
 * How to Use Content Configuration
 * Centralized documentation content for all pages
 */

export const HOW_TO_USE_CONTENT = {
  dashboard: {
    title: "How to Use Dashboard",
    sections: [
      {
        title: "Important Notes:",
        isImportant: true,
        items: [
          { text: "Month Logic", description: "Month data is cached for 30 days (changes once per month). Cache automatically refreshes on the first day of a new month. The system checks cache first, then fetches fresh data if needed. Each month requires a month board to exist before tasks can be created" },
          { text: "Month Board Creation", description: "Only users with 'create_boards' permission (typically admins) can create month boards. Tasks can only be created for months with an active board. If board is missing, a banner automatically appears allowing admins to create it. Board validation occurs before task creation" },
          { text: "Deliverable Calculation in Table", description: "Formula: (time per unit in minutes × quantity) + (variations quantity × variations time in minutes). Time conversion: if unit is 'hr', multiply by 60 to get minutes. Final time is converted to hours (divide by 60) and days (divide by 480, where 480 minutes = 8 hours = 1 day). Table shows: quantity × deliverable name, how it's calculated showing (time per unit × quantity + variations), and total time in hours and days. Example without variations: 2x Logo with 1h per unit = (60min × 2) + 0 = 120min = 2h (0.25 days). Example with variations: 3x Banner with 2h per unit, 2 variations at 30min each = (120min × 3) + (30min × 2) = 360min + 60min = 420min = 7h (0.88 days). Variations add extra time per variation if deliverable requires quantity" },
          { text: "Export Logic", description: "Export tasks to CSV format. When filters are active: exports all visible columns (excluding select and actions columns). When no filters are active: exports only specific columns - DEPARTMENT, JIRA LINK, MARKET, TOTAL HOURS (excluding AI hours), DELIVERABLES (deliverable names only). Exports selected/filtered tasks based on current table view. CSV includes headers and properly escapes values containing delimiters, quotes, or newlines. Filename format: tasks_export_YYYY-MM-DD.csv" },
          { text: "Permissions", description: "CRUD operations require appropriate permissions (create_tasks, update_tasks, delete_tasks)" },
          { text: "Form Validation", description: "Required fields are marked and validated before submission" },
          { text: "Conditional Fields", description: "AI fields appear when \"AI Used\" is checked, Deliverables appear when \"Has Deliverables\" is checked" },
          { text: "URL Parameters", description: "Filters are saved in URL for easy sharing and bookmarking" },
          { text: "Real-time Updates", description: "Changes are reflected immediately in the table and summary cards" },
          { text: "Regular Users", description: "Can only view/edit their own tasks (unless admin)" },
          { text: "Admins", description: "Can view/edit all tasks and use all filters" },
        ]
      },
      {
        title: "Getting Started:",
        items: [
          { text: "ADD TASK Button", description: "Click to create a new task (requires permission and active month board)" },
          { text: "Month Progress Bar", description: "Shows current month progress and allows month selection" },
          { text: "Summary Cards", description: "Display key metrics: Total Tasks, Total Hours, Efficiency, etc." },
          { text: "User/Reporter Filters", description: "Use cards to filter tasks by user or reporter" },
          { text: "Week Filter", description: "Select a specific week to view tasks for that week only" },
        ]
      },
      {
        title: "Task Form - All Inputs:",
        items: [
          { 
            text: "Basic Information:",
            subItems: [
              { text: "Jira Link", description: "Required URL field for task tracking link" },
              { text: "Department", description: "Required dropdown (Marketing, Acquisition, Product, etc.)" },
              { text: "Products", description: "Required dropdown to select product" },
              { text: "Markets", description: "Required multi-select for target markets" },
              { text: "Reporter", description: "Required searchable dropdown to select reporter" },
            ]
          },
          { 
            text: "Timeline & Duration:",
            subItems: [
              { text: "Start Date", description: "Required date picker for task start" },
              { text: "End Date", description: "Required date picker for task end" },
              { text: "Total Time (Hours)", description: "Required number input (supports decimals, e.g., 2.5 hours)" },
            ]
          },
          { 
            text: "Task Properties:",
            subItems: [
              { text: "VIP", description: "Checkbox to mark task as VIP" },
              { text: "Reworked", description: "Checkbox to indicate task was reworked" },
              { text: "Use Shutterstock", description: "Checkbox for Shutterstock usage" },
            ]
          },
          { 
            text: "AI Configuration:",
            subItems: [
              { text: "AI Used", description: "Checkbox to enable AI fields" },
              { text: "AI Models", description: "Multi-select (appears when AI Used is checked)" },
              { text: "AI Time", description: "Number input for AI time in hours (appears when AI Used is checked)" },
            ]
          },
          { 
            text: "Deliverables:",
            subItems: [
              { text: "Has Deliverables", description: "Checkbox to enable deliverables selection" },
              { text: "Deliverables", description: "Searchable dropdown (appears when Has Deliverables is checked) - shows time estimates" },
            ]
          },
          { 
            text: "Additional Notes:",
            subItems: [
              { text: "Observations", description: "Optional textarea for additional notes" },
            ]
          },
        ]
      },
      {
        title: "Filters:",
        items: [
          { text: "Global Search", description: "Search across all task fields (Jira link, departments, products, etc.)" },
          { text: "Department Filter", description: "Filter tasks by specific department (Marketing, Acquisition, Product)" },
          { text: "Task Filters", description: "Quick filters: AI Used, Marketing, Acquisition, Product, VIP, Reworked, Shutterstock" },
          { text: "Deliverable Filter", description: "Filter tasks by specific deliverable type" },
          { text: "User Filter", description: "Select user from summary cards to filter their tasks" },
          { text: "Reporter Filter", description: "Select reporter from summary cards to filter their tasks" },
          { text: "Week Filter", description: "Select week from summary cards to filter tasks by week" },
          { text: "Month Filter", description: "Use month progress bar to switch between months" },
          { text: "Filter Combination", description: "All filters work together (AND logic) - task must match all active filters" },
        ]
      },
      {
        title: "Tables:",
        items: [
          { text: "Column Sorting", description: "Click column headers to sort ascending/descending" },
          { text: "Column Visibility", description: "Use column visibility button to show/hide columns" },
          { text: "Row Selection", description: "Click checkbox to select rows for bulk actions" },
          { text: "Pagination", description: "Navigate through pages using pagination controls at bottom" },
          { text: "Page Size", description: "Change number of rows per page (default: 5 rows)" },
          { text: "Row Actions", description: "Click row to view task details, or use action buttons (Edit/Delete)" },
          { text: "Bulk Actions", description: "Select multiple rows to perform bulk operations (View, Edit, Delete, Export)" },
          { text: "JIRA LINK Column", description: "Task tracking link (Jira ticket ID or URL)" },
          { text: "DEPARTMENT Column", description: "Task department (Marketing, Acquisition, Product, etc.)" },
          { text: "PRODUCT Column", description: "Product name associated with the task" },
          { text: "MARKETS Column", description: "Target markets for the task (displayed as badges)" },
          { text: "AI MODELS Column", description: "AI models used in the task with total AI hours" },
          { text: "LIVRABLES (Deliverables) Column", description: "Shows deliverable name, quantity, variations, how it's calculated (time per unit × quantity + variations), and total time in hours/days" },
          { text: "REPORTERS Column", description: "Reporter name assigned to the task" },
          { text: "CREATED BY Column", description: "User who created the task" },
          { text: "TASK ADDED Column", description: "Date and time when the task was created" },
          { text: "OBSERVATIONS Column", description: "Additional notes or observations about the task" },
          { text: "TASK START Column", description: "Task start date" },
          { text: "TASK END Column", description: "Task end date" },
          { text: "DONE BY Column", description: "Task duration in days (calculated from start to end date)" },
          { text: "TASK HR Column", description: "Total hours allocated for the task" },
          { text: "VIP Column", description: "Indicates if task is marked as VIP" },
          { text: "REWORKED Column", description: "Indicates if task was reworked" },
          { text: "SHUTTERSTOCK Column", description: "Indicates if Shutterstock was used" },
        ]
      },
      {
        title: "Buttons & Actions:",
        items: [
          { text: "ADD TASK", description: "Primary button (top right) to open create task modal" },
          { text: "Create Task / Update Task", description: "Form submit button (bottom of form) - shows loading state" },
          { text: "Edit Button", description: "Row action button to edit task (requires update permission)" },
          { text: "Delete Button", description: "Row action button to delete task (requires delete permission)" },
          { text: "View Selected", description: "Bulk action to view details of selected tasks" },
          { text: "Edit Selected", description: "Bulk action to edit selected tasks (single task at a time)" },
          { text: "Delete Selected", description: "Bulk action to delete multiple selected tasks" },
          { text: "Export", description: "Button to export filtered/selected tasks" },
          { text: "Column Visibility", description: "Button to toggle column visibility" },
          { text: "Refresh", description: "Button to refresh table data" },
        ]
      },
    ]
  },
  teamDaysOff: {
    title: "How to Use Team Days Off",
    sections: [
      {
        title: "Important Notes:",
        isImportant: true,
        items: [
          { text: "Base Days Required", description: "Users must have base days configured before selecting dates. Admins need to create a record with base days first" },
          { text: "Days Total Calculation", description: "Total days = Base Days + Monthly Accrual (1.75 days × number of months since record creation). This is calculated automatically" },
          { text: "Days Remaining", description: "Remaining days = Total Days - Days Off Used. This shows how many vacation days are still available" },
          { text: "Email to HR", description: "After saving dates, use \"Send Email to HR\" button to notify the HR team. This helps with vacation planning and approval" },
          { text: "Past Dates", description: "Past dates cannot be selected or removed. They are grayed out and locked to prevent changes to historical data" },
          { text: "Weekends", description: "Weekends (Saturday and Sunday) cannot be selected. Only weekdays can be marked as days off" },
          { text: "Multiple Users", description: "Admins can view and manage days off for all team members. Regular users can only see and manage their own days off" },
          { text: "Accrual System", description: "Days off accumulate automatically at 1.75 days per month. This happens from the date the record was created, not from a specific start date" },
        ]
      },
      {
        title: "Getting Started:",
        items: [
          { text: "Admins", description: "Click \"Add Entry\" to create a user's days off record with base days. You can manage days off for any team member" },
          { text: "Regular Users", description: "Your days off record is automatically selected when opening the calendar. You can view and manage your own vacation days" },
          { text: "Base Days", description: "Initial days off allocated to a user (e.g., from 30.11.2025). This is the starting number of vacation days" },
          { text: "Monthly Accrual", description: "System automatically adds 1.75 days per month since the record was created. This accumulates over time" },
          { text: "Calendar View", description: "The calendar shows all team members' days off with color coding. Each user has a unique color for easy identification" },
        ]
      },
      {
        title: "Managing Days Off:",
        items: [
          { text: "Select User", description: "Admins can select any user from the dropdown menu (top right of calendar). Regular users see only their own record" },
          { text: "Select Dates", description: "Click on calendar dates to select days off. Weekends and past dates are automatically disabled and cannot be selected" },
          { text: "Save Dates", description: "Click \"Save\" button to save your selected dates. Changes are saved immediately and visible to all users" },
          { text: "Remove Dates", description: "Click the \"×\" button on saved dates to remove them. You can only remove future dates, not past ones" },
          { text: "Edit User Record", description: "Admins can edit base days and total days off count for any user. Click the edit button to modify user settings" },
          { text: "View All Users", description: "The calendar displays all team members' days off simultaneously. Use the color legend to identify who has time off on specific dates" },
        ]
      },
      {
        title: "Calendar Features:",
        items: [
          { text: "Color Legend", description: "Shows all users with their assigned colors and total days off. Each user has a unique color for easy visual identification" },
          { text: "Year Navigation", description: "Use arrow buttons to navigate between years. View past and future years to plan ahead or review history" },
          { text: "Visual Indicators", description: "Colored dates show who has days off on specific dates. Hover over dates to see which users are off" },
          { text: "Real-time Updates", description: "Changes are reflected immediately across all users. When someone saves dates, everyone sees the update instantly" },
          { text: "Month View", description: "Calendar displays a full month view with all dates. Weekends are clearly marked and cannot be selected" },
          { text: "Date Selection", description: "Click on any available date to select it. Selected dates are highlighted and can be saved or removed" },
        ]
      },
    ]
  },
  analytics: {
    title: "How to Use Analytics",
    sections: [
      {
        title: "Important Notes:",
        isImportant: true,
        items: [
          { text: "Admin Only", description: "Analytics page is only accessible to users with admin role. Regular users cannot access this page" },
          { text: "Task Counting Logic", description: "Total tasks shows unique tasks (each task counted once). Market breakdowns show per-market counts (how many times each market appears across all tasks). Example: 3 tasks with markets [UK,RO,IE], [RO,UK], [RO,IE] shows Total: 3 tasks, but RO: 3, IE: 2, UK: 2" },
          { text: "Month Selection", description: "Select a month from the dropdown to view analytics for that specific month. Analytics are calculated based on tasks in the selected month" },
          { text: "Data Updates", description: "Analytics update automatically when tasks are added, modified, or deleted. Changes are reflected immediately in all charts and statistics" },
          { text: "Percentage Calculation Logic", description: "Percentages are calculated to always sum to exactly 100%. System uses floor values (rounds down) and allocates remainder percentage points to items with largest remainders. Example: 3 items with 33.3%, 33.3%, 33.4% display as 33%, 33%, 34% (sums to 100%). This ensures no rounding errors" },
          { text: "Total Calculation Formula", description: "Totals use reduce function to sum all values: total = sum of all individual values. For tasks: count unique tasks. For hours: sum all task hours. For markets: sum market occurrences. Totals are rounded to 2 decimal places for hours" },
          { text: "Per User Calculations", description: "Data divided per user shows: total tasks per user (unique count), total hours per user (sum of hours), market distribution per user (which markets each user worked on), category breakdown per user (Marketing/Acquisition/Product per user), and percentage of total workload per user" },
          { text: "Per Market Calculations", description: "Market statistics calculated as: task count per market (how many tasks include this market), total hours per market (sum of hours for tasks with this market), percentage distribution (market count / total market occurrences × 100%). Markets are normalized (uppercase, trimmed) for consistency" },
          { text: "Per Category Calculations", description: "Tasks grouped by category: Product (product casino, product sport, product poker, product lotto), Acquisition (acquisition casino, acquisition sport, etc.), Marketing (marketing casino, marketing sport, etc.), Misc (miscellaneous). Each category shows subcategory breakdown and market distribution" },
          { text: "Per Reporter Calculations", description: "Reporter analytics show: total tasks per reporter (unique count), total hours per reporter (sum of hours), markets covered per reporter (which markets reporter's tasks target), products worked on per reporter, and performance metrics per reporter" },
          { text: "Per Month Calculations", description: "All analytics filtered by selected month. Tasks must match selected month's monthId. Switch months to compare different time periods. Month comparison done manually by selecting different months" },
          { text: "Chart Data Generation", description: "Charts display: count with percentage format (e.g., '15 (25.5%)'), color-coded by type (markets have market colors, products have product colors, users have user colors). Pie charts show distribution, biaxial charts show tasks and hours together. Colors are consistent across all views" },
          { text: "Table Data with Grand Totals", description: "Tables include grand total row that sums: total tasks (sum of all rows), total hours (sum rounded to 2 decimals), market totals (sum of market counts), market hours (sum of market hours). Grand total row is bold and highlighted for visibility" },
          { text: "Hours Rounding", description: "All hours values rounded to 2 decimal places (e.g., 123.456 becomes 123.46). This applies to: total hours, per-user hours, per-market hours, per-category hours, and grand totals" },
          { text: "Market Normalization", description: "Markets are normalized before calculations: trimmed (remove spaces), uppercase conversion (RO, UK, IE). This ensures 'ro', 'RO', ' Ro ' all count as same market. Prevents duplicate market entries" },
          { text: "Category Type Detection", description: "Tasks categorized by product name: starts with 'product ' = Product category, contains 'acquisition' = Acquisition category, contains 'marketing' = Marketing category, starts with 'misc' = Misc category. Subcategories extracted from product name (casino, sport, poker, lotto)" },
          { text: "Data Division Dimensions", description: "Analytics divide data by multiple dimensions simultaneously: by user (who worked), by market (which markets), by category (department type), by reporter (who reported), by product (which products), by time (month/week), by AI model (which AI tools used)" },
          { text: "Biaxial Chart Logic", description: "Biaxial charts show two metrics together: tasks count (left axis) and hours (right axis). Each data point shows both values. Helps visualize relationship between task count and time spent. Used in market, category, and user breakdowns" },
          { text: "Pie Chart Logic", description: "Pie charts show distribution percentages. Each segment represents a category/market/user with its percentage. Segments colored consistently. Total shown in center. Percentages sum to exactly 100% using floor and remainder allocation" },
          { text: "User Analytics Breakdown", description: "Per user shows: total tasks (unique count), total hours (sum), market distribution (tasks and hours per market), category breakdown (Marketing/Acquisition/Product tasks and hours), percentage of total workload (user tasks / total tasks × 100%), and market percentages per user" },
          { text: "Reporter Analytics Breakdown", description: "Per reporter shows: total tasks assigned (unique count), total hours (sum), markets covered (which markets reporter's tasks target), products worked on (which products), performance metrics (tasks per reporter, hours per reporter), and market distribution per reporter" },
        ]
      },
      {
        title: "Getting Started:",
        items: [
          { text: "Access Analytics", description: "Navigate to Analytics page from the sidebar (admin only). The page shows an overview of all analytics types" },
          { text: "Month Selector", description: "Use the month dropdown at the top right to select which month's data to analyze. Default shows current month" },
          { text: "Month Progress Bar", description: "Shows the selected month's progress with start date, end date, and days remaining. Helps visualize the month timeline" },
          { text: "Analytics Cards", description: "View all available analytics types as cards. Each card shows total tasks and hours for that category. Click any card to see detailed breakdown" },
        ]
      },
      {
        title: "Analytics Types:",
        items: [
          { text: "Total Analytics", description: "View all hours by Product, Acquisition, and Marketing. Shows overall performance across all departments" },
          { text: "Markets by Users", description: "View tasks distribution by markets and users. See which users work on which markets and how tasks are distributed" },
          { text: "Marketing Analytics", description: "View marketing hours breakdown by subcategories and markets. Analyze marketing performance and market distribution" },
          { text: "Acquisition Analytics", description: "View acquisition tasks and hours by subcategories and markets. Track acquisition performance across different markets" },
          { text: "Product Analytics", description: "View product tasks and hours by subcategories and markets. Analyze product development workload and market focus" },
          { text: "Misc Analytics", description: "View miscellaneous product tasks and hours. Covers tasks that don't fit into main categories" },
          { text: "AI Analytics", description: "View AI usage by users and models. See which AI models are used most, total AI time spent, and usage patterns" },
          { text: "Reporter Analytics", description: "View tasks, hours, markets, and products by reporter. Analyze reporter performance and workload distribution" },
          { text: "Shutterstock Analytics", description: "View Shutterstock tasks and hours by user and market. Track Shutterstock usage across the team" },
        ]
      },
      {
        title: "Using Analytics Cards:",
        items: [
          { text: "Card Overview", description: "Each card shows total tasks count and total hours. Cards are color-coded for easy identification. Hover over cards to see more details" },
          { text: "View Details", description: "Click on any analytics card to view detailed breakdown. See charts, market distributions, user breakdowns, and category statistics" },
          { text: "Back to Overview", description: "Click \"Back to Analytics\" button to return to the main overview page. Navigate between different analytics types easily" },
          { text: "Charts and Visualizations", description: "Detailed views show charts with market distribution, user breakdowns, and category statistics. Charts are color-coded for clarity" },
          { text: "No Data Message", description: "If no data is available for selected month, a message appears explaining that data will show once tasks are added" },
        ]
      },
      {
        title: "Understanding Analytics Data:",
        items: [
          { text: "Total Tasks", description: "Shows the count of unique tasks in the selected month. Each task is counted once, regardless of how many markets it has" },
          { text: "Market Counts", description: "Shows how many times each market appears across all tasks. A task with multiple markets counts toward each market's total" },
          { text: "Total Hours", description: "Sum of all task hours in the selected month. Includes regular task hours, excluding AI hours in some views" },
          { text: "Category Breakdown", description: "Tasks are grouped by category (Marketing, Acquisition, Product). Each category shows subcategories and market distribution" },
          { text: "User Distribution", description: "Shows which users worked on tasks in each category or market. Helps identify workload distribution across team members" },
          { text: "AI Usage Statistics", description: "Shows which AI models were used, total AI time spent, and usage patterns. Helps track AI tool adoption and efficiency" },
        ]
      },
    ]
  },
};

export const HOW_TO_USE_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "teamDaysOff", label: "Team Days Off", icon: "calendar" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  // Add more items as needed
];

