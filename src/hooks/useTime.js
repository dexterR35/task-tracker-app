import { useCallback } from 'react';
import dayjs from 'dayjs';
import { normalizeTimestamp } from '../utils/time';


export const useTime = () => {
  const toMs = useCallback((value) => normalizeTimestamp(value), []);

  const format = useCallback((value, pattern = 'YYYY-MM-DD HH:mm') => {
    const ms = toMs(value);
    if (!ms) return 'N/A';
    try { return dayjs(ms).format(pattern); } catch { return 'Invalid Date'; }
  }, [toMs]);

  const fromNow = useCallback((value) => {
    const ms = toMs(value);
    if (!ms) return 'N/A';
    try { return dayjs(ms).fromNow?.() || dayjs(ms).format('YYYY-MM-DD HH:mm'); } catch { return 'Invalid Date'; }
  }, [toMs]);

  return { toMs, format, fromNow };
};

export default useTime;


