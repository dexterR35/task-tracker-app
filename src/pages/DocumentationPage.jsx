import React, { useState } from 'react';
import { Icons } from '@/components/icons';

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('taskform');

  const tabs = [
    {
      id: 'taskform',
      name: 'Task Form',
      icon: Icons.generic.document,
      description: 'Task form architecture and logic'
    },
    {
      id: 'monthlogic',
      name: 'Month Logic',
      icon: Icons.generic.calendar,
      description: 'Month-based organization system, permissions RBAC, generated board'
    },
    {
      id: 'deliverables',
      name: 'Deliverables',
      icon: Icons.generic.package,
      description: 'Deliverables management system'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: Icons.generic.chart,
      description: 'Analytics and reporting architecture, calculation logic, flow, basic, calculation cards'
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: Icons.generic.deliverable,
      description: 'Card components and layouts'
    },
    {
      id: 'colorsystem',
      name: 'Color System',
      icon: Icons.generic.design,
      description: 'Design system colors and theming'
    },
    {
      id: 'architecture',
      name: 'Architecture',
      icon: Icons.generic.settings,
      description: 'Database structure, Redux state management, system architecture'
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'taskform':
        return <TaskFormDocumentation />;
      case 'monthlogic':
        return <MonthLogicDocumentation />;
      case 'deliverables':
        return <DeliverablesDocumentation />;
      case 'analytics':
        return <AnalyticsDocumentation />;
      case 'cards':
        return <CardsDocumentation />;
      case 'colorsystem':
        return <ColorSystemDocumentation />;
      case 'architecture':
        return <ArchitectureDocumentation />;
      default:
        return <TaskFormDocumentation />;
    }
  };

  return (
    <div className="p-6  mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Learn how to use Sync's features and understand the system architecture
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {renderTabContent()}
      </div>
    </div>
  );
};

const TaskFormDocumentation = () => {
  return (
    <div className="p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-2xl font-bold mb-6">Task Form Architecture and Logic</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This document explains how Sync task forms work, focusing on the smart form system that adapts to user needs and provides intelligent validation. The forms change based on user selections to make task tracking easier and more accurate.
          </p>
        </div>

        <div className="space-y-8">
          {/* Dynamic Form System */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Dynamic Form System</h2>
            <p className="mb-4">
              Sync task forms are smart and adapt in real-time based on user selections. This dynamic behavior creates a smooth user experience that reduces confusion and prevents form errors.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Real-time Adaptation</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Fields appear and disappear instantly based on user selections</li>
                  <li>• Form validation rules change dynamically as fields become relevant</li>
                  <li>• Unrelated fields are automatically cleared when conditions change</li>
                  <li>• Form state is maintained consistently across all field changes</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">User Experience Benefits</h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• Users only see fields that are relevant to their current selections</li>
                  <li>• Impossible field combinations are prevented by hiding irrelevant options</li>
                  <li>• The form guides users through a logical sequence of decisions</li>
                  <li>• Users see the impact of their choices instantly</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Form Field Categories */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Form Field Categories</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg mb-4">Core Fields (Always Required)</h3>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Jira Link Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Links tasks to their corresponding Jira tickets for project management integration</li>
                      <li>• <strong>Validation:</strong> Must match the exact Jira URL format (https://gmrd.atlassian.net/browse/PROJECT-NUMBER)</li>
                      <li>• <strong>Data Processing:</strong> Automatically extracts the task name (e.g., "GIMODEAR-124124") from the URL</li>
                      <li>• <strong>Error Handling:</strong> Provides clear error messages for invalid URL formats</li>
                      <li>• <strong>User Experience:</strong> Includes placeholder text showing the expected format</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Products Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Categorizes tasks by the product they relate to</li>
                      <li>• <strong>Data Source:</strong> Loaded from application constants and can be updated by administrators</li>
                      <li>• <strong>Validation:</strong> Must select exactly one product from the available list</li>
                      <li>• <strong>User Experience:</strong> Dropdown selection with search functionality for large lists</li>
                      <li>• <strong>Data Storage:</strong> Stored as a string value in lowercase for consistency</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Department Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Organizes tasks by the department responsible for the work</li>
                      <li>• <strong>Data Source:</strong> Loaded from application constants</li>
                      <li>• <strong>Validation:</strong> Must select exactly one department</li>
                      <li>• <strong>Cascading Effect:</strong> Changing the department clears deliverable selections to prevent mismatches</li>
                      <li>• <strong>User Experience:</strong> Dropdown selection with clear department names</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Markets Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Identifies which markets the task affects or targets</li>
                      <li>• <strong>Data Source:</strong> Loaded from application constants</li>
                      <li>• <strong>Validation:</strong> Must select at least one market, multiple selections allowed</li>
                      <li>• <strong>Data Storage:</strong> Stored as an array of selected market values</li>
                      <li>• <strong>User Experience:</strong> Multi-select dropdown with checkboxes for easy selection</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Date Range Fields</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Start Date:</strong> The date when work on the task began</li>
                      <li>• <strong>End Date:</strong> The date when work on the task was completed</li>
                      <li>• <strong>Validation:</strong> End date must be after start date, both must be within the current month</li>
                      <li>• <strong>Format:</strong> YYYY-MM-DD format with date picker interface</li>
                      <li>• <strong>Data Processing:</strong> Converted to ISO format for database storage</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Total Time Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Records the total hours spent on the task</li>
                      <li>• <strong>Validation:</strong> Must be in 0.5 hour increments (0.5, 1.0, 1.5, 2.0, etc.)</li>
                      <li>• <strong>Range:</strong> Minimum 0.5 hours, maximum 999 hours</li>
                      <li>• <strong>User Experience:</strong> Number input with step controls and clear validation messages</li>
                      <li>• <strong>Data Processing:</strong> Stored as a decimal number for calculations</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Reporter Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Identifies who is reporting or submitting the task</li>
                      <li>• <strong>Data Source:</strong> Dynamically loaded from the user database</li>
                      <li>• <strong>Validation:</strong> Must select exactly one reporter</li>
                      <li>• <strong>User Experience:</strong> Searchable dropdown with reporter names and details</li>
                      <li>• <strong>Data Processing:</strong> Stores both reporter ID and name for reference</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-lg mb-4">Conditional Fields (Appear Based on Checkboxes)</h3>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Deliverables Section</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Trigger:</strong> "Has Deliverables" checkbox</li>
                      <li>• <strong>Purpose:</strong> Tracks what deliverables were created as part of the task</li>
                      <li>• <strong>Data Source:</strong> Filtered by selected department to show relevant deliverables</li>
                      <li>• <strong>Validation:</strong> Required when checkbox is checked, must select at least one deliverable</li>
                      <li>• <strong>Additional Features:</strong> Supports quantity tracking and variation management</li>
                      <li>• <strong>Data Processing:</strong> Stored as structured arrays with quantities and variations</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">AI Tools Section</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Trigger:</strong> "AI Tools Used" checkbox</li>
                      <li>• <strong>Purpose:</strong> Tracks AI tools and time spent using them</li>
                      <li>• <strong>AI Models Field:</strong> Multi-select field for AI tools used (ChatGPT, Claude, etc.)</li>
                      <li>• <strong>AI Time Field:</strong> Number field for time spent on AI tools (0.5 hour increments)</li>
                      <li>• <strong>Validation:</strong> Both fields required when checkbox is checked</li>
                      <li>• <strong>Data Processing:</strong> Stored as structured arrays with models and time</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg mb-4">Additional Fields</h3>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">VIP Task Checkbox</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Marks high-priority or important tasks for special handling</li>
                      <li>• <strong>Usage:</strong> Used for filtering, reporting, and prioritization</li>
                      <li>• <strong>Data Storage:</strong> Boolean value (true/false)</li>
                      <li>• <strong>User Experience:</strong> Simple checkbox with clear labeling</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Reworked Checkbox</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Indicates if the task required rework or revisions</li>
                      <li>• <strong>Usage:</strong> Used for quality tracking and process improvement</li>
                      <li>• <strong>Data Storage:</strong> Boolean value (true/false)</li>
                      <li>• <strong>User Experience:</strong> Simple checkbox with clear labeling</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">Observations Field</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• <strong>Purpose:</strong> Allows users to add additional notes or context about the task</li>
                      <li>• <strong>Validation:</strong> Optional field with 300 character limit</li>
                      <li>• <strong>Data Processing:</strong> Trimmed and sanitized before storage</li>
                      <li>• <strong>User Experience:</strong> Textarea with character counter and placeholder text</li>
                      <li>• <strong>Data Storage:</strong> Only stored if not empty to keep database clean</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Validation System */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Form Validation System</h2>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Jira Link Validation</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  Sync implements strict validation for Jira links to ensure data integrity and proper integration:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Format Validation</h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• <strong>URL Pattern:</strong> Must match the exact pattern `https://gmrd.atlassian.net/browse/PROJECT-NUMBER`</li>
                      <li>• <strong>Project Code:</strong> Must contain a valid project code (letters and numbers)</li>
                      <li>• <strong>Ticket Number:</strong> Must contain a numeric ticket identifier</li>
                      <li>• <strong>Length Limits:</strong> Maximum 200 characters to prevent extremely long URLs</li>
                      <li>• <strong>Protocol Check:</strong> Must use HTTPS protocol for security</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Data Processing</h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• <strong>Task Name Extraction:</strong> Automatically extracts the task identifier (e.g., "GIMODEAR-124124")</li>
                      <li>• <strong>Uppercase Conversion:</strong> Converts task names to uppercase for consistency</li>
                      <li>• <strong>URL Removal:</strong> Removes the original URL after extracting the task name</li>
                      <li>• <strong>Validation Confirmation:</strong> Confirms the extracted task name is valid</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">Time Field Validation</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  Sync enforces strict time validation to ensure accurate time tracking:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Increment Validation</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>0.5 Hour Steps:</strong> All time entries must be in 0.5 hour increments (0, 0.5, 1.0, 1.5, 2.0, etc.)</li>
                      <li>• <strong>Mathematical Check:</strong> Uses modulo operation to verify increment compliance</li>
                      <li>• <strong>Custom Error Messages:</strong> Shows specific error messages with examples of valid increments</li>
                      <li>• <strong>Real-time Feedback:</strong> Validates as users type to prevent invalid entries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Range Validation</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>Minimum Value:</strong> Must be at least 0.5 hours (prevents zero or negative time)</li>
                      <li>• <strong>Maximum Value:</strong> Cannot exceed 999 hours (prevents unrealistic entries)</li>
                      <li>• <strong>Decimal Precision:</strong> Supports decimal values up to one decimal place</li>
                      <li>• <strong>Type Validation:</strong> Ensures the input is a valid number</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-4">Date Field Validation</h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                  Sync provides comprehensive date validation to ensure logical consistency:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Format Validation</h4>
                    <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                      <li>• <strong>YYYY-MM-DD Format:</strong> Must follow the exact date format specification</li>
                      <li>• <strong>Date Validity:</strong> Checks that the date is a valid calendar date</li>
                      <li>• <strong>Leap Year Handling:</strong> Properly handles leap years and month boundaries</li>
                      <li>• <strong>Timezone Awareness:</strong> Uses consistent timezone handling for all date operations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Logical Validation</h4>
                    <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                      <li>• <strong>Start Date Check:</strong> Start date must be a valid date within the current month</li>
                      <li>• <strong>End Date Check:</strong> End date must be a valid date within the current month</li>
                      <li>• <strong>Date Relationship:</strong> End date must be on or after the start date</li>
                      <li>• <strong>Month Boundaries:</strong> Both dates must fall within the current month's boundaries</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Checkbox Logic */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Checkbox Logic System</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Has Deliverables Checkbox</h3>
                  <ul className="text-sm space-y-1">
                    <li>• <span className="font-medium">When checked:</span> Shows deliverable selection field and makes it required</li>
                    <li>• <span className="font-medium">When unchecked:</span> Hides deliverable field and clears any selected values</li>
                    <li>• Automatically clears deliverable data when unchecked</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">AI Tools Used Checkbox</h3>
                  <ul className="text-sm space-y-1">
                    <li>• <span className="font-medium">When checked:</span> Shows AI models and AI time fields, makes them required</li>
                    <li>• <span className="font-medium">When unchecked:</span> Hides AI fields and sets AI time to 0</li>
                    <li>• Automatically clears AI data when unchecked</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sanitization */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Data Sanitization</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Text Field Sanitization</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>HTML Stripping:</strong> Removes all HTML tags and scripts from text inputs</li>
                  <li>• <strong>XSS Prevention:</strong> Escapes special characters that could be used for cross-site scripting</li>
                  <li>• <strong>Length Trimming:</strong> Automatically trims whitespace and enforces character limits</li>
                  <li>• <strong>Encoding Normalization:</strong> Converts all text to UTF-8 encoding for consistency</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Numeric Field Sanitization</h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• <strong>Type Validation:</strong> Ensures numeric fields contain only valid numbers</li>
                  <li>• <strong>Range Validation:</strong> Enforces minimum and maximum value constraints</li>
                  <li>• <strong>Decimal Precision:</strong> Limits decimal places to prevent precision errors</li>
                  <li>• <strong>Format Standardization:</strong> Converts all numbers to consistent decimal format</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">URL Field Sanitization</h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• <strong>Protocol Validation:</strong> Ensures URLs use HTTPS protocol for security</li>
                  <li>• <strong>Domain Whitelisting:</strong> Validates that URLs come from approved domains</li>
                  <li>• <strong>Parameter Cleaning:</strong> Removes potentially malicious query parameters</li>
                  <li>• <strong>Length Limits:</strong> Prevents extremely long URLs that could cause issues</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Date Field Sanitization</h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• <strong>Format Validation:</strong> Ensures dates follow YYYY-MM-DD format</li>
                  <li>• <strong>Range Checking:</strong> Validates dates are within reasonable time ranges</li>
                  <li>• <strong>Timezone Normalization:</strong> Converts all dates to consistent timezone</li>
                  <li>• <strong>Leap Year Handling:</strong> Properly handles edge cases in date calculations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Badge System */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Badge System</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Form Status Badges</h3>
                <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                  <li>• <strong>Draft Badge:</strong> Shows when form has unsaved changes</li>
                  <li>• <strong>Valid Badge:</strong> Indicates when all required fields are properly filled</li>
                  <li>• <strong>Error Badge:</strong> Highlights fields with validation errors</li>
                  <li>• <strong>Loading Badge:</strong> Shows when form is processing or saving data</li>
                </ul>
              </div>
              
              <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">Field Status Badges</h3>
                <ul className="text-sm text-pink-800 dark:text-pink-200 space-y-1">
                  <li>• <strong>Required Badge:</strong> Marks fields that must be completed</li>
                  <li>• <strong>Optional Badge:</strong> Shows fields that are not mandatory</li>
                  <li>• <strong>Conditional Badge:</strong> Indicates fields that appear based on other selections</li>
                  <li>• <strong>Validated Badge:</strong> Shows when a field has passed all validation checks</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Batch Operations */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Batch Operations</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">Batch Form Submission</h3>
                <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                  <li>• <strong>Multiple Tasks:</strong> Create multiple tasks in a single operation</li>
                  <li>• <strong>Bulk Updates:</strong> Update multiple tasks simultaneously</li>
                  <li>• <strong>Batch Validation:</strong> Validate all tasks before submission</li>
                  <li>• <strong>Error Handling:</strong> Process errors for individual items in batch</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Performance Optimization</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <li>• <strong>Chunked Processing:</strong> Handle large batches in smaller chunks</li>
                  <li>• <strong>Progress Tracking:</strong> Show progress for long-running batch operations</li>
                  <li>• <strong>Memory Management:</strong> Optimize memory usage for large datasets</li>
                  <li>• <strong>Background Processing:</strong> Run batch operations without blocking the UI</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Caching and RTK Query */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Caching and RTK Query Integration</h2>
            
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">RTK Query Caching System</h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-4">
                  Sync forms use RTK Query for intelligent data caching and state management, providing optimal performance and user experience:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Form Data Caching</h4>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                      <li>• <strong>Draft Persistence:</strong> Form data is automatically cached to prevent data loss</li>
                      <li>• <strong>Session Storage:</strong> Form state persists across browser sessions</li>
                      <li>• <strong>Auto-Save:</strong> Form changes are automatically saved to cache every few seconds</li>
                      <li>• <strong>Recovery:</strong> Users can recover unsaved form data after browser crashes</li>
                      <li>• <strong>Conflict Resolution:</strong> Handles simultaneous edits with proper conflict resolution</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">API Response Caching</h4>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                      <li>• <strong>Smart Invalidation:</strong> Cache is automatically updated when data changes</li>
                      <li>• <strong>Background Refetching:</strong> Updates data in the background without blocking UI</li>
                      <li>• <strong>Request Deduplication:</strong> Prevents multiple identical requests from running simultaneously</li>
                      <li>• <strong>Optimistic Updates:</strong> UI updates immediately while API request is in progress</li>
                      <li>• <strong>Error Recovery:</strong> Automatically retries failed requests with exponential backoff</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">Data Preparation and Processing</h3>
                <p className="text-sm text-teal-800 dark:text-teal-200 mb-4">
                  Sync forms implement sophisticated data preparation to ensure clean, consistent data before submission:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Pre-Submission Processing</h4>
                    <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                      <li>• <strong>Data Normalization:</strong> Converts all form data to consistent formats</li>
                      <li>• <strong>Type Conversion:</strong> Ensures proper data types (strings, numbers, booleans)</li>
                      <li>• <strong>Field Mapping:</strong> Maps form fields to database schema requirements</li>
                      <li>• <strong>Conditional Data:</strong> Processes conditional fields based on checkbox states</li>
                      <li>• <strong>Validation Pass:</strong> Runs final validation before data preparation</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Data Transformation</h4>
                    <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                      <li>• <strong>Jira Link Processing:</strong> Extracts task names and converts to uppercase</li>
                      <li>• <strong>Date Formatting:</strong> Converts dates to ISO format for database storage</li>
                      <li>• <strong>Array Processing:</strong> Handles multi-select fields and converts to arrays</li>
                      <li>• <strong>Nested Objects:</strong> Creates structured objects for complex data relationships</li>
                      <li>• <strong>Metadata Addition:</strong> Adds timestamps, user info, and system metadata</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">Cache Management Strategies</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  Sync implements intelligent cache management to optimize performance and memory usage:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Cache Tags and Invalidation</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>Tagged Caching:</strong> Uses tags to organize cached data by type and ID</li>
                      <li>• <strong>Selective Invalidation:</strong> Only invalidates related cache entries when data changes</li>
                      <li>• <strong>Cross-Reference Updates:</strong> Updates related data automatically</li>
                      <li>• <strong>Hierarchical Tags:</strong> Supports nested tag relationships for complex dependencies</li>
                      <li>• <strong>TTL Management:</strong> Different data types have different cache expiration times</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Performance Optimization</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>Memory Management:</strong> Automatically removes old cache entries to prevent memory leaks</li>
                      <li>• <strong>Size Limits:</strong> Prevents cache from consuming too much memory</li>
                      <li>• <strong>Offline Support:</strong> Cache persists across browser sessions for offline functionality</li>
                      <li>• <strong>Background Sync:</strong> Updates happen in the background without interrupting workflows</li>
                      <li>• <strong>Error Recovery:</strong> Failed updates are retried automatically with exponential backoff</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-4">Real-Time Data Synchronization</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                  Sync forms maintain real-time synchronization between cache, form state, and database:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Live Updates</h4>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                      <li>• <strong>Instant Updates:</strong> Form changes are reflected immediately in cache</li>
                      <li>• <strong>Multi-User Sync:</strong> Changes from other users are synchronized in real-time</li>
                      <li>• <strong>Conflict Detection:</strong> Identifies and resolves conflicts when multiple users edit simultaneously</li>
                      <li>• <strong>State Consistency:</strong> Maintains consistent state across all form components</li>
                      <li>• <strong>Event Broadcasting:</strong> Notifies all components when data changes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Data Flow Management</h4>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                      <li>• <strong>Bidirectional Sync:</strong> Data flows both ways between form and database</li>
                      <li>• <strong>Change Tracking:</strong> Tracks what data has changed to optimize updates</li>
                      <li>• <strong>Batch Operations:</strong> Groups multiple changes for efficient processing</li>
                      <li>• <strong>Rollback Support:</strong> Can undo changes if errors occur</li>
                      <li>• <strong>Audit Trail:</strong> Maintains history of all data changes for debugging</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">What Makes Sync Forms Special</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Dynamic Form System", desc: "Automatically adapts to user selections and provides real-time validation" },
                { title: "Checkbox Logic", desc: "Controls form behavior and data processing intelligently" },
                { title: "Number Extraction", desc: "Handles various numeric formats and validates time increments" },
                { title: "Smart Validation", desc: "Provides immediate feedback and prevents errors before they happen" },
                { title: "Data Processing", desc: "Converts form input into clean, consistent database format" },
                { title: "User Experience", desc: "Reduces complexity by showing only relevant fields" },
                { title: "Error Prevention", desc: "Prevents impossible field combinations and invalid data entry" },
                { title: "Real-time Updates", desc: "Form state changes instantly based on user interactions" },
                { title: "Data Sanitization", desc: "Comprehensive security and data integrity protection" },
                { title: "Badge System", desc: "Visual feedback for form state and data quality" },
                { title: "Batch Operations", desc: "Efficient bulk processing for multiple tasks" },
                { title: "CRUD Operations", desc: "Complete task lifecycle management" },
                { title: "Error Processing", desc: "Sophisticated error handling and recovery" },
                { title: "Submit Process", desc: "Structured multi-step submission with validation" },
                { title: "Real-Time Features", desc: "Live collaboration and auto-save capabilities" },
                { title: "RTK Query Caching", desc: "Intelligent data caching and state management" },
                { title: "Data Preparation", desc: "Sophisticated pre-submission data processing" },
                { title: "Cache Management", desc: "Optimized cache strategies for performance" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const MonthLogicDocumentation = () => {
  return (
    <div className="p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-2xl font-bold mb-6">Month Logic Analysis</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This document explains how Sync task tracker app works, focusing on the month-based organization system. The system organizes all work by months and provides organized workspaces for task tracking with proper user permissions and real-time updates.
          </p>
        </div>

        <div className="space-y-8">
          {/* Month Structure and Organization */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Month Structure and Organization</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Database Structure</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Sync organizes data in a clear order: Department → Year → Month → Tasks. This structure creates a logical flow that makes it easy to find information.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Hierarchy Levels</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Department Level:</strong> All data organized under "design" department</li>
                      <li>• <strong>Year Level:</strong> Data organized by year (2025, 2026, etc.)</li>
                      <li>• <strong>Month Level:</strong> Individual month documents as "boards" or workspaces</li>
                      <li>• <strong>Task Level:</strong> Subcollection called "taskdata" with individual tasks</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Benefits</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Easy Navigation:</strong> Users can quickly find tasks by month</li>
                      <li>• <strong>Data Isolation:</strong> Each month's data is separate</li>
                      <li>• <strong>Scalability:</strong> Handles many years of data efficiently</li>
                      <li>• <strong>Security:</strong> Access controlled at different hierarchy levels</li>
                      <li>• <strong>Backup and Recovery:</strong> Individual months can be backed up independently</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Month ID Format</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Every month gets a unique identifier following the YYYY-MM format, such as "2025-01" for January 2025, "2025-12" for December 2025, etc.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Format Validation Rules</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Year Range:</strong> Years must be between 1900 and 2100</li>
                      <li>• <strong>Month Range:</strong> Months must be between 01 and 12</li>
                      <li>• <strong>Format Check:</strong> Uses regex pattern matching</li>
                      <li>• <strong>Uniqueness:</strong> Each month ID is unique within its year</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Benefits of This Format</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Sortable:</strong> Naturally sorts chronologically in database queries</li>
                      <li>• <strong>Human Readable:</strong> Users easily understand which month</li>
                      <li>• <strong>Database Friendly:</strong> Works well with Firestore indexing</li>
                      <li>• <strong>Consistent:</strong> Same format used throughout application</li>
                      <li>• <strong>Future Proof:</strong> Can handle dates far into the future</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Month Board Generation */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Month Board Generation</h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">Why Month Boards Are Required</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  Sync requires "month boards" to be created before anyone can add tasks to that month. Think of a month board as a workspace that needs to be set up first.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                    <li>• <strong>Data Organization:</strong> Ensures all tasks are properly organized within defined time periods</li>
                    <li>• <strong>Access Control:</strong> Gives administrators control over which months are available</li>
                    <li>• <strong>Data Integrity:</strong> Prevents tasks from being created in invalid time periods</li>
                  </ul>
                  <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                    <li>• <strong>Resource Management:</strong> Allows administrators to manage system resources</li>
                    <li>• <strong>Audit Trail:</strong> Provides clear records of when and by whom each month was set up</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Month Board Components</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  Each month board contains essential metadata that the system needs to function properly:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• <strong>Board ID:</strong> A unique identifier that distinguishes this month board</li>
                    <li>• <strong>Month ID:</strong> The YYYY-MM format identifier for the month</li>
                    <li>• <strong>Year ID:</strong> The year component for database organization</li>
                    <li>• <strong>Start Date:</strong> The exact start date of the month (first day)</li>
                  </ul>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• <strong>End Date:</strong> The exact end date of the month (last day)</li>
                    <li>• <strong>Days in Month:</strong> The total number of days in the month</li>
                    <li>• <strong>Creation Metadata:</strong> Who created the board, when it was created</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Admin vs User Roles */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Admin vs User Roles</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-4">Administrator Capabilities</h3>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• <strong>Month Board Management:</strong> Create, update, and manage month boards for any month</li>
                  <li>• <strong>Full Data Access:</strong> View all tasks across all months and all users</li>
                  <li>• <strong>User Management:</strong> Access user data and manage user permissions</li>
                  <li>• <strong>System Oversight:</strong> Monitor system usage, performance, and data integrity</li>
                  <li>• <strong>Data Export:</strong> Export data for reporting and analysis purposes</li>
                  <li>• <strong>Configuration Management:</strong> Modify system settings and configurations</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Regular User Capabilities</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>Task Management:</strong> Create, edit, and delete their own tasks</li>
                  <li>• <strong>Month Access:</strong> Work only in months that have existing boards</li>
                  <li>• <strong>Data Viewing:</strong> View only their own tasks and related data</li>
                  <li>• <strong>Form Usage:</strong> Use all form features and conditional logic</li>
                  <li>• <strong>Limited Reporting:</strong> Access basic reports for their own work</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Month Board Creation Process */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Month Board Creation Process</h2>
            
            <div className="space-y-4">
              {[
                {
                  step: "Step 1: Validation and Permission Check",
                  items: [
                    "Verifies that the user has administrator privileges",
                    "Checks that the month ID format is valid",
                    "Ensures the month doesn't already have a board",
                    "Validates that the user has permission to create boards"
                  ]
                },
                {
                  step: "Step 2: Board ID Generation",
                  items: [
                    "Creates a unique board ID using the format: {monthId}_{timestamp}_{randomString}",
                    "The timestamp ensures uniqueness even if multiple boards are created simultaneously",
                    "The random string provides additional uniqueness and security",
                    "Example: \"2025-01_1704067200000_a7b9c2d4e\""
                  ]
                },
                {
                  step: "Step 3: Metadata Collection",
                  items: [
                    "Calculates the exact start date of the month (first day at 00:00:00)",
                    "Calculates the exact end date of the month (last day at 23:59:59)",
                    "Determines the total number of days in the month",
                    "Records the current user's information (UID, name, role)"
                  ]
                },
                {
                  step: "Step 4: Database Storage",
                  items: [
                    "Creates the month document in the appropriate year collection",
                    "Stores all metadata including creation timestamps",
                    "Sets up the taskdata subcollection for future tasks",
                    "Updates cache and triggers real-time updates"
                  ]
                },
                {
                  step: "Step 5: System Updates",
                  items: [
                    "Updates the available months list for all users",
                    "Refreshes the current month data if applicable",
                    "Sends notifications to relevant users",
                    "Logs the creation event for audit purposes"
                  ]
                }
              ].map((step, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{step.step}</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {step.items.map((item, itemIndex) => (
                      <li key={itemIndex}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Month Data Fetching and Caching */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Month Data Fetching and Caching</h2>
            
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">How Month Data is Retrieved</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Current Month Retrieval</h4>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                      <li>• <strong>Purpose:</strong> Gets the current month's data when the application loads</li>
                      <li>• <strong>Process:</strong> Automatically determines the current month based on system date</li>
                      <li>• <strong>Data Included:</strong> Month ID, month name, start/end dates, days in month, board existence status</li>
                      <li>• <strong>Optimization:</strong> Single database query that fetches all current month information at once</li>
                      <li>• <strong>Caching:</strong> Results are cached to prevent repeated database calls</li>
                      <li>• <strong>Real-time Updates:</strong> Automatically refreshes when the month changes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">Available Months Listing</h4>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                      <li>• <strong>Purpose:</strong> Provides a list of all months that have boards for dropdown selection</li>
                      <li>• <strong>Process:</strong> Queries all month documents in the current year</li>
                      <li>• <strong>Data Included:</strong> Month ID, month name, board ID, creation details, current month indicator</li>
                      <li>• <strong>Sorting:</strong> Automatically sorts months with newest first</li>
                      <li>• <strong>Filtering:</strong> Only includes months that have existing boards</li>
                      <li>• <strong>Performance:</strong> Uses efficient database queries with proper indexing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">Caching System</h3>
                <p className="text-sm text-teal-800 dark:text-teal-200 mb-4">
                  Sync uses a sophisticated caching system built on RTK Query to optimize performance and reduce database load:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">RTK Query Caching</h4>
                    <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                      <li>• <strong>Memory Storage:</strong> Stores frequently accessed data in browser memory</li>
                      <li>• <strong>Automatic Invalidation:</strong> Cache is automatically updated when data changes</li>
                      <li>• <strong>Background Refetching:</strong> Updates data in the background without blocking UI</li>
                      <li>• <strong>Selective Caching:</strong> Only caches data that's likely to be accessed again</li>
                      <li>• <strong>Memory Management:</strong> Automatically removes old cache entries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Cache Tags System</h4>
                    <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                      <li>• <strong>Organized Structure:</strong> Uses tags to organize cached data by type and ID</li>
                      <li>• <strong>Smart Invalidation:</strong> When data changes, only related cache entries are invalidated</li>
                      <li>• <strong>Cross-Reference Updates:</strong> Updates to month data automatically refresh related task data</li>
                      <li>• <strong>Hierarchical Tags:</strong> Supports nested tag relationships for complex data dependencies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Month Utilities and Components */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Month Utilities and Components</h2>
            
            <div className="space-y-6">
              <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-4">Current Month Information</h3>
                <p className="text-sm text-pink-800 dark:text-pink-200 mb-4">
                  The system automatically determines the current month and provides all necessary details for application functionality:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-pink-900 dark:text-pink-100 mb-2">Automatic Detection</h4>
                    <ul className="text-sm text-pink-800 dark:text-pink-200 space-y-1">
                      <li>• Uses the system's current date to determine the active month</li>
                      <li>• Handles timezone considerations to ensure accuracy across different locations</li>
                      <li>• Updates automatically when the month changes (at midnight)</li>
                      <li>• Provides fallback mechanisms for edge cases like month transitions</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-pink-900 dark:text-pink-100 mb-2">Data Provided</h4>
                    <ul className="text-sm text-pink-800 dark:text-pink-200 space-y-1">
                      <li>• <strong>Month ID:</strong> The YYYY-MM format identifier for the current month</li>
                      <li>• <strong>Month Name:</strong> Human-readable month name (e.g., "January 2025")</li>
                      <li>• <strong>Year and Month Numbers:</strong> Separate numeric values for calculations</li>
                      <li>• <strong>Start Date:</strong> The exact first day of the month with time set to 00:00:00</li>
                      <li>• <strong>End Date:</strong> The exact last day of the month with time set to 23:59:59</li>
                      <li>• <strong>Total Days:</strong> The number of days in the month (handles leap years automatically)</li>
                      <li>• <strong>Board Status:</strong> Whether a month board exists for the current month</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-4">Month Progress Tracking</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                  The system calculates and displays month progress to help users understand their time constraints:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Progress Calculation</h4>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                      <li>• Determines the current day within the month</li>
                      <li>• Calculates the percentage of days that have passed</li>
                      <li>• Shows remaining days until the month ends</li>
                      <li>• Updates automatically as days pass</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Progress Display</h4>
                    <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                      <li>• <strong>Percentage Complete:</strong> Shows how much of the month has elapsed (0-100%)</li>
                      <li>• <strong>Days Passed:</strong> The actual number of days that have passed</li>
                      <li>• <strong>Days Remaining:</strong> How many days are left in the month</li>
                      <li>• <strong>Total Days:</strong> The complete number of days in the month</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Visual Month Components */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Visual Month Components</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-4">Month Progress Bar</h3>
                <p className="text-sm text-cyan-800 dark:text-cyan-200 mb-4">
                  A sophisticated visual component that provides immediate feedback about month progress:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-cyan-900 dark:text-cyan-100 mb-1">Visual Design</h4>
                    <ul className="text-sm text-cyan-800 dark:text-cyan-200 space-y-1">
                      <li>• <strong>Gradient Colors:</strong> Uses blue gradient for current month, green for completed months</li>
                      <li>• <strong>Animated Progress:</strong> Smooth transitions when progress updates</li>
                      <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes and themes</li>
                      <li>• <strong>Accessibility:</strong> Includes proper ARIA labels and color contrast</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-cyan-900 dark:text-cyan-100 mb-1">Information Display</h4>
                    <ul className="text-sm text-cyan-800 dark:text-cyan-200 space-y-1">
                      <li>• <strong>Progress Bar:</strong> Visual representation of month completion percentage</li>
                      <li>• <strong>Numerical Data:</strong> Shows exact days passed and remaining</li>
                      <li>• <strong>Time Indicators:</strong> Displays both percentage and absolute values</li>
                      <li>• <strong>Status Icons:</strong> Uses clock icons to indicate time-related information</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-4">Month Board Banner</h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                  An intelligent component that appears when month boards don't exist and guides users through board creation:
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">Conditional Display</h4>
                    <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                      <li>• Only appears when no month board exists for the current month</li>
                      <li>• Automatically hides when a board is created</li>
                      <li>• Shows different messages for different user roles</li>
                      <li>• Provides context-specific guidance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">Functionality</h4>
                    <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
                      <li>• <strong>One-Click Creation:</strong> Administrators can create boards with a single click</li>
                      <li>• <strong>Permission Validation:</strong> Checks user permissions before showing creation options</li>
                      <li>• <strong>Error Handling:</strong> Provides clear error messages if creation fails</li>
                      <li>• <strong>Real-time Updates:</strong> Automatically updates when board creation succeeds</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key System Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">What Makes Sync Month System Special</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Month Board System", desc: "Creates organized workspaces for each month with admin control" },
                { title: "Real-time Updates", desc: "Keeps all users synchronized with instant data updates" },
                { title: "Performance Optimization", desc: "Uses smart caching and efficient data handling" },
                { title: "User Permissions", desc: "Clear separation between admin and user capabilities" },
                { title: "Data Integrity", desc: "Maintains clean, consistent data structure throughout the system" },
                { title: "Date Handling", desc: "Consistent date operations across timezones and formats" },
                { title: "Caching System", desc: "Smart caching with request deduplication for better performance" },
                { title: "Month Utilities", desc: "Tools for month progress tracking and boundary calculations" },
                { title: "Hierarchical Organization", desc: "Clear Department → Year → Month → Tasks structure" },
                { title: "Month ID Format", desc: "YYYY-MM format that's sortable and human-readable" },
                { title: "Board Creation Process", desc: "Structured 5-step process for creating month boards" },
                { title: "Visual Components", desc: "Progress bars and banners for better user experience" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* RBAC Permissions */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">RBAC Permissions System</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">User Roles</h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                  <li><strong>Admin:</strong> Full system access and management</li>
                  <li><strong>User:</strong> Standard user with limited permissions</li>
                  <li><strong>Reporter:</strong> Can view and report on tasks</li>
                  <li><strong>Viewer:</strong> Read-only access to data</li>
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Permission Levels</h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
                  <li><strong>Create:</strong> Add new tasks and data</li>
                  <li><strong>Read:</strong> View existing data</li>
                  <li><strong>Update:</strong> Modify existing data</li>
                  <li><strong>Delete:</strong> Remove data (admin only)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Generated Board */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generated Board System</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">Month Board Generation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Automatic Generation</h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Monthly board creation</li>
                    <li>• Task organization by month</li>
                    <li>• Progress tracking</li>
                    <li>• Analytics generation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Board Features</h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Real-time updates</li>
                    <li>• Export capabilities</li>
                    <li>• Progress visualization</li>
                    <li>• Team collaboration</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const DeliverablesDocumentation = () => {
  return (
    <div className="p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-2xl font-bold mb-6">Deliverables Architecture</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This document explains how Sync manages deliverables, including creation, organization, tracking, and integration with the task system. The deliverables system provides structured management of work outputs and their relationships to tasks.
          </p>
        </div>

        <div className="space-y-8">
          {/* Deliverables Management System */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Deliverables Management System</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Core Deliverables Features</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Sync provides a comprehensive deliverables management system that tracks work outputs and their relationships to tasks:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Deliverable Creation</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Form-Based Creation:</strong> Structured forms for creating new deliverables</li>
                      <li>• <strong>Department Filtering:</strong> Deliverables are filtered by department for relevance</li>
                      <li>• <strong>Validation Rules:</strong> Ensures all required fields are completed</li>
                      <li>• <strong>Duplicate Prevention:</strong> Prevents creation of duplicate deliverables</li>
                      <li>• <strong>Auto-Generation:</strong> Automatically generates unique IDs and timestamps</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Deliverable Organization</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Category Management:</strong> Organizes deliverables by type and purpose</li>
                      <li>• <strong>Department Association:</strong> Links deliverables to specific departments</li>
                      <li>• <strong>Hierarchical Structure:</strong> Supports parent-child relationships between deliverables</li>
                      <li>• <strong>Tagging System:</strong> Flexible tagging for easy searching and filtering</li>
                      <li>• <strong>Status Tracking:</strong> Tracks deliverable status throughout lifecycle</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Task Integration</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Deliverables are seamlessly integrated with the task system to provide complete work tracking:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Task-Deliverable Linking</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Multi-Select Integration:</strong> Tasks can be linked to multiple deliverables</li>
                      <li>• <strong>Conditional Display:</strong> Deliverable fields appear based on checkbox selection</li>
                      <li>• <strong>Quantity Tracking:</strong> Tracks quantities of deliverables per task</li>
                      <li>• <strong>Variation Management:</strong> Handles different variations of the same deliverable</li>
                      <li>• <strong>Real-time Updates:</strong> Changes are reflected immediately across the system</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Data Management</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Structured Storage:</strong> Deliverables stored as structured arrays with metadata</li>
                      <li>• <strong>Relationship Tracking:</strong> Maintains relationships between tasks and deliverables</li>
                      <li>• <strong>History Preservation:</strong> Keeps track of deliverable changes over time</li>
                      <li>• <strong>Audit Trail:</strong> Complete audit trail of all deliverable operations</li>
                      <li>• <strong>Data Integrity:</strong> Ensures data consistency across all operations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Deliverables Components */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Deliverables Components</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">DeliverableForm</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  A comprehensive form component for creating and editing deliverables:
                </p>
                
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• <strong>Dynamic Fields:</strong> Form fields adapt based on deliverable type</li>
                  <li>• <strong>Validation System:</strong> Real-time validation with clear error messages</li>
                  <li>• <strong>Auto-Save:</strong> Automatically saves form data to prevent loss</li>
                  <li>• <strong>Department Filtering:</strong> Shows only relevant deliverables for selected department</li>
                  <li>• <strong>Modal Interface:</strong> Clean modal interface for form interaction</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">DeliverableTable</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  A powerful table component for managing and viewing deliverables:
                </p>
                
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• <strong>Sortable Columns:</strong> All columns can be sorted for easy organization</li>
                  <li>• <strong>Filtering Options:</strong> Advanced filtering by department, status, and type</li>
                  <li>• <strong>Bulk Operations:</strong> Select and perform operations on multiple deliverables</li>
                  <li>• <strong>Export Functionality:</strong> Export deliverable data in various formats</li>
                  <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">What Makes Sync Deliverables Special</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Form Integration", desc: "Seamlessly integrated with task forms and conditional logic" },
                { title: "Department Filtering", desc: "Smart filtering based on department relevance" },
                { title: "Quantity Tracking", desc: "Tracks quantities and variations of deliverables" },
                { title: "Real-time Updates", desc: "Instant updates across all system components" },
                { title: "Data Integrity", desc: "Maintains consistent data structure and relationships" },
                { title: "Audit Trail", desc: "Complete history of all deliverable operations" },
                { title: "Bulk Operations", desc: "Efficient management of multiple deliverables" },
                { title: "Export Functionality", desc: "Export data in various formats for reporting" },
                { title: "Responsive Design", desc: "Works seamlessly across all device sizes" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const AnalyticsDocumentation = () => {
  return (
    <div className="p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-2xl font-bold mb-6">Analytics Architecture</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This document explains how Sync provides comprehensive analytics and reporting capabilities, including data visualization, performance metrics, and business intelligence features for tracking work progress and team productivity.
          </p>
        </div>

        <div className="space-y-8">
          {/* Analytics System Overview */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Analytics System Overview</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Core Analytics Features</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Sync provides powerful analytics capabilities to help teams understand their work patterns and improve productivity:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Data Collection</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Real-time Tracking:</strong> Collects data in real-time as users work</li>
                      <li>• <strong>Comprehensive Metrics:</strong> Tracks time, deliverables, AI usage, and more</li>
                      <li>• <strong>User Behavior:</strong> Monitors user interactions and work patterns</li>
                      <li>• <strong>Performance Data:</strong> Measures task completion rates and efficiency</li>
                      <li>• <strong>Quality Metrics:</strong> Tracks rework rates and deliverable quality</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Data Processing</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Aggregation:</strong> Combines data from multiple sources for analysis</li>
                      <li>• <strong>Filtering:</strong> Filters data by time periods, departments, and users</li>
                      <li>• <strong>Calculation:</strong> Performs complex calculations for metrics and KPIs</li>
                      <li>• <strong>Trend Analysis:</strong> Identifies patterns and trends over time</li>
                      <li>• <strong>Comparative Analysis:</strong> Compares performance across different periods</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Visualization Components</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Sync includes sophisticated visualization components to present analytics data in an intuitive way:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Chart Components</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Column Charts:</strong> Simple column charts for comparing values</li>
                      <li>• <strong>Pie Charts:</strong> Pie charts for showing proportions and distributions</li>
                      <li>• <strong>Line Charts:</strong> Line charts for showing trends over time</li>
                      <li>• <strong>Bar Charts:</strong> Horizontal bar charts for category comparisons</li>
                      <li>• <strong>Interactive Charts:</strong> Charts with hover effects and click interactions</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Analytics Cards</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Acquisition Analytics:</strong> Tracks user acquisition and engagement metrics</li>
                      <li>• <strong>Marketing Analytics:</strong> Monitors marketing campaign effectiveness</li>
                      <li>• <strong>Market Distribution:</strong> Shows market distribution and user demographics</li>
                      <li>• <strong>Performance Metrics:</strong> Displays key performance indicators</li>
                      <li>• <strong>Real-time Updates:</strong> Cards update automatically with new data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Tables */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Analytics Tables</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">AnalyticsTable</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  A comprehensive table component for displaying analytics data:
                </p>
                
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• <strong>Data Sorting:</strong> Sort by any column in ascending or descending order</li>
                  <li>• <strong>Advanced Filtering:</strong> Filter data by multiple criteria simultaneously</li>
                  <li>• <strong>Pagination:</strong> Handle large datasets with efficient pagination</li>
                  <li>• <strong>Export Options:</strong> Export data in CSV, Excel, and PDF formats</li>
                  <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes and orientations</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">MarketDistributionTable</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  Specialized table for displaying market distribution data:
                </p>
                
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• <strong>Market Analysis:</strong> Shows distribution across different markets</li>
                  <li>• <strong>User Demographics:</strong> Displays user distribution by market</li>
                  <li>• <strong>Performance Metrics:</strong> Shows performance indicators per market</li>
                  <li>• <strong>Trend Analysis:</strong> Tracks changes in market distribution over time</li>
                  <li>• <strong>Interactive Features:</strong> Click to drill down into specific market data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Analytics Helpers */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Analytics Helpers and Utilities</h2>
            
            <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">Analytics Helpers</h3>
              <p className="text-sm text-teal-800 dark:text-teal-200 mb-4">
                Sync includes utility functions and helpers to support analytics operations:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Data Processing</h4>
                  <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                    <li>• <strong>Data Aggregation:</strong> Combines and summarizes data from multiple sources</li>
                    <li>• <strong>Metric Calculations:</strong> Calculates KPIs, averages, and performance metrics</li>
                    <li>• <strong>Date Range Processing:</strong> Handles date-based filtering and grouping</li>
                    <li>• <strong>Statistical Analysis:</strong> Performs statistical calculations and analysis</li>
                    <li>• <strong>Data Validation:</strong> Ensures data quality and consistency</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Export and Reporting</h4>
                  <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                    <li>• <strong>PDF Generation:</strong> Creates PDF reports with charts and tables</li>
                    <li>• <strong>Data Export:</strong> Exports data in various formats (CSV, Excel, JSON)</li>
                    <li>• <strong>Report Templates:</strong> Pre-built templates for common reports</li>
                    <li>• <strong>Scheduled Reports:</strong> Automated report generation and delivery</li>
                    <li>• <strong>Custom Dashboards:</strong> Allows users to create custom analytics dashboards</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">What Makes Sync Analytics Special</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Real-time Analytics", desc: "Live data updates and real-time performance tracking" },
                { title: "Interactive Visualizations", desc: "Engaging charts and graphs with interactive features" },
                { title: "Comprehensive Metrics", desc: "Tracks all aspects of work from time to quality" },
                { title: "Advanced Filtering", desc: "Powerful filtering options for detailed analysis" },
                { title: "Export Functionality", desc: "Export data and reports in multiple formats" },
                { title: "Performance Optimization", desc: "Efficient data processing and caching for fast analytics" },
                { title: "Custom Dashboards", desc: "Flexible dashboard creation for different user needs" },
                { title: "Trend Analysis", desc: "Identifies patterns and trends in work data" },
                { title: "Comparative Analysis", desc: "Compare performance across different time periods" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Calculation Logic */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calculation Logic & Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Basic Calculations</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li><strong>Time Tracking:</strong> Task duration calculations</li>
              <li><strong>Progress Metrics:</strong> Completion percentages</li>
              <li><strong>Performance KPIs:</strong> Efficiency measurements</li>
              <li><strong>Resource Allocation:</strong> Workload distribution</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Calculation Flow</h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
              <li><strong>Data Collection:</strong> Gather task and time data</li>
              <li><strong>Processing:</strong> Apply calculation algorithms</li>
              <li><strong>Aggregation:</strong> Combine metrics by period</li>
              <li><strong>Visualization:</strong> Display in charts and cards</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Calculation Cards Analytics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calculation Cards Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Markets by Users</h3>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• Market distribution analysis</li>
              <li>• User performance metrics</li>
              <li>• Geographic breakdown</li>
              <li>• Market share calculations</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Marketing Analytics</h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Campaign performance</li>
              <li>• ROI calculations</li>
              <li>• Conversion rates</li>
              <li>• Channel effectiveness</li>
            </ul>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Acquisition Analytics</h3>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>• User acquisition costs</li>
              <li>• Growth metrics</li>
              <li>• Retention rates</li>
              <li>• Lifetime value</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Analytics Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Analytics Summary</h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Key Features</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>• Real-time data processing</li>
                <li>• Interactive visualizations</li>
                <li>• Export capabilities (CSV, PDF)</li>
                <li>• Customizable dashboards</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Data Sources</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>• Task completion data</li>
                <li>• Time tracking metrics</li>
                <li>• User activity logs</li>
                <li>• Market performance data</li>
                <li>• Deliverable metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const CardsDocumentation = () => {
  return (
    <div className="p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h1 className="text-2xl font-bold mb-6">Cards Architecture</h1>
        
        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            This document explains how Sync uses card-based components to display information, metrics, and interactive elements. The card system provides a flexible, responsive way to organize and present data across the application.
          </p>
        </div>

        <div className="space-y-8">
          {/* Card System Overview */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Card System Overview</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Core Card Features</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  Sync's card system provides a consistent, flexible way to display information and interactive elements:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Design System</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Consistent Styling:</strong> Unified design language across all cards</li>
                      <li>• <strong>Responsive Layout:</strong> Adapts to different screen sizes and orientations</li>
                      <li>• <strong>Dark Mode Support:</strong> Full compatibility with light and dark themes</li>
                      <li>• <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation</li>
                      <li>• <strong>Animation Support:</strong> Smooth transitions and hover effects</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Flexibility</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Modular Design:</strong> Cards can be combined and arranged flexibly</li>
                      <li>• <strong>Customizable Content:</strong> Support for various content types and layouts</li>
                      <li>• <strong>Interactive Elements:</strong> Buttons, links, and form elements within cards</li>
                      <li>• <strong>Dynamic Sizing:</strong> Cards adjust size based on content and screen space</li>
                      <li>• <strong>Grid System:</strong> Automatic grid layout with proper spacing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">Card Types and Categories</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                  Sync includes various types of cards designed for different purposes and data display needs:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Analytics Cards</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Acquisition Analytics:</strong> User acquisition and engagement metrics</li>
                      <li>• <strong>Marketing Analytics:</strong> Marketing campaign performance data</li>
                      <li>• <strong>Market Distribution:</strong> Market and user distribution information</li>
                      <li>• <strong>Performance Metrics:</strong> Key performance indicators and KPIs</li>
                      <li>• <strong>Real-time Data:</strong> Live updates and real-time information display</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Small Cards</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• <strong>Compact Display:</strong> Space-efficient cards for quick information</li>
                      <li>• <strong>Icon Integration:</strong> Visual icons to represent different data types</li>
                      <li>• <strong>Quick Actions:</strong> Fast access to common actions and functions</li>
                      <li>• <strong>Status Indicators:</strong> Visual status and progress indicators</li>
                      <li>• <strong>Configurable Layout:</strong> Flexible configuration for different use cases</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Card Components */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Card Components</h2>
            
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-4">SmallCard Component</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
                  A versatile small card component for displaying compact information:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Features</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>Dynamic Content:</strong> Supports various content types and layouts</li>
                      <li>• <strong>Icon Support:</strong> Integrated icon system for visual representation</li>
                      <li>• <strong>Responsive Design:</strong> Adapts to different screen sizes</li>
                      <li>• <strong>Interactive Elements:</strong> Click handlers and hover effects</li>
                      <li>• <strong>Theme Integration:</strong> Consistent with app's design system</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Configuration</h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                      <li>• <strong>Configurable Props:</strong> Flexible props for customization</li>
                      <li>• <strong>Size Variants:</strong> Different size options for various use cases</li>
                      <li>• <strong>Color Schemes:</strong> Multiple color schemes and themes</li>
                      <li>• <strong>Animation Options:</strong> Configurable animations and transitions</li>
                      <li>• <strong>Accessibility:</strong> Built-in accessibility features</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-4">Analytics Card Components</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                  Specialized card components for displaying analytics and metrics data:
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">AcquisitionAnalyticsCard</h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• User acquisition metrics</li>
                      <li>• Engagement tracking</li>
                      <li>• Conversion rates</li>
                      <li>• Growth indicators</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">MarketingAnalyticsCard</h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• Campaign performance</li>
                      <li>• Marketing ROI</li>
                      <li>• Channel effectiveness</li>
                      <li>• Lead generation</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">MarketsByUsersCard</h4>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                      <li>• Market distribution</li>
                      <li>• User demographics</li>
                      <li>• Geographic data</li>
                      <li>• Market trends</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Card Configuration */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Card Configuration System</h2>
            
            <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-lg">
              <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-4">SmallCardConfig</h3>
              <p className="text-sm text-teal-800 dark:text-teal-200 mb-4">
                A comprehensive configuration system for managing small card layouts and content:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Configuration Features</h4>
                  <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                    <li>• <strong>Layout Management:</strong> Defines card layouts and arrangements</li>
                    <li>• <strong>Content Mapping:</strong> Maps data to card content and display</li>
                    <li>• <strong>Style Configuration:</strong> Customizable styles and themes</li>
                    <li>• <strong>Behavior Settings:</strong> Configures interactions and animations</li>
                    <li>• <strong>Data Binding:</strong> Connects cards to data sources</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-teal-900 dark:text-teal-100 mb-2">Analytics Card Config</h4>
                  <ul className="text-sm text-teal-800 dark:text-teal-200 space-y-1">
                    <li>• <strong>Metric Definitions:</strong> Defines which metrics to display</li>
                    <li>• <strong>Chart Configuration:</strong> Configures charts and visualizations</li>
                    <li>• <strong>Data Processing:</strong> Handles data transformation and formatting</li>
                    <li>• <strong>Update Intervals:</strong> Configures real-time update frequencies</li>
                    <li>• <strong>Export Options:</strong> Defines export and sharing capabilities</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">What Makes Sync Cards Special</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Consistent Design", desc: "Unified design language across all card components" },
                { title: "Responsive Layout", desc: "Adapts seamlessly to all screen sizes and devices" },
                { title: "Interactive Elements", desc: "Rich interactions with hover effects and animations" },
                { title: "Flexible Configuration", desc: "Highly configurable for different use cases" },
                { title: "Real-time Updates", desc: "Live data updates and real-time information display" },
                { title: "Accessibility", desc: "Built-in accessibility features and keyboard navigation" },
                { title: "Theme Support", desc: "Full support for light and dark mode themes" },
                { title: "Performance Optimized", desc: "Efficient rendering and memory management" },
                { title: "Modular Architecture", desc: "Reusable components that can be combined flexibly" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Color System Documentation Component
const ColorSystemDocumentation = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Color System</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive design system with consistent colors, themes, and visual hierarchy.
        </p>
      </div>

      {/* Primary Colors */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Primary Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500 p-4 rounded-lg text-white text-center">
            <div className="font-semibold">Blue</div>
            <div className="text-sm opacity-90">Primary</div>
          </div>
          <div className="bg-green-500 p-4 rounded-lg text-white text-center">
            <div className="font-semibold">Green</div>
            <div className="text-sm opacity-90">Success</div>
          </div>
          <div className="bg-red-500 p-4 rounded-lg text-white text-center">
            <div className="font-semibold">Red</div>
            <div className="text-sm opacity-90">Error</div>
          </div>
          <div className="bg-yellow-500 p-4 rounded-lg text-white text-center">
            <div className="font-semibold">Yellow</div>
            <div className="text-sm opacity-90">Warning</div>
          </div>
        </div>
      </section>

      {/* Theme Colors */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Theme Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Light Theme</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                <span className="text-sm">Background: white</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span className="text-sm">Surface: gray-100</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-900 rounded"></div>
                <span className="text-sm">Text: gray-900</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h4 className="font-semibold text-white mb-3">Dark Theme</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></div>
                <span className="text-sm text-white">Background: gray-800</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-700 rounded"></div>
                <span className="text-sm text-white">Surface: gray-700</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-white rounded"></div>
                <span className="text-sm text-white">Text: white</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Component Colors */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Component Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Cards & Surfaces</h4>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• Card backgrounds</li>
              <li>• Modal surfaces</li>
              <li>• Dropdown menus</li>
              <li>• Tooltip backgrounds</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Interactive Elements</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Button states</li>
              <li>• Link colors</li>
              <li>• Focus indicators</li>
              <li>• Hover effects</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Status Colors</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Success states</li>
              <li>• Error messages</li>
              <li>• Warning alerts</li>
              <li>• Info notifications</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

// Architecture Documentation Component
const ArchitectureDocumentation = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">System Architecture</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Complete overview of database structure, Redux state management, and system architecture.
        </p>
      </div>

      {/* Database Structure */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Database Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Firestore Collections</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <li><strong>users:</strong> User accounts and permissions</li>
              <li><strong>reporters:</strong> Reporter profiles and assignments</li>
              <li><strong>tasks:</strong> Task data and metadata</li>
              <li><strong>deliverables:</strong> Deliverable configurations</li>
              <li><strong>months:</strong> Month-based organization</li>
              <li><strong>settings:</strong> Application settings</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">Data Relationships</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-2">
              <li><strong>Tasks → Users:</strong> Many-to-one relationship</li>
              <li><strong>Tasks → Reporters:</strong> Many-to-one relationship</li>
              <li><strong>Tasks → Deliverables:</strong> Many-to-many relationship</li>
              <li><strong>Users → Permissions:</strong> Role-based access</li>
              <li><strong>Months → Tasks:</strong> Temporal organization</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Redux State Management */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Redux State Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Auth Slice</h4>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• User authentication state</li>
              <li>• Login/logout actions</li>
              <li>• Permission management</li>
              <li>• Role-based access</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Data Slices</h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Tasks management</li>
              <li>• Users data</li>
              <li>• Reporters data</li>
              <li>• Deliverables config</li>
            </ul>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">UI State</h4>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>• Modal states</li>
              <li>• Loading states</li>
              <li>• Form states</li>
              <li>• Theme preferences</li>
            </ul>
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Architecture</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Frontend Architecture</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>React 18:</strong> Modern React with hooks</li>
                <li><strong>Redux Toolkit:</strong> State management</li>
                <li><strong>React Router:</strong> Client-side routing</li>
                <li><strong>Tailwind CSS:</strong> Utility-first styling</li>
                <li><strong>Vite:</strong> Fast build tool</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Backend Services</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li><strong>Firebase:</strong> Backend-as-a-Service</li>
                <li><strong>Firestore:</strong> NoSQL database</li>
                <li><strong>Firebase Auth:</strong> Authentication</li>
                <li><strong>Firebase Storage:</strong> File storage</li>
                <li><strong>Firebase Functions:</strong> Serverless functions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* API Structure */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">RTK Query APIs</h4>
            <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
              <li><strong>tasksApi:</strong> Task CRUD operations</li>
              <li><strong>usersApi:</strong> User management</li>
              <li><strong>reportersApi:</strong> Reporter operations</li>
              <li><strong>deliverablesApi:</strong> Deliverable config</li>
              <li><strong>monthsApi:</strong> Month management</li>
            </ul>
          </div>
          
          <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-lg">
            <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-3">Data Flow</h4>
            <ul className="text-sm text-pink-800 dark:text-pink-200 space-y-2">
              <li><strong>Component → API:</strong> Direct API calls</li>
              <li><strong>API → Firestore:</strong> Database operations</li>
              <li><strong>Cache Management:</strong> Automatic caching</li>
              <li><strong>Real-time Updates:</strong> Live data sync</li>
              <li><strong>Error Handling:</strong> Centralized error management</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DocumentationPage;
