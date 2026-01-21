/**
 * Reporters Controller
 * Handles reporter CRUD operations
 */

import pool, { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SOCKET_EVENTS } from '../constants/index.js';

/**
 * Get all reporters
 * GET /api/reporters
 */
export const getReporters = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 100 } = req.query;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  if (isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    params.push(isActive === 'true');
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  const reportersQuery = `
    SELECT * FROM reporters
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(take, skip);
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reporters
    ${whereClause}
  `;
  
  const [reportersResult, countResult] = await Promise.all([
    query(reportersQuery, params),
    query(countQuery, params.slice(0, params.length - 2))
  ]);
  
  const reporters = reportersResult.rows;
  const total = parseInt(countResult.rows[0].total);
  
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
  
  const reporterQuery = `
    SELECT 
      r.*,
      COUNT(t.id) as task_count
    FROM reporters r
    LEFT JOIN tasks t ON r.id = t."reporterId"
    WHERE r.id = $1
    GROUP BY r.id
  `;
  
  const reporterResult = await query(reporterQuery, [id]);
  
  if (reporterResult.rows.length === 0) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  const reporter = {
    ...reporterResult.rows[0],
    _count: { tasks: parseInt(reporterResult.rows[0].task_count) },
  };
  
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
  const existingReporterResult = await query(
    'SELECT id FROM reporters WHERE email = $1',
    [reporterData.email.toLowerCase()]
  );
  
  if (existingReporterResult.rows.length > 0) {
    throw new ApiError(409, 'Reporter with this email already exists');
  }
  
  const reporterQuery = `
    INSERT INTO reporters (name, email, "phoneNumber", department, company, position, "isActive", "createdById", "createdByName")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const reporterResult = await query(reporterQuery, [
    reporterData.name,
    reporterData.email.toLowerCase(),
    reporterData.phoneNumber || null,
    reporterData.department || null,
    reporterData.company || null,
    reporterData.position || null,
    true,
    user.id,
    user.name,
  ]);
  
  const reporter = reporterResult.rows[0];
  
  // Log activity
  await query(
  
  logger.info(`Reporter created: ${reporter.email} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.REPORTER_CREATED, { 
    reporter, 
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
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
  
  // Check if reporter exists
  const existingReporterResult = await query(
    'SELECT * FROM reporters WHERE id = $1',
    [id]
  );
  
  if (existingReporterResult.rows.length === 0) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  // Check if email is being updated and if it conflicts
  if (updateData.email) {
    const emailConflictResult = await query(
      'SELECT id FROM reporters WHERE email = $1 AND id != $2',
      [updateData.email.toLowerCase(), id]
    );
    
    if (emailConflictResult.rows.length > 0) {
      throw new ApiError(409, 'Another reporter with this email already exists');
    }
  }
  
  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;
  
  const fieldMapping = {
    name: 'name',
    email: 'email',
    phoneNumber: 'phoneNumber',
    department: 'department',
    company: 'company',
    position: 'position',
    isActive: 'isActive',
  };
  
  for (const [key, dbField] of Object.entries(fieldMapping)) {
    if (updateData.hasOwnProperty(key)) {
      let value = updateData[key];
      if (key === 'email') value = value.toLowerCase();
      updateFields.push(`"${dbField}" = $${paramIndex++}`);
      updateParams.push(value);
    }
  }
  
  updateFields.push(`"updatedById" = $${paramIndex++}`);
  updateParams.push(user.id);
  updateFields.push(`"updatedByName" = $${paramIndex++}`);
  updateParams.push(user.name);
  updateFields.push(`"updatedAt" = $${paramIndex++}`);
  updateParams.push(new Date());
  updateParams.push(id);
  
  if (updateFields.length > 3) {
    const updateQuery = `
      UPDATE reporters 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const reporterResult = await query(updateQuery, updateParams);
    const reporter = reporterResult.rows[0];
    
    // Update reporter name in tasks if name changed
    if (updateData.name) {
      await query(
        'UPDATE tasks SET "reporterName" = $1 WHERE "reporterId" = $2',
        [updateData.name, id]
      );
    }
    
    // Log activity
    await query(
    
    logger.info(`Reporter updated: ${reporter.id} by user: ${user.email}`);
    
    // Emit real-time event
    req.io.emit(SOCKET_EVENTS.REPORTER_UPDATED, { 
      reporter, 
      userId: user.id,
      userName: user.name,
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Reporter updated successfully',
      data: { reporter },
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'No changes to update',
    });
  }
});

/**
 * Delete reporter
 * DELETE /api/reporters/:id
 */
export const deleteReporter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  // Check if reporter exists
  const reporterResult = await query(
    'SELECT * FROM reporters WHERE id = $1',
    [id]
  );
  
  if (reporterResult.rows.length === 0) {
    throw new ApiError(404, 'Reporter not found');
  }
  
  const reporter = reporterResult.rows[0];
  
  // Check if reporter has tasks
  const taskCountResult = await query(
    'SELECT COUNT(*) as count FROM tasks WHERE "reporterId" = $1',
    [id]
  );
  
  if (parseInt(taskCountResult.rows[0].count) > 0) {
    throw new ApiError(400, 'Cannot delete reporter with existing tasks');
  }
  
  // Delete reporter
  await query('DELETE FROM reporters WHERE id = $1', [id]);
  
  // Log activity
  await query(
  
  logger.info(`Reporter deleted: ${id} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.REPORTER_DELETED, { 
    reporterId: id,
    reporterName: reporter.name,
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
  res.status(200).json({
    success: true,
    message: 'Reporter deleted successfully',
  });
});
