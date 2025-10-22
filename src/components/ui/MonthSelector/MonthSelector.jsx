import React from "react";
import { useAppDataContext } from "@/context/AppDataContext";

const MonthSelector = ({ 
  selectedUserId = null,
  onMonthChange = null,
  className = "",
  id = "monthSelector",
  placeholder = "Select Month"
}) => {
  // Use the app data hook which includes month selection
  const {
    currentMonth,
    selectedMonth,
    availableMonths,
    selectMonth,
    isLoading
  } = useAppDataContext(selectedUserId);

  const handleChange = (e) => {
    const monthId = e.target.value;
    selectMonth(monthId);
    
    // Call custom onChange if provided
    if (onMonthChange) {
      onMonthChange(monthId);
    }
  };

  const currentValue = selectedMonth?.monthId || currentMonth?.monthId || "";

  return (
    <select
      id={id}
      value={currentValue}
      onChange={handleChange}
      disabled={isLoading}
      className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {availableMonths && availableMonths.length > 0 ? (
        availableMonths.map((month) => (
          <option key={month.monthId} value={month.monthId}>
            {month.monthName} {month.isCurrent ? "(Current)" : ""}
          </option>
        ))
      ) : (
        currentMonth ? (
          <option value={currentMonth.monthId}>
            {currentMonth.monthName} (Current)
          </option>
        ) : (
          <option value="">{placeholder}</option>
        )
      )}
    </select>
  );
};

export default MonthSelector;
