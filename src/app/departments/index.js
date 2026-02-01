/**
 * Departments – one folder per department (design, food, …).
 *
 * Single department table in DB; same auth, same user data.
 * Only difference: users.department_id set when user is created manually.
 * Each department slug maps to a different dashboard and menu (this map).
 *
 * Add a new department: add folder here + register in departmentsBySlug below.
 */
import design from "./design";
import food from "./food";

/** Department slug (from departments table) → dashboard + menu. Same auth/user data; department set at user creation. */
export const departmentsBySlug = {
  design,
  food,
};

export { design, food };
export default departmentsBySlug;
