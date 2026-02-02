/**
 * Unit tests for slug utilities.
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { slugFromDepartmentName } from './slug.js';

describe('slugFromDepartmentName', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugFromDepartmentName('Design')).toBe('design');
    expect(slugFromDepartmentName('Customer Support')).toBe('customer-support');
  });
  it('trims whitespace', () => {
    expect(slugFromDepartmentName('  Food  ')).toBe('food');
  });
  it('returns null for empty or non-string', () => {
    expect(slugFromDepartmentName('')).toBe(null);
    expect(slugFromDepartmentName(null)).toBe(null);
    expect(slugFromDepartmentName(undefined)).toBe(null);
    expect(slugFromDepartmentName(123)).toBe(null);
  });
});
