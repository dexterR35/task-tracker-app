/**
 * Pure RBAC: "given a user, can they do X?" No React, no state.
 * Use in router, pages, API layer; easy to test.
 * Auth state lives in AuthContext.
 */

export const isAdmin = (user) => user?.role === 'admin';

export const isUserActive = (user) => {
  if (!user) return false;
  return user.isActive !== false;
};

/** Can this user access routes/UI for this role? (admin | user) */
export const canAccessRole = (user, requiredRole) => {
  if (!user) return false;
  if (requiredRole === 'admin') return isAdmin(user);
  if (requiredRole === 'user') return user.role === 'user' || isAdmin(user);
  return false;
};

/** Single access check: 'authenticated' (any logged-in), 'admin', or 'user'. */
export const canAccess = (user, requiredRole) => {
  if (requiredRole === 'authenticated') return !!user;
  return canAccessRole(user, requiredRole);
};

/** Can manage users list/settings (admin + active). */
export const canManageUsers = (user) => isAdmin(user) && isUserActive(user);
