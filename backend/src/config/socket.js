/**
 * Socket.IO Configuration
 * Real-time WebSocket communication setup
 */

import { Server } from 'socket.io';
import config from './env.js';
import logger from '../utils/logger.js';
import { verifyToken } from '../utils/jwt.js';
import prisma from './database.js';

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origins,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST'],
    },
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval,
  });
  
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      // Extract token if it has 'Bearer ' prefix
      const actualToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Verify token
      const decoded = verifyToken(actualToken);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          userUID: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
  
  // Handle socket connections
  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: ${socket.id} - User: ${user.email}`);
    
    // Join user-specific room
    socket.join(`user:${user.userUID}`);
    
    // Join role-specific room
    socket.join(`role:${user.role}`);
    
    // Emit connection success
    socket.emit('connected', {
      message: 'Successfully connected to real-time server',
      user: {
        id: user.id,
        userUID: user.userUID,
        name: user.name,
        role: user.role,
      },
    });
    
    // Handle task-related events
    socket.on('task:subscribe', (data) => {
      const { boardId, monthId } = data;
      if (boardId) socket.join(`board:${boardId}`);
      if (monthId) socket.join(`month:${monthId}`);
      logger.debug(`User ${user.email} subscribed to task updates`);
    });
    
    socket.on('task:unsubscribe', (data) => {
      const { boardId, monthId } = data;
      if (boardId) socket.leave(`board:${boardId}`);
      if (monthId) socket.leave(`month:${monthId}`);
      logger.debug(`User ${user.email} unsubscribed from task updates`);
    });
    
    // Handle typing indicators (for collaborative features)
    socket.on('typing:start', (data) => {
      socket.broadcast.to(`board:${data.boardId}`).emit('user:typing', {
        user: { id: user.id, name: user.name },
        taskId: data.taskId,
      });
    });
    
    socket.on('typing:stop', (data) => {
      socket.broadcast.to(`board:${data.boardId}`).emit('user:stopped_typing', {
        user: { id: user.id, name: user.name },
        taskId: data.taskId,
      });
    });
    
    // Handle presence (online/offline status)
    socket.on('presence:update', async (status) => {
      try {
        // Broadcast user presence to relevant rooms
        socket.broadcast.emit('user:presence', {
          user: { id: user.id, userUID: user.userUID, name: user.name },
          status,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error updating presence:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} - User: ${user.email} - Reason: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('user:offline', {
        user: { id: user.id, userUID: user.userUID, name: user.name },
        timestamp: new Date(),
      });
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.email}:`, error);
    });
  });
  
  logger.info('Socket.IO initialized successfully');
  return io;
};

/**
 * Emit event to specific user
 * @param {Object} io - Socket.IO instance
 * @param {string} userUID - User UID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToUser = (io, userUID, event, data) => {
  io.to(`user:${userUID}`).emit(event, data);
};

/**
 * Emit event to specific role
 * @param {Object} io - Socket.IO instance
 * @param {string} role - User role
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToRole = (io, role, event, data) => {
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Emit event to specific board
 * @param {Object} io - Socket.IO instance
 * @param {string} boardId - Board ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const emitToBoard = (io, boardId, event, data) => {
  io.to(`board:${boardId}`).emit(event, data);
};

/**
 * Broadcast event to all connected clients
 * @param {Object} io - Socket.IO instance
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export const broadcastEvent = (io, event, data) => {
  io.emit(event, data);
};

export default initializeSocket;
