/**
 * Boards Controller
 * Handles board/month management operations
 */

import pool, { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { SOCKET_EVENTS } from '../constants/index.js';

/**
 * Get all boards
 * GET /api/boards
 */
export const getBoards = asyncHandler(async (req, res) => {
  const { year, department, isActive, page = 1, limit = 100 } = req.query;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  if (year) {
    conditions.push(`year = $${paramIndex++}`);
    params.push(year);
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
  
  const boardsQuery = `
    SELECT 
      b.*,
      COUNT(t.id) as task_count
    FROM boards b
    LEFT JOIN tasks t ON b."boardId" = t."boardId"
    ${whereClause}
    GROUP BY b.id
    ORDER BY b."monthId" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(take, skip);
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM boards
    ${whereClause}
  `;
  
  const [boardsResult, countResult] = await Promise.all([
    query(boardsQuery, params),
    query(countQuery, params.slice(0, params.length - 2))
  ]);
  
  const boards = boardsResult.rows.map(board => ({
    ...board,
    _count: { tasks: parseInt(board.task_count) },
  }));
  
  const total = parseInt(countResult.rows[0].total);
  
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
  
  const boardQuery = `
    SELECT 
      b.*,
      COUNT(t.id) as task_count
    FROM boards b
    LEFT JOIN tasks t ON b."boardId" = t."boardId"
    WHERE b.id = $1
    GROUP BY b.id
  `;
  
  const boardResult = await query(boardQuery, [id]);
  
  if (boardResult.rows.length === 0) {
    throw new ApiError(404, 'Board not found');
  }
  
  const board = {
    ...boardResult.rows[0],
    _count: { tasks: parseInt(boardResult.rows[0].task_count) },
  };
  
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
  
  const boardQuery = `
    SELECT 
      b.*,
      COUNT(t.id) as task_count
    FROM boards b
    LEFT JOIN tasks t ON b."boardId" = t."boardId"
    WHERE b."monthId" = $1
    GROUP BY b.id
  `;
  
  const boardResult = await query(boardQuery, [monthId]);
  
  if (boardResult.rows.length === 0) {
    throw new ApiError(404, 'Board not found for this month');
  }
  
  const board = {
    ...boardResult.rows[0],
    _count: { tasks: parseInt(boardResult.rows[0].task_count) },
  };
  
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
  const existingBoardResult = await query(
    'SELECT id FROM boards WHERE "monthId" = $1',
    [monthId]
  );
  
  if (existingBoardResult.rows.length > 0) {
    throw new ApiError(409, 'Board for this month already exists');
  }
  
  const boardQuery = `
    INSERT INTO boards ("boardId", "monthId", year, month, department, title, "isActive", "isClosed", "createdBy", "createdByName")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const boardResult = await query(boardQuery, [
    uuidv4(),
    monthId,
    year,
    month,
    department || 'design',
    title || `${month} ${year} Board`,
    true,
    false,
    user.id,
    user.name,
  ]);
  
  const board = boardResult.rows[0];
  
  // Log activity
  await query(
  
  logger.info(`Board created: ${board.monthId} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.BOARD_CREATED, { 
    board, 
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
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
  
  // Check if board exists
  const existingBoardResult = await query(
    'SELECT * FROM boards WHERE id = $1',
    [id]
  );
  
  if (existingBoardResult.rows.length === 0) {
    throw new ApiError(404, 'Board not found');
  }
  
  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;
  
  const fieldMapping = {
    title: 'title',
    department: 'department',
    isActive: 'isActive',
    isClosed: 'isClosed',
  };
  
  for (const [key, dbField] of Object.entries(fieldMapping)) {
    if (updateData.hasOwnProperty(key)) {
      updateFields.push(`"${dbField}" = $${paramIndex++}`);
      updateParams.push(updateData[key]);
    }
  }
  
  updateFields.push(`"updatedAt" = $${paramIndex++}`);
  updateParams.push(new Date());
  updateParams.push(id);
  
  if (updateFields.length > 1) {
    const updateQuery = `
      UPDATE boards 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const boardResult = await query(updateQuery, updateParams);
    const board = boardResult.rows[0];
    
    // Log activity
    await query(
    
    logger.info(`Board updated: ${board.id} by user: ${user.email}`);
    
    // Emit real-time event
    req.io.emit(SOCKET_EVENTS.BOARD_UPDATED, { 
      board, 
      userId: user.id,
      userName: user.name,
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      data: { board },
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'No changes to update',
    });
  }
});

/**
 * Delete board
 * DELETE /api/boards/:id
 */
export const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  // Check if board exists
  const boardResult = await query(
    'SELECT * FROM boards WHERE id = $1',
    [id]
  );
  
  if (boardResult.rows.length === 0) {
    throw new ApiError(404, 'Board not found');
  }
  
  const board = boardResult.rows[0];
  
  // Check if board has tasks
  const taskCountResult = await query(
    'SELECT COUNT(*) as count FROM tasks WHERE "boardId" = $1',
    [board.boardId]
  );
  
  if (parseInt(taskCountResult.rows[0].count) > 0) {
    throw new ApiError(400, 'Cannot delete board with existing tasks');
  }
  
  // Delete board
  await query('DELETE FROM boards WHERE id = $1', [id]);
  
  // Log activity
  await query(
  
  logger.info(`Board deleted: ${id} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.BOARD_DELETED, { 
    boardId: id,
    monthId: board.monthId,
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
  res.status(200).json({
    success: true,
    message: 'Board deleted successfully',
  });
});
