/**
 * Auth audit logger – end-to-end audit for login, logout, refresh, and failed auth.
 * All entries: ts, event, ip, userAgent; auth events include userId/email where applicable.
 * Optional: set AUTH_LOG_FILE to also append JSON lines to a file for persistent audit logs.
 */

import fs from 'fs';
import path from 'path';

const AUTH_LOG_FILE = process.env.AUTH_LOG_FILE || null;

function getMeta(req) {
  const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    null;
  const userAgent = req?.get?.('user-agent') || null;
  return { ip, userAgent };
}

function getMetaFromSocket(socket) {
  const ip = socket?.handshake?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    socket?.handshake?.address ||
    null;
  const userAgent = socket?.handshake?.headers?.['user-agent'] || null;
  return { ip, userAgent };
}

function log(event, payload) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };
  const line = JSON.stringify(entry) + '\n';
  if (typeof console !== 'undefined' && console.log) {
    console.log(line.trim());
  }
  if (AUTH_LOG_FILE) {
    const filePath = path.isAbsolute(AUTH_LOG_FILE) ? AUTH_LOG_FILE : path.resolve(process.cwd(), AUTH_LOG_FILE);
    fs.appendFile(filePath, line, (err) => {
      if (err) console.error('[authLogger] Failed to write audit log:', err.message);
    });
  }
}

export const authLogger = {
  loginSuccess: (req, userId, email) => {
    log('auth.login.success', { userId, email, ...getMeta(req) });
  },
  loginFail: (req, reason, code = null) => {
    log('auth.login.fail', { reason, code, ...getMeta(req) });
  },
  logout: (req, userId, email = null) => {
    log('auth.logout', { userId, email, ...getMeta(req) });
  },
  logoutAll: (req, userId, email = null) => {
    log('auth.logout_all', { userId, email, ...getMeta(req) });
  },
  refreshSuccess: (req, userId, email) => {
    log('auth.refresh.success', { userId, email, ...getMeta(req) });
  },
  refreshFail: (req, reason, code = null) => {
    log('auth.refresh.fail', { reason, code, ...getMeta(req) });
  },
  /** Failed auth on protected route (no token, invalid, expired, user inactive). */
  authenticateFail: (req, code, detail = null) => {
    log('auth.authenticate.fail', { code, detail, ...getMeta(req) });
  },
  /** Failed role check on protected route (no user or role not allowed). */
  authorizeFail: (req, code, userId = null, role = null) => {
    log('auth.authorize.fail', { code, userId, role, ...getMeta(req) });
  },
  /** Socket connected (authenticated). */
  socketConnect: (socket) => {
    log('socket.connect', { userId: socket.userId, socketId: socket.id, ...getMetaFromSocket(socket) });
  },
  /** Socket disconnected. */
  socketDisconnect: (socket, reason) => {
    log('socket.disconnect', { userId: socket.userId, socketId: socket.id, reason, ...getMetaFromSocket(socket) });
  },
};
