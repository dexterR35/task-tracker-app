

/**
 * Convert a Firestore Timestamp, Date, number, or string into milliseconds since epoch.
 * Returns null if conversion fails or input is falsy.
 */
export const normalizeTimestamp = (value) => {
  if (!value) return null;
  try {
    // Firestore Timestamp
    if (value?.toDate) {
      const d = value.toDate();
      return Number.isFinite(d?.getTime?.()) ? d.getTime() : null;
    }
    // JS Date
    if (value instanceof Date) {
      return Number.isFinite(value.getTime()) ? value.getTime() : null;
    }
    // Number (assumed ms)
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    // ISO or date-like string
    if (typeof value === 'string') {
      const t = Date.parse(value);
      return Number.isFinite(t) ? t : null;
    }
  } catch (_) {}
  return null;
};

/**
 * Recursively walk a plain object/array and convert any Timestamp/Date-like
 * values on keys that look like time fields to millisecond numbers.
 */
export const normalizeObjectTimestamps = (input) => {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map((v) => normalizeObjectTimestamps(v));
  if (typeof input === 'object') {
    const out = Array.isArray(input) ? [] : {};
    for (const [k, v] of Object.entries(input)) {
      if (/at$|At$|date$|Date$|time$|Time$|lastActive|lastLogin|savedAt/.test(k)) {
        const ms = normalizeTimestamp(v);
        out[k] = ms != null ? ms : normalizeObjectTimestamps(v);
      } else {
        out[k] = normalizeObjectTimestamps(v);
      }
    }
    return out;
  }
  return input;
};


