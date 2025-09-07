import { useSelector } from "react-redux";
import { 
  selectCurrentMonthId, 
  selectCurrentMonthName, 
  selectBoardExists,
  selectCurrentMonthDaysInMonth,
  selectCurrentMonthGenerating,
  selectCurrentMonthStartDate,
  selectCurrentMonthEndDate
} from "@/features/currentMonth";

/**
 * Global hook for month data
 * Provides all month-related data from Redux store
 * Use this instead of individual selectors in components
 */
export const useMonthData = () => {
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const boardExists = useSelector(selectBoardExists);
  const daysInMonth = useSelector(selectCurrentMonthDaysInMonth);
  const isGenerating = useSelector(selectCurrentMonthGenerating);
  const startDate = useSelector(selectCurrentMonthStartDate);
  const endDate = useSelector(selectCurrentMonthEndDate);

  return {
    monthId,
    monthName,
    boardExists,
    daysInMonth,
    isGenerating,
    startDate,
    endDate
  };
};
