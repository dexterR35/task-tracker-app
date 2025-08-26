import { useCallback } from 'react';
import { 
  format, 
  formatDistanceToNow, 
  parseISO, 
  isValid,
} from 'date-fns';

export const useFormat = () => {
  const toMs = useCallback((value) => {
    if (!value) return null;
    try {
      // Firestore Timestamp
      if (value?.toDate) {
        const d = value.toDate();
        return isValid(d) ? d.getTime() : null;
      }
      // JS Date
      if (value instanceof Date) {
        return isValid(value) ? value.getTime() : null;
      }
      // Number (assumed ms)
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }
      // ISO or date-like string
      if (typeof value === 'string') {
        const parsed = parseISO(value);
        return isValid(parsed) ? parsed.getTime() : null;
      }
    } catch (_) {}
    return null;
  }, []);

  const formatDate = useCallback((value, pattern = 'yyyy-MM-dd HH:mm') => {
    const ms = toMs(value);
    if (!ms) return 'N/A';
    try {
      const date = new Date(ms);
      return format(date, pattern);
    } catch {
      return 'Invalid Date';
    }
  }, [toMs]);

  const fromNow = useCallback((value) => {
    const ms = toMs(value);
    if (!ms) return 'N/A';
    try {
      const date = new Date(ms);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Invalid Date';
    }
  }, [toMs]);

  const formatMonth = useCallback((monthId) => {
    if (!monthId) return 'N/A';
    try {
      const date = parseISO(monthId + '-01');
      return format(date, 'MMMM yyyy');
    } catch {
      return 'Invalid Month';
    }
  }, []);

  const getCurrentMonthId = useCallback(() => {
    return format(new Date(), 'yyyy-MM');
  }, []);

  const parseMonthId = useCallback((monthId) => {
    if (!monthId) return null;
    try {
      return parseISO(monthId + '-01');
    } catch {
      return null;
    }
  }, []);

  return { 
    toMs, 
    format: formatDate, 
    fromNow, 
    formatMonth,
    getCurrentMonthId,
    parseMonthId
  };
};

export default useFormat;
