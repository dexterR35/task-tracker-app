/**
 * Orders API – orders belong to an order_board (department + year/month).
 * Food department only (route guarded by requireDepartmentSlug('food')).
 * All operations verify the board belongs to the user's department.
 */

import { query } from '../config/db.js';
import { resolveDepartmentId } from './orderBoardsController.js';

function toOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    orderDate: row.order_date ?? null,
    summary: row.summary ?? null,
    items: row.items ?? [],
    status: row.status ?? 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Ensure board exists and belongs to resolved department; returns board row or null. */
async function getBoardIfAllowed(req, boardId) {
  const departmentId = resolveDepartmentId(req);
  if (!departmentId) return null;
  const result = await query(
    `SELECT id FROM order_boards WHERE id = $1 AND department_id = $2`,
    [boardId, departmentId]
  );
  return result.rows[0] ?? null;
}

/** GET /api/orders?boardId= – list orders for a board */
export async function list(req, res, next) {
  try {
    const boardId = req.query?.boardId;
    if (!boardId) {
      return res.status(400).json({ error: 'boardId query required.', code: 'INVALID_INPUT' });
    }
    const board = await getBoardIfAllowed(req, boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
    }
    const result = await query(
      `SELECT id, board_id, user_id, order_date, summary, items, status, created_at, updated_at
       FROM orders WHERE board_id = $1 ORDER BY order_date DESC, created_at DESC`,
      [boardId]
    );
    res.json({ orders: result.rows.map(toOrder) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/:id – get one order */
export async function getOne(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const result = await query(
      `SELECT o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at
       FROM orders o
       INNER JOIN order_boards b ON b.id = o.board_id
       WHERE o.id = $1 AND b.department_id = $2`,
      [req.params.id, departmentId]
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    }
    res.json(toOrder(row));
  } catch (err) {
    next(err);
  }
}

/** POST /api/orders – create order. Body: { boardId, summary?, items?, status?, orderDate? } */
export async function create(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { boardId, summary, items, status, orderDate } = req.body ?? {};
    if (!boardId) {
      return res.status(400).json({ error: 'boardId required.', code: 'INVALID_INPUT' });
    }
    const board = await getBoardIfAllowed(req, boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found.', code: 'NOT_FOUND' });
    }
    const userId = req.user.id;
    const result = await query(
      `INSERT INTO orders (board_id, user_id, order_date, summary, items, status)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, board_id, user_id, order_date, summary, items, status, created_at, updated_at`,
      [
        boardId,
        userId,
        orderDate ?? null,
        summary?.trim() ?? null,
        JSON.stringify(Array.isArray(items) ? items : []),
        status ?? 'pending',
      ]
    );
    res.status(201).json(toOrder(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/orders/:id – update order */
export async function update(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const { summary, items, status, orderDate } = req.body ?? {};
    const updates = [];
    const values = [];
    let idx = 1;
    if (summary !== undefined) {
      updates.push(`summary = $${idx++}`);
      values.push(summary?.trim() ?? null);
    }
    if (items !== undefined) {
      updates.push(`items = $${idx++}::jsonb`);
      values.push(JSON.stringify(Array.isArray(items) ? items : []));
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (orderDate !== undefined) {
      updates.push(`order_date = $${idx++}`);
      values.push(orderDate ?? null);
    }
    if (updates.length === 0) {
      const existing = await query(
        `SELECT o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at
         FROM orders o INNER JOIN order_boards b ON b.id = o.board_id
         WHERE o.id = $1 AND b.department_id = $2`,
        [req.params.id, departmentId]
      );
      if (!existing.rows[0]) {
        return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
      }
      return res.json(toOrder(existing.rows[0]));
    }
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id, departmentId);
    const result = await query(
      `UPDATE orders o SET ${updates.join(', ')}
       FROM order_boards b WHERE b.id = o.board_id AND o.id = $${idx} AND b.department_id = $${idx + 1}
       RETURNING o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at`,
      values
    );
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    }
    res.json(toOrder(row));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/orders/:id */
export async function remove(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    if (!departmentId) {
      return res.status(403).json({ error: 'Department required.', code: 'NO_DEPARTMENT' });
    }
    const result = await query(
      `DELETE FROM orders o USING order_boards b
       WHERE b.id = o.board_id AND o.id = $1 AND b.department_id = $2
       RETURNING o.id`,
      [req.params.id, departmentId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
