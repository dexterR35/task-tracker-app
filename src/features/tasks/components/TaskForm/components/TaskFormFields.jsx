import React, { useMemo } from "react";
import { Field } from "formik";
import { TASK_FORM_OPTIONS } from "../taskFormSchema";

/**
 * Jira Link Field Component
 */
export const JiraLinkField = ({ handleJiraLinkChange }) => (
  <div className="field-wrapper">
    <label htmlFor="jiraLink" className="block text-sm font-medium text-gray-700 mb-1">
      Jira Link <span className="text-red-500 ml-1">*</span>
    </label>
    <Field name="jiraLink">
      {({ field, meta, form }) => (
        <>
          <input
            {...field}
            type="url"
            placeholder="https://jira.company.com/browse/TASK-123"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
            onChange={(e) => {
              field.onChange(e);
              handleJiraLinkChange(e, form.setFieldValue);
            }}
          />
          {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
        </>
      )}
    </Field>
    <p className="text-sm text-gray-500 mt-1">Enter the complete Jira ticket URL. Task number will be auto-extracted.</p>
  </div>
);

/**
 * Task Number Field Component (Read-only)
 */
export const TaskNumberField = () => (
  <div className="field-wrapper">
    <label htmlFor="taskNumber" className="block text-sm font-medium text-gray-700 mb-1">
      Task Number <span className="text-red-500 ml-1">*</span>
    </label>
    <Field name="taskNumber">
      {({ field, meta }) => (
        <>
          <input
            {...field}
            type="text"
            placeholder="TASK-123"
            readOnly
            disabled
            className="w-full px-3 py-2 border rounded-md bg-gray-100 border-gray-300"
          />
          {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
        </>
      )}
    </Field>
    <p className="text-sm text-gray-500 mt-1">Task number (auto-extracted from Jira link, cannot be manually edited)</p>
  </div>
);

/**
 * Multi-Select Field Component (for Markets, Deliverables, AI Models)
 */
export const MultiSelectField = ({ 
  name, 
  label, 
  options, 
  placeholder = "Select an option",
  required = false,
  colorClass = "bg-blue-100 text-blue-800"
}) => (
  <div className="field-wrapper">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Field name={name}>
      {({ field, meta }) => (
        <>
          <select
            value="" // Always use empty string for the select value since we're managing the array separately
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
            onChange={(e) => {
              const selectedValue = e.target.value;
              const currentValues = field.value || []; // Ensure it's always an array
              if (selectedValue && !currentValues.includes(selectedValue)) {
                const newValues = [...currentValues, selectedValue];
                const syntheticEvent = {
                  target: { name, value: newValues }
                };
                field.onChange(syntheticEvent);
                e.target.value = ''; // Reset select
              }
            }}
          >
            <option value="">{placeholder}</option>
            {options
              .filter(option => !(field.value || []).includes(option.value))
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
          
          {/* Selected Items Display */}
          {field.value && field.value.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {field.value.map((item) => (
                  <span
                    key={item}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}
                  >
                    {options.find(opt => opt.value === item)?.label || item}
                    <button
                      type="button"
                      onClick={() => {
                        const currentValues = field.value || [];
                        const newValues = currentValues.filter(i => i !== item);
                        const syntheticEvent = {
                          target: { name, value: newValues }
                        };
                        field.onChange(syntheticEvent);
                      }}
                      className="ml-2 hover:opacity-75"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
        </>
      )}
    </Field>
  </div>
);

/**
 * Single Select Field Component
 */
export const SelectField = ({ 
  name, 
  label, 
  options, 
  placeholder = "Select an option",
  required = false,
  helpText = ""
}) => (
  <div className="field-wrapper">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Field name={name}>
      {({ field, meta }) => (
        <>
          <select
            {...field}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
          {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
        </>
      )}
    </Field>
  </div>
);

/**
 * Number Input Field Component
 */
export const NumberField = ({ 
  name, 
  label, 
  step = "0.5",
  min = "0.5",
  max = "24",
  placeholder = "0.5",
  required = false,
  helpText = "",
  onChange = null
}) => (
  <div className="field-wrapper">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Field name={name}>
      {({ field, meta, form }) => (
        <>
          <input
            {...field}
            type="number"
            step={step}
            min={min}
            max={max}
            placeholder={placeholder}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
            onChange={(e) => {
              field.onChange(e);
              if (onChange) {
                onChange(e, form.setFieldValue);
              }
            }}
          />
          {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
          {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
        </>
      )}
    </Field>
  </div>
);

/**
 * Checkbox Field Component
 */
export const CheckboxField = ({ 
  name, 
  label, 
  helpText = "",
  onChange = null
}) => (
  <div className="field-wrapper">
    <Field name={name}>
      {({ field, meta, form }) => (
        <div className="flex items-start space-x-3">
          <input
            name={field.name}
            type="checkbox"
            checked={field.value || false}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            onChange={(e) => {
              // For checkboxes, we need to pass the boolean value, not the event
              const syntheticEvent = {
                target: { name: field.name, value: e.target.checked }
              };
              field.onChange(syntheticEvent);
              if (onChange) {
                onChange(e, form.setFieldValue);
              }
            }}
          />
          <div>
            <label htmlFor={name} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
          </div>
        </div>
      )}
    </Field>
  </div>
);

/**
 * Reporter Select Field Component
 */
export const ReporterField = ({ reporters }) => {
  // Memoize the reporters options to prevent unnecessary re-renders
  const reporterOptions = useMemo(() => {
    if (!reporters || reporters.length === 0) {
      return [{ value: "", label: "No reporters available", disabled: true }];
    }
    
    return reporters.map((reporter) => ({
      value: reporter.id,
      label: `${reporter.name || reporter.email} (${reporter.email})`
    }));
  }, [reporters]);
  
  return (
    <SelectField
      name="reporters"
      label="Reporter"
      options={reporterOptions}
      placeholder="Select a reporter"
      required={true}
      helpText="Select the person responsible for this task"
    />
  );
};
