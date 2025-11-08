import React, { useMemo } from 'react';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';
import { FORM_OPTIONS } from '@/constants';

/**
 * Shared Department Filter Component
 * Reusable department filter for tables (TaskTable, DeliverableTable, etc.)
 * 
 * @param {string} selectedDepartmentFilter - Currently selected department filter value
 * @param {function} onFilterChange - Callback function when filter changes: (fieldName, value) => void
 * @param {Array} departmentOptions - Optional custom department options (defaults to FORM_OPTIONS.DEPARTMENTS)
 * @returns {JSX.Element} Department filter SearchableSelectField component
 */
const DepartmentFilter = ({ selectedDepartmentFilter, onFilterChange, departmentOptions = null }) => {
  const departmentFilterComponent = useMemo(() => (
    <SearchableSelectField
      field={{
        name: "departmentFilter",
        type: "select",
        label: "Department",
        required: false,
        options: departmentOptions || FORM_OPTIONS.DEPARTMENTS,
        placeholder: "Search department ",
      }}
      register={() => {}}
      errors={{}}
      setValue={onFilterChange}
      watch={() => selectedDepartmentFilter || ""}
      trigger={() => {}}
      clearErrors={() => {}}
      formValues={{}}
      noOptionsMessage="No departments found"
    />
  ), [selectedDepartmentFilter, onFilterChange, departmentOptions]);

  return departmentFilterComponent;
};

export default DepartmentFilter;

