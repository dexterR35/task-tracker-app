/**
 * Authentication Middleware
 * Protects routes and validates JWT tokens
 */

import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { query } from '../config/database.js';
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
    
    // Get user from database (stateless - just verify user exists and is active)
    const userResult = await query(
      `SELECT id, email, name, "displayName", role, permissions, 
              department, "isActive"
       FROM users WHERE id = $1`,
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator.',
      });
    }
    
    // Attach user to request object
    req.user = user;
    
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
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].isActive) {
        req.user = userResult.rows[0];
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
