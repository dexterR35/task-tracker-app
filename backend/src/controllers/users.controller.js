/**
 * Users Controller
 * Handles user management operations
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';

/**
 * Get all users (Admin only)
 * GET /api/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { search, role, isActive, page = 1, limit = 50 } = req.query;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userUID: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        permissions: true,
        department: true,
        position: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);
  
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
  const { user: currentUser } = req;
  
  // Users can only view their own profile unless admin
  if (currentUser.role !== 'ADMIN' && id !== currentUser.id) {
    throw new ApiError(403, 'Access denied');
  }
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      userUID: true,
      email: true,
      name: true,
      displayName: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      phoneNumber: true,
      role: true,
      permissions: true,
      department: true,
      position: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
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
  
  // Users can only update their own profile unless admin
  if (currentUser.role !== 'ADMIN' && id !== currentUser.id) {
    throw new ApiError(403, 'Access denied');
  }
  
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }
  
  // Non-admins cannot update role or permissions
  if (currentUser.role !== 'ADMIN') {
    delete updateData.role;
    delete updateData.permissions;
    delete updateData.isActive;
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      userUID: true,
      email: true,
      name: true,
      displayName: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      phoneNumber: true,
      role: true,
      permissions: true,
      department: true,
      position: true,
      isActive: true,
      isVerified: true,
      updatedAt: true,
    },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      entity: 'USER',
      entityId: user.id,
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`User updated: ${user.id} by user: ${currentUser.email}`);
  
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

/**
 * Update password
 * PUT /api/users/:id/password
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user: currentUser } = req;
  const { currentPassword, newPassword } = req.body;
  
  // Users can only update their own password
  if (id !== currentUser.id) {
    throw new ApiError(403, 'Access denied');
  }
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  
  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new ApiError(400, 'New password does not meet requirements', passwordValidation.errors);
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password
  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });
  
  // Invalidate all sessions except current one
  await prisma.session.updateMany({
    where: {
      userId: id,
      id: { not: req.session.id },
    },
    data: { isValid: false },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_PASSWORD',
      entity: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Password updated for user: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user: currentUser } = req;
  
  // Prevent self-deletion
  if (id === currentUser.id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
      metadata: { userName: user.name, userEmail: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`User deleted: ${id} by user: ${currentUser.email}`);
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
