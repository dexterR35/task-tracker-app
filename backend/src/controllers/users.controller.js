/**
 * Users Controller
 * Handles user management operations (admin only)
 */

import pool, { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { hashPassword } from '../utils/password.js';
import { SOCKET_EVENTS } from '../constants/index.js';

/**
 * Get all users
 * GET /api/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { 
    search, 
    role, 
    department, 
    isActive, 
    page = 1, 
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  
  if (department) {
    conditions.push(`department = $${paramIndex++}`);
    params.push(department);
  }
  
  if (isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    params.push(isActive === 'true');
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const validSortColumns = ['createdAt', 'updatedAt', 'name', 'email', 'lastLoginAt'];
  const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
  const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  const usersQuery = `
    SELECT 
      id, email, name, "displayName", "firstName", "lastName", 
      "photoURL", "phoneNumber", role, permissions, department, 
      position, "isActive", "lastLoginAt", 
      "createdAt", "updatedAt"
    FROM users
    ${whereClause}
    ORDER BY "${safeSort}" ${safeOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(take, skip);
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users
    ${whereClause}
  `;
  
  const [usersResult, countResult] = await Promise.all([
    query(usersQuery, params),
    query(countQuery, params.slice(0, params.length - 2))
  ]);
  
  const users = usersResult.rows;
  const total = parseInt(countResult.rows[0].total);
  
  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const userResult = await query(
    `SELECT 
      id, email, name, "displayName", "firstName", "lastName", 
      "photoURL", "phoneNumber", role, permissions, department, 
      position, "isActive", "lastLoginAt", 
      "createdAt", "updatedAt"
     FROM users 
     WHERE id = $1`,
    [id]
  );
  
  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  
  const user = userResult.rows[0];
  
  // Get task count for this user
  const taskCountResult = await query(
    'SELECT COUNT(*) as count FROM tasks WHERE "userId" = $1',
    [id]
  );
  
  user._count = { tasks: parseInt(taskCountResult.rows[0].count) };
  
  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user: currentUser } = req;
  const updateData = req.body;
  
  // Check if user exists
  const existingUserResult = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (existingUserResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  
  // Only admin can update other users
  if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
    throw new ApiError(403, 'You can only update your own profile');
  }
  
  // Only admin can change role
  if (updateData.role && currentUser.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admins can change user roles');
  }
  
  // Check if email is being updated and if it conflicts
  if (updateData.email) {
    const emailConflictResult = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [updateData.email.toLowerCase(), id]
    );
    
    if (emailConflictResult.rows.length > 0) {
      throw new ApiError(409, 'Another user with this email already exists');
    }
  }
  
  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;
  
  const fieldMapping = {
    email: 'email',
    name: 'name',
    displayName: 'displayName',
    firstName: 'firstName',
    lastName: 'lastName',
    photoURL: 'photoURL',
    phoneNumber: 'phoneNumber',
    department: 'department',
    position: 'position',
    role: 'role',
    permissions: 'permissions',
    isActive: 'isActive',
    isVerified: 'isVerified',
  };
  
  for (const [key, dbField] of Object.entries(fieldMapping)) {
    if (updateData.hasOwnProperty(key)) {
      let value = updateData[key];
      if (key === 'email') value = value.toLowerCase();
      updateFields.push(`"${dbField}" = $${paramIndex++}`);
      updateParams.push(value);
    }
  }
  
  updateFields.push(`"updatedAt" = $${paramIndex++}`);
  updateParams.push(new Date());
  updateParams.push(id);
  
  if (updateFields.length > 1) {
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, "displayName", "firstName", "lastName", 
                "photoURL", "phoneNumber", role, permissions, department, 
                position, "isActive", "lastLoginAt", 
                "createdAt", "updatedAt"
    `;
    
    const userResult = await query(updateQuery, updateParams);
    const user = userResult.rows[0];
    
    // Log activity
    await query(
    
    logger.info(`User updated: ${user.id} by user: ${currentUser.email}`);
    
    // Track if role changed for specific event
    const roleChanged = updateData.role && updateData.role !== existingUserResult.rows[0].role;
    
    // Emit real-time events
    req.io.emit(SOCKET_EVENTS.USER_UPDATED, { 
      user, 
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date()
    });
    
    if (roleChanged) {
      req.io.emit(SOCKET_EVENTS.USER_ROLE_CHANGED, { 
        userId: user.id,
        oldRole: existingUserResult.rows[0].role,
        newRole: user.role,
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'No changes to update',
    });
  }
});

/**
 * Deactivate user
 * POST /api/users/:id/deactivate
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user: currentUser } = req;
  
  // Only admin can deactivate users
  if (currentUser.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admins can deactivate users');
  }
  
  // Check if user exists
  const userResult = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  
  // Cannot deactivate yourself
  if (currentUser.id === id) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  
  // Deactivate user
  await query(
    'UPDATE users SET "isActive" = $1, "updatedAt" = $2 WHERE id = $3',
    [false, new Date(), id]
  );
  
  // Note: With stateless JWT, tokens remain valid until expiry
  // User will be denied access when isActive check happens in auth middleware
  
  // Log activity
  await query(
  
  logger.info(`User deactivated: ${id} by admin: ${currentUser.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.USER_STATUS_CHANGED, { 
    userId: id,
    isActive: false,
    changedBy: currentUser.id,
    changedByName: currentUser.name,
    timestamp: new Date()
  });
  
  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

/**
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user: currentUser } = req;
  
  // Only admin can delete users
  if (currentUser.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admins can delete users');
  }
  
  // Check if user exists
  const userResult = await query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (userResult.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }
  
  // Cannot delete yourself
  if (currentUser.id === id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  
  // Soft delete user (set deletedAt timestamp)
  await query(
    'UPDATE users SET "deletedAt" = $1, "isActive" = $2, "updatedAt" = $3 WHERE id = $4',
    [new Date(), false, new Date(), id]
  );
  
  // Note: With stateless JWT, tokens remain valid until expiry
  // User will be denied access when isActive check happens in auth middleware
  
  // Log activity
  await query(
  
  logger.info(`User deleted: ${id} by admin: ${currentUser.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.USER_DELETED, { 
    userId: id,
    deletedBy: currentUser.id,
    deletedByName: currentUser.name,
    timestamp: new Date()
  });
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
