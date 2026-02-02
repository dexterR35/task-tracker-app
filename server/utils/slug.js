/**
 * Slug utilities – shared across auth, users, departments.
 */

/** Derive slug from department name (e.g. Design -> design, Customer Support -> customer-support). */
export function slugFromDepartmentName(name) {
  if (!name || typeof name !== 'string') return null;
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}
