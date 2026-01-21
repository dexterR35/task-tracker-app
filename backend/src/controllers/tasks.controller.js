/**
 * Tasks Controller
 * Handles all task CRUD operations
 */

import pool, { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SOCKET_EVENTS } from '../constants/index.js';

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
  
  // Build WHERE clause conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Role-based filtering
  if (user.role === 'USER') {
    conditions.push(`t."userId" = $${paramIndex++}`);
    params.push(user.id);
  } else if (user.role === 'MANAGER' && user.department) {
    conditions.push(`$${paramIndex++} = ANY(t.departments)`);
    params.push(user.department);
  }
  
  // Apply filters
  if (monthId) {
    conditions.push(`t."monthId" = $${paramIndex++}`);
    params.push(monthId);
  }
  if (boardId) {
    conditions.push(`t."boardId" = $${paramIndex++}`);
    params.push(boardId);
  }
  if (reporterId) {
    conditions.push(`t."reporterId" = $${paramIndex++}`);
    params.push(reporterId);
  }
  if (department) {
    conditions.push(`$${paramIndex++} = ANY(t.departments)`);
    params.push(department);
  }
  if (deliverable) {
    conditions.push(`$${paramIndex++} = ANY(t."deliverableNames")`);
    params.push(deliverable);
  }
  if (products) {
    conditions.push(`t.products = $${paramIndex++}`);
    params.push(products);
  }
  if (isCompleted !== undefined) {
    conditions.push(`t."isCompleted" = $${paramIndex++}`);
    params.push(isCompleted === 'true');
  }
  if (hasAiUsed !== undefined) {
    conditions.push(`t."hasAiUsed" = $${paramIndex++}`);
    params.push(hasAiUsed === 'true');
  }
  if (isVip !== undefined) {
    conditions.push(`t."isVip" = $${paramIndex++}`);
    params.push(isVip === 'true');
  }
  
  // Search filter
  if (search) {
    conditions.push(`(t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR t.gimodear ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  
  // Valid sort columns
  const validSortColumns = ['createdAt', 'updatedAt', 'name', 'dueDate', 'complexity'];
  const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
  const safeOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
  // Fetch tasks with joins
  const tasksQuery = `
    SELECT 
      t.*,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email
      ) as user,
      json_build_object(
        'id', r.id,
        'name', r.name,
        'email', r.email
      ) as reporter,
      COALESCE(
        json_agg(
          json_build_object(
            'id', td.id,
            'quantity', td.quantity,
            'notes', td.notes,
            'deliverable', json_build_object(
              'id', d.id,
              'name', d.name,
              'description', d.description,
              'category', d.category,
              'estimatedTime', d."estimatedTime",
              'complexity', d.complexity
            )
          )
        ) FILTER (WHERE td.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM tasks t
    LEFT JOIN users u ON t."userId" = u.id
    LEFT JOIN reporters r ON t."reporterId" = r.id
    LEFT JOIN task_deliverables td ON t.id = td."taskId"
    LEFT JOIN deliverables d ON td."deliverableId" = d.id
    ${whereClause}
    GROUP BY t.id, u.id, r.id
    ORDER BY t."${safeSort}" ${safeOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(take, skip);
  
  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM tasks t
    ${whereClause}
  `;
  
  const [tasksResult, countResult] = await Promise.all([
    query(tasksQuery, params),
    query(countQuery, params.slice(0, params.length - 2)) // Exclude LIMIT/OFFSET params
  ]);
  
  const tasks = tasksResult.rows;
  const total = parseInt(countResult.rows[0].total);
  
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
  
  const taskQuery = `
    SELECT 
      t.*,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'department', u.department
      ) as user,
      json_build_object(
        'id', r.id,
        'name', r.name,
        'email', r.email,
        'phoneNumber', r."phoneNumber",
        'department', r.department
      ) as reporter,
      json_build_object(
        'id', b.id,
        'boardId', b."boardId",
        'monthId', b."monthId",
        'year', b.year,
        'month', b.month
      ) as board,
      COALESCE(
        json_agg(
          json_build_object(
            'id', td.id,
            'quantity', td.quantity,
            'notes', td.notes,
            'deliverable', json_build_object(
              'id', d.id,
              'name', d.name,
              'description', d.description,
              'category', d.category
            )
          )
        ) FILTER (WHERE td.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM tasks t
    LEFT JOIN users u ON t."userId" = u.id
    LEFT JOIN reporters r ON t."reporterId" = r.id
    LEFT JOIN boards b ON t."boardId" = b."boardId"
    LEFT JOIN task_deliverables td ON t.id = td."taskId"
    LEFT JOIN deliverables d ON td."deliverableId" = d.id
    WHERE t.id = $1
    GROUP BY t.id, u.id, r.id, b.id
  `;
  
  const taskResult = await query(taskQuery, [id]);
  
  if (taskResult.rows.length === 0) {
    throw new ApiError(404, 'Task not found');
  }
  
  const task = taskResult.rows[0];
  
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
  const boardResult = await query(
    'SELECT * FROM boards WHERE "boardId" = $1',
    [taskData.boardId]
  );
  
  if (boardResult.rows.length === 0) {
    throw new ApiError(404, 'Board not found. Please create the board first.');
  }
  
  // Check for duplicate task (if gimodear is provided)
  if (taskData.gimodear) {
    const existingTaskResult = await query(
      'SELECT id FROM tasks WHERE "userId" = $1 AND gimodear = $2 AND name = $3',
      [user.id, taskData.gimodear, taskData.name]
    );
    
    if (existingTaskResult.rows.length > 0) {
      throw new ApiError(409, 'A task with this name and gimodear already exists');
    }
  }
  
  // Create task
  const taskQuery = `
    INSERT INTO tasks (
      "userId", "boardId", "monthId", name, gimodear, description, "taskType",
      products, departments, "reporterId", "reporterName", "deliverableNames",
      "hasAiUsed", "isVip", reworked, "useShutterstock", "isCompleted",
      complexity, "estimatedTime", "actualTime", "startDate", "dueDate",
      "completedAt", tags, "createdById", "createdByName"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23, $24, $25, $26
    )
    RETURNING *
  `;
  
  const taskResult = await query(taskQuery, [
    user.id,
    taskData.boardId,
    taskData.monthId,
    taskData.name,
    taskData.gimodear || null,
    taskData.description || null,
    taskData.taskType || null,
    taskData.products || null,
    taskData.departments || [],
    taskData.reporterId || null,
    taskData.reporterName || null,
    taskData.deliverableNames || [],
    taskData.hasAiUsed || false,
    taskData.isVip || false,
    taskData.reworked || false,
    taskData.useShutterstock || false,
    taskData.isCompleted || false,
    taskData.complexity || null,
    taskData.estimatedTime || null,
    taskData.actualTime || null,
    taskData.startDate || null,
    taskData.dueDate || null,
    taskData.completedAt || null,
    taskData.tags || [],
    user.id,
    user.name,
  ]);
  
  const task = taskResult.rows[0];
  
  // Create deliverable relationships if provided
  if (taskData.deliverableNames && taskData.deliverableNames.length > 0) {
    const deliverablesResult = await query(
      'SELECT * FROM deliverables WHERE name = ANY($1)',
      [taskData.deliverableNames]
    );
    
    if (deliverablesResult.rows.length > 0) {
      const deliverableInserts = deliverablesResult.rows.map((deliverable) => 
        query(
          'INSERT INTO task_deliverables ("taskId", "deliverableId") VALUES ($1, $2)',
          [task.id, deliverable.id]
        )
      );
      await Promise.all(deliverableInserts);
    }
  }
  
  // Fetch the complete task with relations
  const completeTaskResult = await query(
    `SELECT 
      t.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
      json_build_object('id', r.id, 'name', r.name, 'email', r.email) as reporter
     FROM tasks t
     LEFT JOIN users u ON t."userId" = u.id
     LEFT JOIN reporters r ON t."reporterId" = r.id
     WHERE t.id = $1`,
    [task.id]
  );
  
  const completeTask = completeTaskResult.rows[0];
  
  // Log activity
  await query(
  
  logger.info(`Task created: ${task.id} by user: ${user.email}`);
  
  // Emit socket event (will be handled by socket.io)
  if (req.io) {
    req.io.emit(SOCKET_EVENTS.TASK_CREATED, { task: completeTask, userId: user.id, userName: user.name, timestamp: new Date() });
  }
  
  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task: completeTask },
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
  const existingTaskResult = await query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  );
  
  if (existingTaskResult.rows.length === 0) {
    throw new ApiError(404, 'Task not found');
  }
  
  const existingTask = existingTaskResult.rows[0];
  
  // Check permissions
  if (user.role === 'USER' && existingTask.userId !== user.id) {
    throw new ApiError(403, 'You can only update your own tasks');
  }
  
  // Build update query dynamically
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;
  
  const fieldMapping = {
    name: 'name',
    gimodear: 'gimodear',
    description: 'description',
    taskType: 'taskType',
    products: 'products',
    departments: 'departments',
    reporterId: 'reporterId',
    reporterName: 'reporterName',
    deliverableNames: 'deliverableNames',
    hasAiUsed: 'hasAiUsed',
    isVip: 'isVip',
    reworked: 'reworked',
    useShutterstock: 'useShutterstock',
    isCompleted: 'isCompleted',
    complexity: 'complexity',
    estimatedTime: 'estimatedTime',
    actualTime: 'actualTime',
    startDate: 'startDate',
    dueDate: 'dueDate',
    completedAt: 'completedAt',
    tags: 'tags',
  };
  
  for (const [key, dbField] of Object.entries(fieldMapping)) {
    if (updateData.hasOwnProperty(key)) {
      const value = updateData[key];
      
      updateFields.push(`"${dbField}" = $${paramIndex++}`);
      updateParams.push(value);
    }
  }
  
  // Always update the updatedAt timestamp
  updateFields.push(`"updatedAt" = $${paramIndex++}`);
  updateParams.push(new Date());
  
  // Add the ID parameter for WHERE clause
  updateParams.push(id);
  
  if (updateFields.length > 1) { // More than just updatedAt
    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    await query(updateQuery, updateParams);
  }
  
  // Update deliverable relationships if provided
  if (updateData.deliverableNames !== undefined) {
    // Remove existing relationships
    await query('DELETE FROM task_deliverables WHERE "taskId" = $1', [id]);
    
    // Create new relationships
    if (updateData.deliverableNames.length > 0) {
      const deliverablesResult = await query(
        'SELECT * FROM deliverables WHERE name = ANY($1)',
        [updateData.deliverableNames]
      );
      
      if (deliverablesResult.rows.length > 0) {
        const deliverableInserts = deliverablesResult.rows.map((deliverable) =>
          query(
            'INSERT INTO task_deliverables ("taskId", "deliverableId") VALUES ($1, $2)',
            [id, deliverable.id]
          )
        );
        await Promise.all(deliverableInserts);
      }
    }
  }
  
  // Fetch updated task with relations
  const taskQuery = `
    SELECT 
      t.*,
      json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
      json_build_object('id', r.id, 'name', r.name, 'email', r.email) as reporter,
      COALESCE(
        json_agg(
          json_build_object(
            'id', td.id,
            'deliverable', json_build_object(
              'id', d.id,
              'name', d.name,
              'description', d.description
            )
          )
        ) FILTER (WHERE td.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM tasks t
    LEFT JOIN users u ON t."userId" = u.id
    LEFT JOIN reporters r ON t."reporterId" = r.id
    LEFT JOIN task_deliverables td ON t.id = td."taskId"
    LEFT JOIN deliverables d ON td."deliverableId" = d.id
    WHERE t.id = $1
    GROUP BY t.id, u.id, r.id
  `;
  
  const taskResult = await query(taskQuery, [id]);
  const task = taskResult.rows[0];
  
  // Log activity
  await query(
  
  logger.info(`Task updated: ${task.id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit(SOCKET_EVENTS.TASK_UPDATED, { task, userId: user.id, userName: user.name, timestamp: new Date() });
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
  const taskResult = await query(
    'SELECT * FROM tasks WHERE id = $1',
    [id]
  );
  
  if (taskResult.rows.length === 0) {
    throw new ApiError(404, 'Task not found');
  }
  
  const task = taskResult.rows[0];
  
  // Check permissions
  if (user.role === 'USER' && task.userId !== user.id) {
    throw new ApiError(403, 'You can only delete your own tasks');
  }
  
  // Delete task (cascade will delete related records via database constraints)
  await query('DELETE FROM tasks WHERE id = $1', [id]);
  
  // Log activity
  await query(
  
  logger.info(`Task deleted: ${id} by user: ${user.email}`);
  
  // Emit socket event
  if (req.io) {
    req.io.emit(SOCKET_EVENTS.TASK_DELETED, { taskId: id, userId: user.id, userName: user.name, timestamp: new Date() });
  }
  
  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});
