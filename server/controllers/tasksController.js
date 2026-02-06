/**
 * Tasks API – tasks belong to a task_board (department + year/month).
 * All operations verify the board belongs to the user's department.
 */

import { query } from '../config/db.js';
import { resolveDepartmentId, getBoardIfAllowed } from '../utils/boardUtils.js';

function toTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    boardId: row.board_id,
    assigneeId: row.assignee_id ?? null,
    title: row.title,
    description: row.description ?? null,
    status: row.status ?? 'todo',
    dueDate: row.due_date ?? null,
    position: row.position ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** GET /api/tasks?boardId= – list tasks for a board */
export async function list(req, res, next) {
  try {
    const boardId = req.query?.boardId;
    if (!boardId) {
      return res.status(400).json({ error: 'boardId query required.', code: 'INVALID_INPUT' });
    }
    const board = await getBoardIfAllowed(req, boardId, 'task_boards');
    if (!board) {
      return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
    }
    const result = await query(
      `SELECT id, board_id, assignee_id, title, description, status, due_date, position, created_at, updated_at
       FROM tasks WHERE board_id = $1 ORDER BY position ASC, created_at ASC`,
      [boardId]
    );
    res.json({ tasks: result.rows.map(toTask) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/tasks/:id – get one task (board must belong to department) */
export async function getOne(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    const isSuperUser = req.user?.role === 'super-user';
    
    let sql = `SELECT t.id, t.board_id, t.assignee_id, t.title, t.description, t.status, t.due_date, t.position, t.created_at, t.updated_at
       FROM tasks t
       INNER JOIN task_boards b ON b.id = t.board_id
       WHERE t.id = $1`;
    const params = [req.params.id];
    
    // Only filter by department if not super-user
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $2`;
      params.push(departmentId);
    }
    
    const taskResult = await query(sql, params);
    const row = taskResult.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Task not found.', code: 'NOT_FOUND' });
    }
    res.json(toTask(row));
  } catch (err) {
    next(err);
  }
}

/** POST /api/tasks – create task. Body: { boardId, title, description?, status?, dueDate?, position?, assigneeId? } */
export async function create(req, res, next) {
  try {
    // getBoardIfAllowed handles super-user check, so we don't need to check departmentId here
    const { boardId, title, description, status, dueDate, position, assigneeId } = req.body ?? {};
    if (!boardId || !title?.trim()) {
      return res.status(400).json({ error: 'boardId and title required.', code: 'INVALID_INPUT' });
    }
    let positionVal = 0;
    if (position != null) {
      const p = parseInt(position, 10);
      if (Number.isNaN(p) || p < 0) {
        return res.status(400).json({ error: 'Invalid position (non-negative integer).', code: 'INVALID_INPUT' });
      }
      positionVal = p;
    }
    const board = await getBoardIfAllowed(req, boardId, 'task_boards');
    if (!board) {
      return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
    }
    const result = await query(
      `INSERT INTO tasks (board_id, assignee_id, title, description, status, due_date, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, board_id, assignee_id, title, description, status, due_date, position, created_at, updated_at`,
      [
        boardId,
        assigneeId ?? null,
        title.trim(),
        description?.trim() ?? null,
        status ?? 'todo',
        dueDate ?? null,
        positionVal,
      ]
    );
    const task = toTask(result.rows[0]);
    const io = req.app.get?.('io');
    if (io) io.emit('task:updated', { boardId });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/tasks/:id – update task (board must belong to department) */
export async function update(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    const isSuperUser = req.user?.role === 'super-user';
    const { title, description, status, dueDate, position, assigneeId } = req.body ?? {};
    const updates = [];
    const values = [];
    let idx = 1;
    if (title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(description?.trim() ?? null);
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(dueDate ?? null);
    }
    if (position !== undefined) {
      const p = parseInt(position, 10);
      if (Number.isNaN(p) || p < 0) {
        return res.status(400).json({ error: 'Invalid position (non-negative integer).', code: 'INVALID_INPUT' });
      }
      updates.push(`position = $${idx++}`);
      values.push(p);
    }
    if (assigneeId !== undefined) {
      updates.push(`assignee_id = $${idx++}`);
      values.push(assigneeId ?? null);
    }
    if (updates.length === 0) {
      // No updates, just fetch existing task
      let sql = `SELECT t.id, t.board_id, t.assignee_id, t.title, t.description, t.status, t.due_date, t.position, t.created_at, t.updated_at
         FROM tasks t INNER JOIN task_boards b ON b.id = t.board_id
         WHERE t.id = $1`;
      const params = [req.params.id];
      if (!isSuperUser && departmentId) {
        sql += ` AND b.department_id = $2`;
        params.push(departmentId);
      }
      const existing = await query(sql, params);
      if (!existing.rows[0]) {
        return res.status(404).json({ error: 'Task not found.', code: 'NOT_FOUND' });
      }
      return res.json(toTask(existing.rows[0]));
    }
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);
    let sql = `UPDATE tasks t SET ${updates.join(', ')}
       FROM task_boards b WHERE b.id = t.board_id AND t.id = $${idx}`;
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $${idx + 1}`;
      values.push(departmentId);
    }
    sql += ` RETURNING t.id, t.board_id, t.assignee_id, t.title, t.description, t.status, t.due_date, t.position, t.created_at, t.updated_at`;
    const result = await query(sql, values);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Task not found.', code: 'NOT_FOUND' });
    }
    const io = req.app.get?.('io');
    if (io) io.emit('task:updated', { boardId: row.board_id });
    res.json(toTask(row));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/tasks/:id */
export async function remove(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    const isSuperUser = req.user?.role === 'super-user';
    let sql = `DELETE FROM tasks t USING task_boards b
       WHERE b.id = t.board_id AND t.id = $1`;
    const params = [req.params.id];
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $2`;
      params.push(departmentId);
    }
    sql += ` RETURNING t.board_id`;
    const result = await query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.', code: 'NOT_FOUND' });
    }
    const boardId = result.rows[0]?.board_id;
    const io = req.app.get?.('io');
    if (io && boardId) io.emit('task:updated', { boardId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
