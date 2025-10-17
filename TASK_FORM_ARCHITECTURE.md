# Task Form Architecture and Logic

## Overview

This document explains how Sync task forms work, focusing on the smart form system that adapts to user needs and provides intelligent validation. The forms change based on user selections to make task tracking easier and more accurate.

## Task Form Architecture

### 1. How Task Forms Work

#### Dynamic Form System
Sync task forms are smart and adapt in real-time based on user selections. This dynamic behavior creates a smooth user experience that reduces confusion and prevents form errors:

#### Form Field Categories

**Core Fields (Always Required):**

**Jira Link Field**:
- **Purpose**: Links tasks to their corresponding Jira tickets for project management integration
- **Validation**: Must match the exact Jira URL format (https://gmrd.atlassian.net/browse/PROJECT-NUMBER)
- **Data Processing**: Automatically extracts the task name (e.g., "GIMODEAR-124124") from the URL
- **Error Handling**: Provides clear error messages for invalid URL formats
- **User Experience**: Includes placeholder text showing the expected format

**Products Field**:
- **Purpose**: Categorizes tasks by the product they relate to
- **Data Source**: Loaded from application constants and can be updated by administrators
- **Validation**: Must select exactly one product from the available list
- **User Experience**: Dropdown selection with search functionality for large lists
- **Data Storage**: Stored as a string value in lowercase for consistency

**Department Field**:
- **Purpose**: Organizes tasks by the department responsible for the work
- **Data Source**: Loaded from application constants
- **Validation**: Must select exactly one department
- **Cascading Effect**: Changing the department clears deliverable selections to prevent mismatches
- **User Experience**: Dropdown selection with clear department names

**Markets Field**:
- **Purpose**: Identifies which markets the task affects or targets
- **Data Source**: Loaded from application constants
- **Validation**: Must select at least one market, multiple selections allowed
- **Data Storage**: Stored as an array of selected market values
- **User Experience**: Multi-select dropdown with checkboxes for easy selection

**Date Range Fields**:
- **Start Date**: The date when work on the task began
- **End Date**: The date when work on the task was completed
- **Validation**: End date must be after start date, both must be within the current month
- **Format**: YYYY-MM-DD format with date picker interface
- **Data Processing**: Converted to ISO format for database storage

**Total Time Field**:
- **Purpose**: Records the total hours spent on the task
- **Validation**: Must be in 0.5 hour increments (0.5, 1.0, 1.5, 2.0, etc.)
- **Range**: Minimum 0.5 hours, maximum 999 hours
- **User Experience**: Number input with step controls and clear validation messages
- **Data Processing**: Stored as a decimal number for calculations

**Reporter Field**:
- **Purpose**: Identifies who is reporting or submitting the task
- **Data Source**: Dynamically loaded from the user database
- **Validation**: Must select exactly one reporter
- **User Experience**: Searchable dropdown with reporter names and details
- **Data Processing**: Stores both reporter ID and name for reference

**Conditional Fields (Appear Based on Checkboxes):**

**Deliverables Section**:
- **Trigger**: "Has Deliverables" checkbox
- **Purpose**: Tracks what deliverables were created as part of the task
- **Data Source**: Filtered by selected department to show relevant deliverables
- **Validation**: Required when checkbox is checked, must select at least one deliverable
- **Additional Features**: Supports quantity tracking and variation management
- **Data Processing**: Stored as structured arrays with quantities and variations

**AI Tools Section**:
- **Trigger**: "AI Tools Used" checkbox
- **Purpose**: Tracks AI tools and time spent using them
- **AI Models Field**: Multi-select field for AI tools used (ChatGPT, Claude, etc.)
- **AI Time Field**: Number field for time spent on AI tools (0.5 hour increments)
- **Validation**: Both fields required when checkbox is checked
- **Data Processing**: Stored as structured arrays with models and time

**Additional Fields:**

**VIP Task Checkbox**:
- **Purpose**: Marks high-priority or important tasks for special handling
- **Usage**: Used for filtering, reporting, and prioritization
- **Data Storage**: Boolean value (true/false)
- **User Experience**: Simple checkbox with clear labeling

**Reworked Checkbox**:
- **Purpose**: Indicates if the task required rework or revisions
- **Usage**: Used for quality tracking and process improvement
- **Data Storage**: Boolean value (true/false)
- **User Experience**: Simple checkbox with clear labeling

**Observations Field**:
- **Purpose**: Allows users to add additional notes or context about the task
- **Validation**: Optional field with 300 character limit
- **Data Processing**: Trimmed and sanitized before storage
- **User Experience**: Textarea with character counter and placeholder text
- **Data Storage**: Only stored if not empty to keep database clean

### 2. Form Validation System

#### How Validation Works

**Jira Link Validation:**
The system implements strict validation for Jira links to ensure data integrity and proper integration:

**Format Validation**:
- **URL Pattern**: Must match the exact pattern `https://gmrd.atlassian.net/browse/PROJECT-NUMBER`
- **Project Code**: Must contain a valid project code (letters and numbers)
- **Ticket Number**: Must contain a numeric ticket identifier
- **Length Limits**: Maximum 200 characters to prevent extremely long URLs
- **Protocol Check**: Must use HTTPS protocol for security

**Error Handling**:
- **Clear Messages**: Provides specific error messages explaining what's wrong
- **Format Examples**: Shows users the expected format in error messages
- **Real-time Validation**: Validates as users type to provide immediate feedback
- **Submission Prevention**: Prevents form submission with invalid URLs

**Data Processing**:
- **Task Name Extraction**: Automatically extracts the task identifier (e.g., "GIMODEAR-124124")
- **Uppercase Conversion**: Converts task names to uppercase for consistency
- **URL Removal**: Removes the original URL after extracting the task name
- **Validation Confirmation**: Confirms the extracted task name is valid

**Time Field Validation:**
The system enforces strict time validation to ensure accurate time tracking:

**Increment Validation**:
- **0.5 Hour Steps**: All time entries must be in 0.5 hour increments (0, 0.5, 1.0, 1.5, 2.0, etc.)
- **Mathematical Check**: Uses modulo operation to verify increment compliance
- **Custom Error Messages**: Shows specific error messages with examples of valid increments
- **Real-time Feedback**: Validates as users type to prevent invalid entries

**Range Validation**:
- **Minimum Value**: Must be at least 0.5 hours (prevents zero or negative time)
- **Maximum Value**: Cannot exceed 999 hours (prevents unrealistic entries)
- **Decimal Precision**: Supports decimal values up to one decimal place
- **Type Validation**: Ensures the input is a valid number

**User Experience**:
- **Step Controls**: Number input includes step controls for easy increment selection
- **Visual Feedback**: Clear error messages with examples of valid time formats
- **Input Assistance**: Placeholder text shows expected format
- **Validation Timing**: Validates on blur and form submission

**Date Field Validation:**
The system provides comprehensive date validation to ensure logical consistency:

**Format Validation**:
- **YYYY-MM-DD Format**: Must follow the exact date format specification
- **Date Validity**: Checks that the date is a valid calendar date
- **Leap Year Handling**: Properly handles leap years and month boundaries
- **Timezone Awareness**: Uses consistent timezone handling for all date operations

**Logical Validation**:
- **Start Date Check**: Start date must be a valid date within the current month
- **End Date Check**: End date must be a valid date within the current month
- **Date Relationship**: End date must be on or after the start date
- **Month Boundaries**: Both dates must fall within the current month's boundaries

**Error Messages**:
- **Format Errors**: Clear messages about date format requirements
- **Logic Errors**: Specific messages about date relationship problems
- **Boundary Errors**: Messages about dates outside the current month
- **Validation Examples**: Shows examples of valid date formats

**Conditional Validation:**
The system implements smart conditional validation that adapts based on user selections:

**Checkbox-Driven Requirements**:
- **Has Deliverables**: When checked, deliverable fields become required
- **AI Tools Used**: When checked, AI model and AI time fields become required
- **Dynamic Validation**: Validation rules change in real-time as checkboxes are toggled
- **State Synchronization**: Validation state is synchronized with field visibility

**Field Clearing Logic**:
- **Automatic Clearing**: Related fields are automatically cleared when checkboxes are unchecked
- **Data Consistency**: Prevents orphaned data by clearing dependent fields
- **Validation Reset**: Validation errors are cleared when fields become irrelevant
- **State Management**: Form state is maintained consistently across all changes

**Error Prevention**:
- **Impossible Combinations**: Prevents users from entering data in hidden fields
- **Validation Timing**: Only validates visible and relevant fields
- **Error Display**: Shows validation errors only for fields that are currently visible
- **Submission Control**: Prevents form submission with validation errors in any visible field

### 3. Checkbox Logic and Multiple Values

#### How Checkboxes Control the Form

**Has Deliverables Checkbox:**
- When checked: Shows deliverable selection field and makes it required
- When unchecked: Hides deliverable field and clears any selected values
- Automatically clears deliverable data when unchecked

**AI Tools Used Checkbox:**
- When checked: Shows AI models and AI time fields, makes them required
- When unchecked: Hides AI fields and sets AI time to 0
- Automatically clears AI data when unchecked

#### Multiple Value Handling

**Markets Field:**
Users can select multiple markets from a list. The system stores all selected markets as an array and validates that at least one market is selected.

**AI Models Field:**
When AI tools are used, users can select multiple AI models. The system stores all selected models and validates that at least one is chosen when the AI checkbox is checked.

**Deliverable Quantities:**
The system tracks quantities for different deliverables using hidden fields that store data as objects with deliverable names as keys and quantities as values.

### 4. Form Component Features

#### Smart Form Management
The form watches all user inputs in real-time and automatically shows or hides fields based on selections. It validates data as users type and provides immediate feedback about errors or requirements.

#### Dynamic Options Loading
The form automatically loads the latest options from the database:
- Reporters are loaded from the user database
- Deliverables are filtered based on the selected department
- AI models come from application settings
- This ensures users always see current and relevant options

#### Conditional Field Display
The form intelligently manages field visibility:
- AI fields only appear when "AI Tools Used" is checked
- Deliverable fields only show when "Has Deliverables" is checked
- When users change departments, deliverable selections are automatically cleared to prevent mismatches

#### Edit Mode Support
When editing existing tasks, the form:
- Reconstructs the form data from the database structure
- Handles different date formats automatically
- Preserves checkbox states and conditional field values
- Ensures a smooth editing experience

#### Form Layout Organization
The form is organized in a logical flow:
1. Basic task information (Jira link, products, department)
2. Organizational details (markets, reporter)
3. Time and date information
4. Task classification (VIP, reworked)
5. Conditional sections (AI tools, deliverables)
6. Additional notes and observations

### 5. Data Processing and Number Extraction

#### How Form Data is Transformed

**Jira Link Processing:**
Sync automatically extracts the task name from Jira URLs (like "GIMODEAR-124124") and converts it to uppercase for consistency. It removes the original URL and keeps only the essential task identifier for storage.

**Number Extraction and Processing:**
Sync handles various number formats and extractions:
- Time values are converted to proper decimal format (0.5 hour increments)
- Quantities are extracted and stored as numbers
- Date values are converted to ISO format for consistent storage
- All numeric values are validated and sanitized before storage

**Conditional Field Data Handling:**
When checkboxes are unchecked, Sync automatically:
- Clears related field data to prevent orphaned information
- Sets appropriate default values (empty arrays, zero values)
- Maintains clean database structure
- Prevents inconsistent data states

**Final Data Structure:**
The processed data is organized into a clean structure that supports analytics and reporting:
- AI usage data is stored in structured arrays
- Deliverable information includes quantities and variations
- All dates are in consistent ISO format
- Metadata is properly organized for easy querying

### 6. Data Sanitization

#### Input Sanitization Process
Sync implements comprehensive data sanitization to ensure data integrity and security:

**Text Field Sanitization:**
- **HTML Stripping**: Removes all HTML tags and scripts from text inputs
- **XSS Prevention**: Escapes special characters that could be used for cross-site scripting
- **Length Trimming**: Automatically trims whitespace and enforces character limits
- **Encoding Normalization**: Converts all text to UTF-8 encoding for consistency

**Numeric Field Sanitization:**
- **Type Validation**: Ensures numeric fields contain only valid numbers
- **Range Validation**: Enforces minimum and maximum value constraints
- **Decimal Precision**: Limits decimal places to prevent precision errors
- **Format Standardization**: Converts all numbers to consistent decimal format

**URL Field Sanitization:**
- **Protocol Validation**: Ensures URLs use HTTPS protocol for security
- **Domain Whitelisting**: Validates that URLs come from approved domains
- **Parameter Cleaning**: Removes potentially malicious query parameters
- **Length Limits**: Prevents extremely long URLs that could cause issues

**Date Field Sanitization:**
- **Format Validation**: Ensures dates follow YYYY-MM-DD format
- **Range Checking**: Validates dates are within reasonable time ranges
- **Timezone Normalization**: Converts all dates to consistent timezone
- **Leap Year Handling**: Properly handles edge cases in date calculations

### 7. Badge System

#### Visual Status Indicators
Sync uses a comprehensive badge system to provide visual feedback about form state and data:

**Form Status Badges:**
- **Draft Badge**: Shows when form has unsaved changes
- **Valid Badge**: Indicates when all required fields are properly filled
- **Error Badge**: Highlights fields with validation errors
- **Loading Badge**: Shows when form is processing or saving data

**Field Status Badges:**
- **Required Badge**: Marks fields that must be completed
- **Optional Badge**: Shows fields that are not mandatory
- **Conditional Badge**: Indicates fields that appear based on other selections
- **Validated Badge**: Shows when a field has passed all validation checks

**Data Quality Badges:**
- **Complete Badge**: Indicates when all data for a section is filled
- **Incomplete Badge**: Shows when required data is missing
- **Warning Badge**: Highlights potential issues or inconsistencies
- **Success Badge**: Confirms when data has been successfully processed

**User Experience Badges:**
- **New Badge**: Highlights newly added fields or features
- **Updated Badge**: Shows when fields have been modified
- **Locked Badge**: Indicates fields that cannot be edited
- **Unlocked Badge**: Shows when fields become available for editing



### 8. Batch Operations

#### Bulk Data Processing
Sync supports batch operations for efficient data management:

**Batch Form Submission:**
- **Multiple Tasks**: Create multiple tasks in a single operation
- **Bulk Updates**: Update multiple tasks simultaneously
- **Batch Validation**: Validate all tasks before submission
- **Error Handling**: Process errors for individual items in batch

**Batch Data Processing:**
- **Data Import**: Import multiple tasks from external sources
- **Data Export**: Export multiple tasks in various formats
- **Data Transformation**: Convert data formats in bulk
- **Data Cleanup**: Remove or update multiple records at once

**Batch Validation:**
- **Cross-Validation**: Check data consistency across multiple records
- **Duplicate Detection**: Identify and handle duplicate entries
- **Data Integrity**: Ensure all batch operations maintain data quality
- **Rollback Support**: Undo batch operations if errors occur

**Performance Optimization:**
- **Chunked Processing**: Handle large batches in smaller chunks
- **Progress Tracking**: Show progress for long-running batch operations
- **Memory Management**: Optimize memory usage for large datasets
- **Background Processing**: Run batch operations without blocking the UI


## Summary

Sync task forms provide a smart and user-friendly way to create and edit tasks. The system offers dynamic field visibility, real-time validation, intelligent data processing, and checkbox-driven logic that makes forms easier to use and reduces errors.

### What Makes Sync Forms Special:

1. **Dynamic Form System**: Automatically adapts to user selections and provides real-time validation
2. **Checkbox Logic**: Controls form behavior and data processing intelligently
3. **Number Extraction**: Handles various numeric formats and validates time increments
4. **Smart Validation**: Provides immediate feedback and prevents errors before they happen
5. **Data Processing**: Converts form input into clean, consistent database format
6. **User Experience**: Reduces complexity by showing only relevant fields
7. **Error Prevention**: Prevents impossible field combinations and invalid data entry
8. **Real-time Updates**: Form state changes instantly based on user interactions
9. **Data Sanitization**: Comprehensive security and data integrity protection
10. **Badge System**: Visual feedback for form state and data quality
11. **Batch Operations**: Efficient bulk processing for multiple tasks
12. **CRUD Operations**: Complete task lifecycle management
13. **Error Processing**: Sophisticated error handling and recovery
14. **Submit Process**: Structured multi-step submission with validation
15. **Real-Time Features**: Live collaboration and auto-save capabilities
