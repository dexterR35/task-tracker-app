import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";

const FeaturesSummaryPage = () => {
  const { canAccess } = useAuth();
  const isAdmin = canAccess("admin");



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

        {/* Comprehensive System Explanation Note */}
        <div className="mb-12 card rounded-lg p-8 border-l-4 border-purple-500">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📋 System Architecture & Logic Summary
          </h2>
          
          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">How Everything Works Together</h3>
              <p className="text-sm leading-relaxed mb-4">
                The application is built around a <strong>month-based organization system</strong> where work is tracked in monthly cycles. 
                Each month requires an active board document in Firestore before tasks can be created. Tasks are stored in a hierarchical 
                structure organized by department, year, and month, ensuring clean data organization and efficient querying.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Real-time synchronization</strong> is the backbone of the system. When any user creates, updates, or deletes a task, 
                Firestore listeners automatically detect the change and push updates to all connected clients. This means all users see 
                changes instantly without manual page refreshes. The same real-time mechanism applies to deliverables, ensuring the system 
                stays synchronized across all users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Task Form & Field Logic</h3>
              <p className="text-sm leading-relaxed mb-4">
                The task form uses <strong>conditional field rendering</strong> based on checkbox selections. When "_hasDeliverables" is checked, 
                the deliverables field becomes visible and required. When "_usedAIEnabled" is checked, AI models and AI time fields appear. 
                This prevents form clutter and ensures users only see relevant fields.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Multiple select fields</strong> (MultiSelectField) allow selecting multiple values from a dropdown. Used for markets 
                where a task can span multiple markets. Selected values are stored as arrays and displayed as removable badges. The component 
                filters out already-selected options from the dropdown to prevent duplicates.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Searchable select fields</strong> (SearchableSelectField) provide type-ahead search functionality. As users type, options 
                are filtered in real-time by matching label, name, email, or other searchable properties. The search is case-insensitive and 
                supports partial matches. Used for reporters, users, and deliverables where the list can be long.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Searchable deliverables field</strong> combines search with quantity and variations tracking. When a deliverable is selected, 
                if requiresQuantity=true, quantity and variations fields appear. Variations are only enabled if the deliverable has variationsTime 
                configured. Department filtering automatically filters deliverable options based on selected department.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Filtering & Search System</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Filter combination logic</strong> uses AND logic - all active filters must match simultaneously. Filters include: month, 
                user, reporter, week, department, deliverable, and task type. Multiple values can be selected for department, deliverable, and 
                task type filters (multi-select), meaning a task matches if it belongs to ANY of the selected values in that filter category.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Searchable filters</strong> use SearchableSelectField components with type-ahead search. All filter dropdowns support 
                real-time search filtering. Global table search filters across all columns simultaneously, while specific filters target individual 
                fields. URL parameters sync filter state for bookmarkable filtered views.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Filter application order</strong>: First apply month/user/reporter/week filters → then apply department/deliverable/task type 
                filters → finally apply global search. This ensures consistent filtering across all analytics and tables. Filters persist 
                across page navigation via URL parameters.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Month Board Creation Logic</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Board creation flow</strong>: Admin selects month → validates monthId format (YYYY-MM) → checks if board already exists 
                → parses monthId to Date object → calculates month info (monthName, daysInMonth, startDate, endDate) → generates unique boardId 
                (board_YYYY-MM_timestamp) → creates Firestore document at departments/{dept}/{year}/{monthId} → sets status='active'.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Board validation</strong> occurs before task creation: Check if month document exists → verify boardId exists → verify 
                status='active'. If any check fails, task creation is prevented with clear error message. Month board banner automatically appears 
                when board is missing, allowing admins to create it with one click.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Month info calculation</strong>: Uses date-fns utilities to calculate month start (first day), month end (last day), 
                daysInMonth, and monthName. All dates are converted to ISO strings for Firestore compatibility. The system handles timezone 
                conversions and ensures consistent date representation.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Calculation Metrics & Variations</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Calculation variations</strong> handle different data scenarios: Base calculations (sum, count, average) → percentage 
                calculations with zero-division handling → time conversions (hours/minutes/days) → deliverable time calculations with quantity 
                and variations → week-based aggregations → category breakdowns by product/department/market/AI model.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Deliverable calculation variations</strong>: If requiresQuantity=false, only base time (timePerUnit) is used. If 
                requiresQuantity=true, formula is: (timePerUnit × quantity) + (variationsTime × variationsQuantity). Variations are only 
                included if variationsTime &gt; 0. All time is converted to minutes first, then to hours/days for display.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Metric aggregation patterns</strong>: tasks.reduce() for summing hours, tasks.filter().length for counting, 
                sum/count for averages. Category grouping uses Object.groupBy() or reduce() to create breakdowns. Percentage calculations 
                include fallback to 0% when total is zero to prevent division errors.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Calculation Tables & Data Display</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Analytics tables</strong> display calculated metrics in structured format. Table data is generated by grouping tasks 
                → aggregating metrics → calculating percentages → formatting for display. Tables include columns for categories, task counts, 
                total hours, market distribution, and percentage breakdowns.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Table calculation logic</strong>: Each row represents a category (product type, market, user, reporter). Columns show 
                metrics (tasks, hours) and sub-metrics (market distribution, percentages). Grand total rows are automatically added showing 
                sums across all categories. Percentages are calculated per row and per column for comprehensive analysis.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Table data transformation</strong>: Raw task data → filter by active filters → group by dimension → aggregate metrics 
                → calculate percentages → format numbers (toFixed for precision) → add grand totals → sort by primary metric (descending) → 
                generate table rows with consistent structure.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Performance & Caching Strategy</h3>
              <p className="text-sm leading-relaxed mb-4">
                The system uses an <strong>intelligent caching strategy</strong> to minimize Firestore reads and improve performance. Static data 
                like users, reporters, and deliverables are cached indefinitely since they change infrequently. Month data is cached for 30 days 
                since it only changes once per month. Tasks are never cached and always fetched in real-time to ensure accuracy.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                When data changes, the cache is automatically updated by real-time listeners, ensuring cached data stays fresh. On manual 
                mutations (create, update, delete), the cache is invalidated first, then the listener updates it with fresh data. This dual 
                approach ensures both performance and data accuracy.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Deliverables & Time Calculations</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Deliverables</strong> are tracked with quantity and variations support. The time calculation formula multiplies the time 
                per unit by the quantity, then adds variations time multiplied by variations quantity. This allows for accurate time tracking 
                when deliverables have multiple units or variations. The system automatically converts between hours and minutes, and calculates 
                days based on 8-hour workdays.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                Deliverables are organized by department and can be filtered accordingly. The system supports a "requires quantity" flag that 
                determines whether quantity tracking is needed. When this flag is false, variations are ignored, simplifying the workflow for 
                simple deliverables.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Charts & Visualizations</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Chart data transformation</strong>: Raw analytics data → group by category → calculate values and percentages → format 
                for Recharts component → assign colors → sort by value (descending) → generate chart-ready data structure.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Pie chart logic</strong>: Map categories to {`{name, value, percentage}`} objects → sort by value descending → assign 
                hash-based colors → render slices with labels and tooltips. Pie charts show distribution (markets, products, AI models, departments).
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Bar chart logic</strong>: Categories on X-axis → metrics on Y-axis → calculate max value for scale → render bars with 
                value labels → add grid lines and axis labels. Bar charts compare metrics across categories (tasks, hours, percentages).
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Biaxial chart logic</strong>: Two Y-axes (left/right) → different metrics on each axis → different scales calculated 
                independently → color-code by metric type → render grouped bars. Used to display tasks count and hours simultaneously for comparison.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Color assignment algorithm</strong>: Hash category name string → convert to hex color → ensure contrast against background 
                → cache color mapping in memory → same category always gets same color across all charts for consistency. Colors persist across 
                filter changes and page refreshes.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Dynamic chart updates</strong>: Filter changes → recalculate analytics → transform to chart format → update chart props 
                → Recharts detects prop changes → re-renders with new data. Tooltips show on hover with formatted values (count, percentage, label).
              </p>
                  </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Analytics System & Processing</h3>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Analytics processing flow</strong>: Filter tasks by month/user/reporter/week → group by dimension (product, market, user, etc.) 
                → aggregate metrics (sum hours, count tasks) → calculate percentages → generate chart data → generate table data → format for display.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Marketing Analytics</strong>: Filter tasks.products='marketing' → group by subcategory (casino, sport, poker, lotto) → 
                sum timeInHours per subcategory → calculate market distribution per subcategory → generate pie charts for subcategories and markets.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Acquisition Analytics</strong>: Filter tasks.products='acquisition' → group by market → aggregate time per market → 
                calculate resource allocation percentages → identify markets with highest focus → visualize market distribution.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Product Analytics</strong>: Filter tasks.products='product' → group by category (casino, sport, poker, lotto) → sum hours 
                per category → identify priority categories by time investment → calculate market distribution per product category.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>AI Analytics</strong>: Extract aiModels array from all tasks → flatten to individual models → count frequency per model 
                → sum aiTime per model → calculate total AI time → identify most used models → show time distribution across models.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Reporter Analytics</strong>: Group tasks by reporter → count tasks per reporter → sum hours per reporter → calculate 
                market/product distribution per reporter → identify top contributors → show individual performance metrics.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Markets by Users</strong>: Cross-tabulation matrix of user × market → count tasks per combination → calculate hours per 
                combination → generate table with users as rows, markets as columns → visualize workload distribution and market focus per user.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Analytics table generation</strong>: For each analytics type, generate tableData array with rows for each category → 
                add columns for metrics (tasks, hours) and sub-metrics (markets, percentages) → add grand total row with sums → format numbers 
                and percentages → sort by primary metric → render in AnalyticsTable component.
                    </p>
                  </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Security & Data Isolation</h3>
              <p className="text-sm leading-relaxed mb-4">
                The system implements a <strong>two-tier security model</strong> with role-based access control and explicit permissions. Admin 
                users have full access to all features and data. Regular users can only view and edit their own tasks. The permission system 
                checks user status, role, and explicit permissions before allowing any operation.
              </p>
              <p className="text-sm leading-relaxed mb-4">
                <strong>Data isolation</strong> ensures users only see their own tasks unless they are admins. Task queries automatically filter 
                by user ID for regular users, while admin queries return all tasks. This isolation is enforced both client-side and server-side 
                through Firestore security rules, providing double-layer protection.
              </p>
                </div>
                
            <div>
              <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Week Calculation & Time Tracking</h3>
              <p className="text-sm leading-relaxed mb-4">
                The system calculates <strong>weeks within months</strong> considering only weekdays (Monday through Friday). This ensures accurate 
                weekly reporting that reflects actual working days. Week numbers are assigned sequentially, and tasks can be filtered by week to 
                analyze weekly performance patterns.
              </p>
              <p className="text-sm leading-relaxed">
                All time calculations maintain precision by working in minutes as the base unit, then converting to hours or days for display. 
                This prevents rounding errors and ensures accurate time tracking across deliverables, tasks, and analytics.
              </p>
                </div>
              </div>
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


