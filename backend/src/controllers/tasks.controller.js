/**
 * Tasks Controller
 * Handles all task CRUD operations
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all tasks with filtering, pagination, and sorting
 * GET /api/tasks
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { user } = req;
  const {
    monthId,
    boardId,
    reporterId,
    department,
    deliverable,
    products,
    isCompleted,
    hasAiUsed,
    isVip,
    search,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;
  
  // Build where clause
  const where = {};
  
  // Role-based filtering
  if (user.role === 'USER') {
    where.userId = user.id;
  } else if (user.role === 'MANAGER' && user.department) {
    where.departments = { has: user.department };
  }
  
  // Apply filters
  if (monthId) where.monthId = monthId;
  if (boardId) where.boardId = boardId;
  if (reporterId) where.reporterId = reporterId;
  if (department) where.departments = { has: department };
  if (deliverable) where.deliverableNames = { has: deliverable };
  if (products) where.products = products;
  if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
  if (hasAiUsed !== undefined) where.hasAiUsed = hasAiUsed === 'true';
  if (isVip !== undefined) where.isVip = isVip === 'true';
  
  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { gimodear: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  // Fetch tasks and count
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliverables: {
          include: {
            deliverable: true,
          },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      tasks,
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
 * Get task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          userUID: true,
          name: true,
          email: true,
          department: true,
        },
      },
      reporter: true,
      board: true,
      deliverables: {
        include: {
          deliverable: true,
        },
      },
    },
  });
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  
  // Check permissions
  if (user.role === 'USER' && task.userId !== user.id) {
    throw new ApiError(403, 'Access denied');
  }
  
  res.status(200).json({
    success: true,
    data: { task },
  });
});

/**
 * Create new task
 * POST /api/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
  const { user } = req;
  const taskData = req.body;
  
  // Get or create board
  let board = await prisma.board.findUnique({
    where: { boardId: taskData.boardId },
  });
  
  if (!board) {
    throw new ApiError(404, 'Board not found. Please create the board first.');
  }
  
  // Check for duplicate task
  const existingTask = await prisma.task.findUnique({
    where: {
      userId_gimodear_name: {
        userId: user.id,
        gimodear: taskData.gimodear || '',
        name: taskData.name,
      },
    },
  });
  
  if (existingTask) {
    throw new ApiError(409, 'A task with this name and gimodear already exists');
  }
  
  // Create task
  const task = await prisma.task.create({
    data: {
      ...taskData,
      userId: user.id,
      createdById: user.id,
      createdByName: user.name,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reporter: true,
    },
  });
  
  // Create deliverable relationships if provided
  if (taskData.deliverableNames && taskData.deliverableNames.length > 0) {
    const deliverables = await prisma.deliverable.findMany({
      where: {
        name: { in: taskData.deliverableNames },
      },
    });
    
    if (deliverables.length > 0) {
      await prisma.taskDeliverable.createMany({
        data: deliverables.map((deliverable) => ({
          taskId: task.id,
          deliverableId: deliverable.id,
        })),
      });
    }
  }
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'TASK',
      entityId: task.id,
      taskId: task.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Task created: ${task.id} by user: ${user.email}`);
  
  // Emit socket event (will be handled by socket.io)
  if (req.io) {
    req.io.emit('task:created', { task, userId: user.id });
  }
  
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

/**
 * Update task
 * PUT /api/tasks/:id
 */
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;
  
  // Check if task exists
  const existingTask = await prisma.task.findUnique({
    where: { id },
  });
  
  if (!existingTask) {
    throw new ApiError(404, 'Task not found');
  }
  
  // Check permissions
  if (user.role === 'USER' && existingTask.userId !== user.id) {
    throw new ApiError(403, 'You can only update your own tasks');
  }
  
  // Update task
  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          userUID: true,
          name: true,
          email: true,
        },
      },
      reporter: true,
      deliverables: {
        include: {
          deliverable: true,
        },
      },
    },
  });
  
  // Update deliverable relationships if provided
  if (updateData.deliverableNames !== undefined) {
    // Remove existing relationships
    await prisma.taskDeliverable.deleteMany({
      where: { taskId: id },
    });
    
    // Create new relationships
    if (updateData.deliverableNames.length > 0) {
      const deliverables = await prisma.deliverable.findMany({
        where: {
          name: { in: updateData.deliverableNames },
        },
      });
      
      if (deliverables.length > 0) {
        await prisma.taskDeliverable.createMany({
          data: deliverables.map((deliverable) => ({
            taskId: id,
            deliverableId: deliverable.id,
          })),
        });
      }
    }
  }
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'TASK',
      entityId: task.id,
      taskId: task.id,
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Task updated: ${task.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('task:updated', { task, userId: user.id });
  }
  
  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task },
  });
});

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id },
  });
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  
  // Check permissions
  if (user.role === 'USER' && task.userId !== user.id) {
    throw new ApiError(403, 'You can only delete your own tasks');
  }
  
  // Delete task (cascade will delete related records)
  await prisma.task.delete({
    where: { id },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'TASK',
      entityId: id,
      metadata: { taskName: task.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Task deleted: ${id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('task:deleted', { taskId: id, userId: user.id });
  }
  
  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});
