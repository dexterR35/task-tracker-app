import React, { useMemo } from 'react';
import SearchableSelectField from '@/components/forms/components/SearchableSelectField';
import { FORM_OPTIONS } from '@/constants';

const DepartmentFilter = ({ selectedDepartmentFilter, onFilterChange }) => {
  const departmentFilterComponent = useMemo(() => (
    <div className="min-w-[200px] max-w-sm">
      <SearchableSelectField
        field={{
          name: "departmentFilter",
          type: "select",
          label: "Department",
          required: false,
          options: FORM_OPTIONS.DEPARTMENTS,
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
    </div>
  ), [selectedDepartmentFilter, onFilterChange]);

  return departmentFilterComponent;
};

export default DepartmentFilter;

