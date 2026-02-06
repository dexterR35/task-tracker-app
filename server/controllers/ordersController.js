/**
 * Orders API – orders belong to an order_board (department + year/month).
 * Food department only (route guarded by requireDepartmentSlug('food')).
 * All operations verify the board belongs to the user's department.
 */

import { query } from '../config/db.js';
import { resolveDepartmentId, getBoardIfAllowed } from '../utils/boardUtils.js';

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

/** GET /api/orders?boardId= – list orders for a board */
export async function list(req, res, next) {
  try {
    const boardId = req.query?.boardId;
    if (!boardId) {
      return res.status(400).json({ error: 'boardId query required.', code: 'INVALID_INPUT' });
    }
    const board = await getBoardIfAllowed(req, boardId, 'order_boards');
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
    const isSuperUser = req.user?.role === 'super-user';
    
    let sql = `SELECT o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at
       FROM orders o
       INNER JOIN order_boards b ON b.id = o.board_id
       WHERE o.id = $1`;
    const params = [req.params.id];
    
    // Only filter by department if not super-user
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $2`;
      params.push(departmentId);
    }
    
    const result = await query(sql, params);
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
    // getBoardIfAllowed handles super-user check, so we don't need to check departmentId here
    const { boardId, summary, items, status, orderDate } = req.body ?? {};
    if (!boardId) {
      return res.status(400).json({ error: 'boardId required.', code: 'INVALID_INPUT' });
    }
    const board = await getBoardIfAllowed(req, boardId, 'order_boards');
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
    const order = toOrder(result.rows[0]);
    const io = req.app.get?.('io');
    if (io) io.emit('order:updated', { boardId });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/orders/:id – update order */
export async function update(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    const isSuperUser = req.user?.role === 'super-user';
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
      // No updates, just fetch existing order
      let sql = `SELECT o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at
         FROM orders o INNER JOIN order_boards b ON b.id = o.board_id
         WHERE o.id = $1`;
      const params = [req.params.id];
      if (!isSuperUser && departmentId) {
        sql += ` AND b.department_id = $2`;
        params.push(departmentId);
      }
      const existing = await query(sql, params);
      if (!existing.rows[0]) {
        return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
      }
      return res.json(toOrder(existing.rows[0]));
    }
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);
    let sql = `UPDATE orders o SET ${updates.join(', ')}
       FROM order_boards b WHERE b.id = o.board_id AND o.id = $${idx}`;
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $${idx + 1}`;
      values.push(departmentId);
    }
    sql += ` RETURNING o.id, o.board_id, o.user_id, o.order_date, o.summary, o.items, o.status, o.created_at, o.updated_at`;
    const result = await query(sql, values);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    }
    const io = req.app.get?.('io');
    if (io) io.emit('order:updated', { boardId: row.board_id });
    res.json(toOrder(row));
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/orders/:id */
export async function remove(req, res, next) {
  try {
    const departmentId = resolveDepartmentId(req);
    const isSuperUser = req.user?.role === 'super-user';
    let sql = `DELETE FROM orders o USING order_boards b
       WHERE b.id = o.board_id AND o.id = $1`;
    const params = [req.params.id];
    if (!isSuperUser && departmentId) {
      sql += ` AND b.department_id = $2`;
      params.push(departmentId);
    }
    sql += ` RETURNING o.board_id`;
    const result = await query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found.', code: 'NOT_FOUND' });
    }
    const boardId = result.rows[0]?.board_id;
    const io = req.app.get?.('io');
    if (io && boardId) io.emit('order:updated', { boardId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
