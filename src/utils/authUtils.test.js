/**
 * Unit tests for authUtils – RBAC helpers (no React, no state).
 */
import { describe, it, expect } from 'vitest';
import {
  isAdmin,
  isUserActive,
  canAccessRole,
  canAccess,
  canManageUsers,
  canManageDepartments,
} from './authUtils';

describe('authUtils', () => {
  const adminUser = { id: '1', role: 'admin', isActive: true };
  const regularUser = { id: '2', role: 'user', isActive: true };
  const inactiveUser = { id: '3', role: 'user', isActive: false };

  describe('isAdmin', () => {
    it('returns true for user with role admin', () => {
      expect(isAdmin(adminUser)).toBe(true);
    });
    it('returns false for user with role user', () => {
      expect(isAdmin(regularUser)).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('returns true when user is active', () => {
      expect(isUserActive(adminUser)).toBe(true);
      expect(isUserActive(regularUser)).toBe(true);
    });
    it('returns false when user is inactive', () => {
      expect(isUserActive(inactiveUser)).toBe(false);
    });
    it('returns false for null/undefined', () => {
      expect(isUserActive(null)).toBe(false);
      expect(isUserActive(undefined)).toBe(false);
    });
  });

  describe('canAccessRole', () => {
    it('allows admin for requiredRole admin', () => {
      expect(canAccessRole(adminUser, 'admin')).toBe(true);
      expect(canAccessRole(regularUser, 'admin')).toBe(false);
    });
    it('allows user or admin for requiredRole user', () => {
      expect(canAccessRole(regularUser, 'user')).toBe(true);
      expect(canAccessRole(adminUser, 'user')).toBe(true);
    });
    it('returns false for null user', () => {
      expect(canAccessRole(null, 'admin')).toBe(false);
      expect(canAccessRole(null, 'user')).toBe(false);
    });
    it('returns false for unknown requiredRole', () => {
      expect(canAccessRole(adminUser, 'superadmin')).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('authenticated: any logged-in user', () => {
      expect(canAccess(adminUser, 'authenticated')).toBe(true);
      expect(canAccess(regularUser, 'authenticated')).toBe(true);
      expect(canAccess(null, 'authenticated')).toBe(false);
    });
    it('admin: only admin role', () => {
      expect(canAccess(adminUser, 'admin')).toBe(true);
      expect(canAccess(regularUser, 'admin')).toBe(false);
    });
    it('user: user or admin', () => {
      expect(canAccess(regularUser, 'user')).toBe(true);
      expect(canAccess(adminUser, 'user')).toBe(true);
    });
  });

  describe('canManageUsers', () => {
    it('returns true only for active admin', () => {
      expect(canManageUsers(adminUser)).toBe(true);
      expect(canManageUsers(inactiveUser)).toBe(false);
      expect(canManageUsers(regularUser)).toBe(false);
      expect(canManageUsers(null)).toBe(false);
    });
  });

  describe('canManageDepartments', () => {
    it('returns true only for admin', () => {
      expect(canManageDepartments(adminUser)).toBe(true);
      expect(canManageDepartments(regularUser)).toBe(false);
      expect(canManageDepartments(null)).toBe(false);
    });
  });
});
