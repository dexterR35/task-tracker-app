/**
 * Shared user row → auth user object mapper.
 * Used by auth middleware (getUserFromToken) and auth controller (login, refresh).
 */

import { slugFromDepartmentName } from './slug.js';

/**
 * Map DB row (users + profiles + departments JOIN) to auth user shape.
 * @param {object|null} row - Row with id, email, role, is_active, department_id, name, office, job_position, gender, department_name
 * @returns {object|null} - { id, email, name, role, isActive, office, jobPosition, gender, departmentId, departmentName, departmentSlug }
 */
export function toAuthUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    office: row.office,
    jobPosition: row.job_position,
    gender: row.gender,
    departmentId: row.department_id ?? null,
    departmentName: row.department_name ?? null,
    departmentSlug: slugFromDepartmentName(row.department_name),
  };
}
