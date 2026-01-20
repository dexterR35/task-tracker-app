/**
 * Deliverables Controller
 * Handles deliverable CRUD operations
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all deliverables
 * GET /api/deliverables
 */
export const getDeliverables = asyncHandler(async (req, res) => {
  const { search, category, isActive, page = 1, limit = 100 } = req.query;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.category = category;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const [deliverables, total] = await Promise.all([
    prisma.deliverable.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
    }),
    prisma.deliverable.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      deliverables,
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
 * Get deliverable by ID
 * GET /api/deliverables/:id
 */
export const getDeliverableById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
  
  if (!deliverable) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  res.status(200).json({
    success: true,
    data: { deliverable },
  });
});

/**
 * Create deliverable
 * POST /api/deliverables
 */
export const createDeliverable = asyncHandler(async (req, res) => {
  const { user } = req;
  const deliverableData = req.body;
  
  // Check if deliverable with name already exists
  const existingDeliverable = await prisma.deliverable.findUnique({
    where: { name: deliverableData.name },
  });
  
  if (existingDeliverable) {
    throw new ApiError(409, 'Deliverable with this name already exists');
  }
  
  const deliverable = await prisma.deliverable.create({
    data: {
      ...deliverableData,
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
      entity: 'DELIVERABLE',
      entityId: deliverable.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Deliverable created: ${deliverable.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('deliverable:created', { deliverable });
  }
  
  res.status(201).json({
    success: true,
    message: 'Deliverable created successfully',
    data: { deliverable },
  });
});

/**
 * Update deliverable
 * PUT /api/deliverables/:id
 */
export const updateDeliverable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;
  
  const existingDeliverable = await prisma.deliverable.findUnique({
    where: { id },
  });
  
  if (!existingDeliverable) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  // Check for name conflict if name is being updated
  if (updateData.name && updateData.name !== existingDeliverable.name) {
    const nameConflict = await prisma.deliverable.findUnique({
      where: { name: updateData.name },
    });
    
    if (nameConflict) {
      throw new ApiError(409, 'Deliverable with this name already exists');
    }
  }
  
  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: user.id,
      updatedByName: user.name,
    },
  });
  
  // Update deliverable name in all tasks if name changed
  if (updateData.name && updateData.name !== existingDeliverable.name) {
    // Update deliverableNames array in tasks
    const tasksWithDeliverable = await prisma.task.findMany({
      where: {
        deliverableNames: {
          has: existingDeliverable.name,
        },
      },
    });
    
    for (const task of tasksWithDeliverable) {
      const updatedNames = task.deliverableNames.map((name) =>
        name === existingDeliverable.name ? updateData.name : name
      );
      
      await prisma.task.update({
        where: { id: task.id },
        data: { deliverableNames: updatedNames },
      });
    }
  }
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'DELIVERABLE',
      entityId: deliverable.id,
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Deliverable updated: ${deliverable.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('deliverable:updated', { deliverable });
  }
  
  res.status(200).json({
    success: true,
    message: 'Deliverable updated successfully',
    data: { deliverable },
  });
});

/**
 * Delete deliverable
 * DELETE /api/deliverables/:id
 */
export const deleteDeliverable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
  });
  
  if (!deliverable) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  // Check if deliverable has tasks
  const taskCount = await prisma.taskDeliverable.count({
    where: { deliverableId: id },
  });
  
  if (taskCount > 0) {
    throw new ApiError(400, `Cannot delete deliverable with ${taskCount} associated tasks. Please remove it from tasks first.`);
  }
  
  await prisma.deliverable.delete({
    where: { id },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'DELIVERABLE',
      entityId: id,
      metadata: { deliverableName: deliverable.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Deliverable deleted: ${id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('deliverable:deleted', { deliverableId: id });
  }
  
  res.status(200).json({
    success: true,
    message: 'Deliverable deleted successfully',
  });
});
