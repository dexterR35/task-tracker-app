/**
 * Boards Controller
 * Handles board/month management operations
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all boards
 * GET /api/boards
 */
export const getBoards = asyncHandler(async (req, res) => {
  const { year, department, isActive, page = 1, limit = 100 } = req.query;
  
  const where = {};
  
  if (year) {
    where.year = year;
  }
  
  if (department) {
    where.department = department;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const [boards, total] = await Promise.all([
    prisma.board.findMany({
      where,
      skip,
      take,
      orderBy: { monthId: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    }),
    prisma.board.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      boards,
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
 * Get board by ID
 * GET /api/boards/:id
 */
export const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
  
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  
  res.status(200).json({
    success: true,
    data: { board },
  });
});

/**
 * Get board by monthId
 * GET /api/boards/month/:monthId
 */
export const getBoardByMonthId = asyncHandler(async (req, res) => {
  const { monthId } = req.params;
  
  const board = await prisma.board.findUnique({
    where: { monthId },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
  
  if (!board) {
    throw new ApiError(404, 'Board not found for this month');
  }
  
  res.status(200).json({
    success: true,
    data: { board },
  });
});

/**
 * Create board
 * POST /api/boards
 */
export const createBoard = asyncHandler(async (req, res) => {
  const { user } = req;
  const { monthId, year, month, department, title } = req.body;
  
  // Check if board for this month already exists
  const existingBoard = await prisma.board.findUnique({
    where: { monthId },
  });
  
  if (existingBoard) {
    throw new ApiError(409, 'Board for this month already exists');
  }
  
  const board = await prisma.board.create({
    data: {
      boardId: uuidv4(),
      monthId,
      year,
      month,
      department: department || 'design',
      title: title || `${month} ${year} Board`,
      isActive: true,
      isClosed: false,
      createdBy: user.id,
      createdByName: user.name,
    },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      entity: 'BOARD',
      entityId: board.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Board created: ${board.id} for month: ${monthId} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('board:created', { board });
  }
  
  res.status(201).json({
    success: true,
    message: 'Board created successfully',
    data: { board },
  });
});

/**
 * Update board
 * PUT /api/boards/:id
 */
export const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const updateData = req.body;
  
  const existingBoard = await prisma.board.findUnique({
    where: { id },
  });
  
  if (!existingBoard) {
    throw new ApiError(404, 'Board not found');
  }
  
  const board = await prisma.board.update({
    where: { id },
    data: updateData,
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      entity: 'BOARD',
      entityId: board.id,
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Board updated: ${board.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('board:updated', { board });
  }
  
  res.status(200).json({
    success: true,
    message: 'Board updated successfully',
    data: { board },
  });
});

/**
 * Delete board
 * DELETE /api/boards/:id
 */
export const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  const board = await prisma.board.findUnique({
    where: { id },
  });
  
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  
  // Check if board has tasks
  const taskCount = await prisma.task.count({
    where: { boardId: board.boardId },
  });
  
  if (taskCount > 0) {
    throw new ApiError(400, `Cannot delete board with ${taskCount} associated tasks. Please delete the tasks first.`);
  }
  
  await prisma.board.delete({
    where: { id },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'DELETE',
      entity: 'BOARD',
      entityId: id,
      metadata: { monthId: board.monthId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`Board deleted: ${id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit('board:deleted', { boardId: id });
  }
  
  res.status(200).json({
    success: true,
    message: 'Board deleted successfully',
  });
});
