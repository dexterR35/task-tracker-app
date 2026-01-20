
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
          { text: "Bulk Actions", description: "Select multiple rows to perform bulk operations (Edit, Delete)" },
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
          { text: "Edit Selected", description: "Bulk action to edit selected tasks (single task at a time)" },
          { text: "Delete Selected", description: "Bulk action to delete multiple selected tasks" },
          { text: "Column Visibility", description: "Button to toggle column visibility" },
          { text: "Refresh", description: "Button to refresh table data" },
        ]
      },
    ]
  },
};

export const HOW_TO_USE_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
];

