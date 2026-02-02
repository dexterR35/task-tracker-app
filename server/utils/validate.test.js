/**
 * Unit tests for request validation helpers (UUID).
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { isUuid } from './validate.js';

describe('validate', () => {
  describe('isUuid', () => {
    it('accepts valid v4 UUIDs', () => {
      expect(isUuid('a1b2c3d4-e5f6-4789-abcd-ef0123456789')).toBe(true);
      expect(isUuid('00000000-0000-4000-8000-000000000000')).toBe(true);
    });
    it('rejects invalid formats', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid('a1b2c3d4-e5f6-6789-abcd-ef0123456789')).toBe(false);
      expect(isUuid('a1b2c3d4e5f64789abcdef0123456789')).toBe(false);
    });
    it('rejects null, undefined, non-string', () => {
      expect(isUuid(null)).toBe(false);
      expect(isUuid(undefined)).toBe(false);
      expect(isUuid(123)).toBe(false);
    });
    it('trims string before check', () => {
      expect(isUuid('  a1b2c3d4-e5f6-4789-abcd-ef0123456789  ')).toBe(true);
    });
  });
});
