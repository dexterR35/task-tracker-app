/**
 * Reporters Controller
 * Handles reporter CRUD operations
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all reporters
 * GET /api/reporters
 */
export const getReporters = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 100 } = req.query;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const [reporters, total] = await Promise.all([
    prisma.reporter.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reporter.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      reporters,
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
 * Get reporter by ID
 * GET /api/reporters/:id
 */
export const getReporterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const reporter = await prisma.reporter.findUnique({
    where: { id },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
  
  if (!reporter) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  res.status(200).json({
    success: true,
    data: { reporter },
  });
});

/**
 * Create reporter
 * POST /api/reporters
 */
export const createReporter = asyncHandler(async (req, res) => {
  const { user } = req;
  const reporterData = req.body;
  
  // Check if reporter with email already exists
  const existingReporter = await prisma.reporter.findUnique({
    where: { email: reporterData.email.toLowerCase() },
  });
  
  if (existingReporter) {
    throw new ApiError(409, 'Reporter with this email already exists');
  }
  
  const reporter = await prisma.reporter.create({
    data: {
      ...reporterData,
      email: reporterData.email.toLowerCase(),
      createdById: user.id,
      createdByName: user.name,
      isActive: true,
    },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'REPORTER',
      entityId: reporter.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Reporter created: ${reporter.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('reporter:created', { reporter });
  }
  
  res.status(201).json({
    success: true,
    message: 'Reporter created successfully',
    data: { reporter },
  });
});

/**
 * Update reporter
 * PUT /api/reporters/:id
 */
export const updateReporter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;
  
  const existingReporter = await prisma.reporter.findUnique({
    where: { id },
  });
  
  if (!existingReporter) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  // Check for email conflict if email is being updated
  if (updateData.email && updateData.email !== existingReporter.email) {
    const emailConflict = await prisma.reporter.findUnique({
      where: { email: updateData.email.toLowerCase() },
    });
    
    if (emailConflict) {
      throw new ApiError(409, 'Reporter with this email already exists');
    }
  }
  
  const reporter = await prisma.reporter.update({
    where: { id },
    data: {
      ...updateData,
      ...(updateData.email && { email: updateData.email.toLowerCase() }),
      updatedById: user.id,
      updatedByName: user.name,
    },
  });
  
  // Update reporter name in all tasks if name changed
  if (updateData.name && updateData.name !== existingReporter.name) {
    await prisma.task.updateMany({
      where: { reporterId: reporter.id },
      data: { reporterName: updateData.name },
    });
  }
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'REPORTER',
      entityId: reporter.id,
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Reporter updated: ${reporter.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('reporter:updated', { reporter });
  }
  
  res.status(200).json({
    success: true,
    message: 'Reporter updated successfully',
    data: { reporter },
  });
});

/**
 * Delete reporter
 * DELETE /api/reporters/:id
 */
export const deleteReporter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  const reporter = await prisma.reporter.findUnique({
    where: { id },
  });
  
  if (!reporter) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  // Check if reporter has tasks
  const taskCount = await prisma.task.count({
    where: { reporterId: reporter.id },
  });
  
  if (taskCount > 0) {
    throw new ApiError(400, `Cannot delete reporter with ${taskCount} associated tasks. Please reassign or delete the tasks first.`);
  }
  
  await prisma.reporter.delete({
    where: { id },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'REPORTER',
      entityId: id,
      metadata: { reporterName: reporter.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Reporter deleted: ${id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('reporter:deleted', { reporterId: id });
  }
  
  res.status(200).json({
    success: true,
    message: 'Reporter deleted successfully',
  });
});
