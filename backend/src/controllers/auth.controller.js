/**
 * Authentication Controller
 * Handles user registration, login, logout, and token refresh
 */

import pool, { query, transaction } from '../config/database.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { SOCKET_EVENTS } from '../constants/index.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, displayName, department, role } = req.body;
  
  // Check if user already exists
  const existingUserResult = await query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (existingUserResult.rows.length > 0) {
    throw new ApiError(409, 'User with this email already exists');
  }
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new ApiError(400, 'Password does not meet requirements', passwordValidation.errors);
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Create user
  const userResult = await query(
    `INSERT INTO users (email, password, name, "displayName", department, role, "isActive")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, "displayName", role, department, "createdAt"`,
    [email.toLowerCase(), hashedPassword, name, displayName || name, department, role || 'USER', true]
  );
  
  const user = userResult.rows[0];
  
  logger.info(`New user registered: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.USER_CREATED, { 
    user, 
    timestamp: new Date()
  });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const userResult = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  
  if (userResult.rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }
  
  const user = userResult.rows[0];
  
  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive. Please contact administrator.');
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }
  
  // Update last login timestamp
  await query(
    'UPDATE users SET "lastLoginAt" = $1 WHERE id = $2',
    [new Date(), user.id]
  );
  
  // Generate tokens (stateless JWT - no database storage)
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  logger.info(`User logged in: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.USER_LOGIN, { 
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    timestamp: new Date()
  });
  
  // Return user data and tokens
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        role: user.role,
        permissions: user.permissions,
        department: user.department,
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: config.jwt.expiresIn,
      },
    },
  });
});

/**
 * Logout user (Stateless - Client deletes token)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { user } = req;
  
  logger.info(`User logged out: ${user.email}`);
  
  // Emit real-time event
  req.io.emit(SOCKET_EVENTS.USER_LOGOUT, { 
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    timestamp: new Date()
  });
  
  // Note: With stateless JWT, logout is handled client-side
  // Client should delete the token from local storage
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please delete your token on the client side.',
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { user } = req;
  
  // Fetch full user data
  const userResult = await query(
    `SELECT id, email, name, "displayName", "firstName", "lastName", "photoURL", 
            "phoneNumber", role, permissions, department, position, "isActive", 
            "lastLoginAt", "createdAt", "updatedAt"
     FROM users WHERE id = $1`,
    [user.id]
  );
  
  const userData = userResult.rows[0];
  
  res.status(200).json({
    success: true,
    data: { user: userData },
  });
});

/**
 * Refresh access token (Stateless)
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  
  if (!token) {
    throw new ApiError(400, 'Refresh token is required');
  }
  
  // Verify and decode refresh token (no database lookup)
  const { verifyToken } = await import('../utils/jwt.js');
  let decoded;
  
  try {
    decoded = verifyToken(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  
  // Verify user still exists and is active
  const userResult = await query(
    'SELECT id, email, role, "isActive" FROM users WHERE id = $1',
    [decoded.userId]
  );
  
  if (userResult.rows.length === 0 || !userResult.rows[0].isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }
  
  const user = userResult.rows[0];
  
  // Generate new access token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const newAccessToken = generateAccessToken(tokenPayload);
  
  logger.info(`Access token refreshed for user: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
    },
  });
});

