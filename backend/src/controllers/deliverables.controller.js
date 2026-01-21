/**
 * Deliverables Controller
 * Handles deliverable CRUD operations
 */

import pool, { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SOCKET_EVENTS } from '../constants/index.js';

/**
 * Get all deliverables
 * GET /api/deliverables
 */
export const getDeliverables = asyncHandler(async (req, res) => {
  const { search, department, isActive, page = 1, limit = 100 } = req.query;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  if (search) {
    conditions.push(`name ILIKE $${paramIndex}`);
    params.push(`%${search}%`);
    paramIndex++;
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
  
  const deliverablesQuery = `
    SELECT * FROM deliverables
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(take, skip);
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM deliverables
    ${whereClause}
  `;
  
  const [deliverablesResult, countResult] = await Promise.all([
    query(deliverablesQuery, params),
    query(countQuery, params.slice(0, params.length - 2))
  ]);
  
  const deliverables = deliverablesResult.rows;
  const total = parseInt(countResult.rows[0].total);
  
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
  
  const deliverableResult = await query(
    'SELECT * FROM deliverables WHERE id = $1',
    [id]
  );
  
  if (deliverableResult.rows.length === 0) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  const deliverable = deliverableResult.rows[0];
  
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
  const existingDeliverableResult = await query(
    'SELECT id FROM deliverables WHERE name = $1',
    [deliverableData.name]
  );
  
  if (existingDeliverableResult.rows.length > 0) {
    throw new ApiError(409, 'Deliverable with this name already exists');
  }
  
  const deliverableQuery = `
    INSERT INTO deliverables (name, department, "timePerUnit", "timeUnit", "variationsTime", "requiresQuantity", "isActive", "createdById", "createdByName")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  
  const deliverableResult = await query(deliverableQuery, [
    deliverableData.name,
    deliverableData.department,
    deliverableData.timePerUnit || 1.0,
    deliverableData.timeUnit || 'hr',
    deliverableData.variationsTime || 0,
    deliverableData.requiresQuantity || false,
    true,
    user.id,
    user.name,
  ]);
  
  const deliverable = deliverableResult.rows[0];
  
  // Log activity
  await query(
  
  logger.info(`Deliverable created: ${deliverable.name} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.DELIVERABLE_CREATED, { 
    deliverable, 
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
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
  
  // Check if deliverable exists
  const existingDeliverableResult = await query(
    'SELECT * FROM deliverables WHERE id = $1',
    [id]
  );
  
  if (existingDeliverableResult.rows.length === 0) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  // Check if name is being updated and if it conflicts
  if (updateData.name) {
    const nameConflictResult = await query(
      'SELECT id FROM deliverables WHERE name = $1 AND id != $2',
      [updateData.name, id]
    );
    
    if (nameConflictResult.rows.length > 0) {
      throw new ApiError(409, 'Another deliverable with this name already exists');
    }
  }
  
  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;
  
  const fieldMapping = {
    name: 'name',
    department: 'department',
    timePerUnit: 'timePerUnit',
    timeUnit: 'timeUnit',
    variationsTime: 'variationsTime',
    requiresQuantity: 'requiresQuantity',
    isActive: 'isActive',
  };
  
  for (const [key, dbField] of Object.entries(fieldMapping)) {
    if (updateData.hasOwnProperty(key)) {
      updateFields.push(`"${dbField}" = $${paramIndex++}`);
      updateParams.push(updateData[key]);
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
      UPDATE deliverables 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const deliverableResult = await query(updateQuery, updateParams);
    const deliverable = deliverableResult.rows[0];
    
    // Update deliverable name in tasks if name changed
    if (updateData.name) {
      const tasksWithDeliverableResult = await query(
        'SELECT id, "deliverableNames" FROM tasks WHERE $1 = ANY("deliverableNames")',
        [existingDeliverableResult.rows[0].name]
      );
      
      for (const task of tasksWithDeliverableResult.rows) {
        const updatedNames = task.deliverableNames.map(name => 
          name === existingDeliverableResult.rows[0].name ? updateData.name : name
        );
        
        await query(
          'UPDATE tasks SET "deliverableNames" = $1 WHERE id = $2',
          [updatedNames, task.id]
        );
      }
    }
    
    // Log activity
    await query(
    
    logger.info(`Deliverable updated: ${deliverable.id} by user: ${user.email}`);
    
    // Emit real-time event
    req.io.emit(SOCKET_EVENTS.DELIVERABLE_UPDATED, { 
      deliverable, 
      userId: user.id,
      userName: user.name,
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Deliverable updated successfully',
      data: { deliverable },
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'No changes to update',
    });
  }
});

/**
 * Delete deliverable
 * DELETE /api/deliverables/:id
 */
export const deleteDeliverable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  
  // Check if deliverable exists
  const deliverableResult = await query(
    'SELECT * FROM deliverables WHERE id = $1',
    [id]
  );
  
  if (deliverableResult.rows.length === 0) {
    throw new ApiError(404, 'Deliverable not found');
  }
  
  const deliverable = deliverableResult.rows[0];
  
  // Check if deliverable is used in tasks
  const taskCountResult = await query(
    'SELECT COUNT(*) as count FROM task_deliverables WHERE "deliverableId" = $1',
    [id]
  );
  
  if (parseInt(taskCountResult.rows[0].count) > 0) {
    throw new ApiError(400, 'Cannot delete deliverable that is used in tasks');
  }
  
  // Delete deliverable
  await query('DELETE FROM deliverables WHERE id = $1', [id]);
  
  // Log activity
  await query(
  
  logger.info(`Deliverable deleted: ${id} by user: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.DELIVERABLE_DELETED, { 
    deliverableId: id,
    deliverableName: deliverable.name,
    userId: user.id,
    userName: user.name,
    timestamp: new Date()
  });
  
  res.status(200).json({
    success: true,
    message: 'Deliverable deleted successfully',
  });
});
