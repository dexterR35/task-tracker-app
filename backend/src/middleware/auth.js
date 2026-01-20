/**
 * Authentication Middleware
 * Protects routes and validates JWT tokens
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Authenticate user from JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
    }
    
    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { accessToken: token },
    });
    
    if (!session || !session.isValid) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid or expired',
      });
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await prisma.session.update({
        where: { id: session.id },
        data: { isValid: false },
      });
      
      return res.status(401).json({
        success: false,
        message: 'Session expired',
      });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        userUID: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        permissions: true,
        department: true,
        isActive: true,
        isVerified: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.',
      });
    }
    
    // Update session last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });
    
    // Attach user to request object
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Check if user has specific role
 * @param {...string} allowedRoles - Roles that are allowed
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Access denied.',
      });
    }
    
    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Required permission
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Admin has all permissions
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' required. Access denied.`,
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Continue without user if token is invalid
      logger.debug('Optional auth failed:', error.message);
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};
