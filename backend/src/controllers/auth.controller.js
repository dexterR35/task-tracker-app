/**
 * Authentication Controller
 * Handles user registration, login, logout, and token refresh
 */

import prisma from '../config/database.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, displayName, department, role } = req.body;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  
  if (existingUser) {
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
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      displayName: displayName || name,
      department,
      role: role || 'USER',
      isActive: true,
      isVerified: false, // Can implement email verification later
    },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      role: true,
      department: true,
      createdAt: true,
    },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'REGISTER',
      entity: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`New user registered: ${user.email}`);
  
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
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  
  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new ApiError(403, `Account is locked. Try again in ${minutesLeft} minutes.`);
  }
  
  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive. Please contact administrator.');
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    // Increment failed login attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData = { failedLoginAttempts: failedAttempts };
    
    // Lock account after max attempts
    if (failedAttempts >= config.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + config.lockoutDuration);
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    
    throw new ApiError(401, 'Invalid email or password');
  }
  
  // Reset failed login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
  
  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  // Calculate expiration times
  const accessTokenExpiresIn = config.jwt.expiresIn;
  const accessTokenExpiry = new Date(Date.now() + parseTimeToMs(accessTokenExpiresIn));
  
  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      accessToken,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: accessTokenExpiry,
      isValid: true,
    },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`User logged in: ${user.email}`);
  
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
        expiresIn: accessTokenExpiresIn,
      },
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { session, user } = req;
  
  // Invalidate session
  await prisma.session.update({
    where: { id: session.id },
    data: { isValid: false },
  });
  
  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'LOGOUT',
      entity: 'USER',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  
  logger.info(`User logged out: ${user.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { user } = req;
  
  // Fetch full user data
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      phoneNumber: true,
      role: true,
      permissions: true,
      department: true,
      position: true,
      isActive: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: { user: userData },
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  
  if (!token) {
    throw new ApiError(400, 'Refresh token is required');
  }
  
  // Find session with refresh token
  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: true },
  });
  
  if (!session || !session.isValid) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  
  // Generate new access token
  const tokenPayload = {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
  
  const newAccessToken = generateAccessToken(tokenPayload);
  const accessTokenExpiry = new Date(Date.now() + parseTimeToMs(config.jwt.expiresIn));
  
  // Update session with new access token
  await prisma.session.update({
    where: { id: session.id },
    data: {
      accessToken: newAccessToken,
      expiresAt: accessTokenExpiry,
      lastActivityAt: new Date(),
    },
  });
  
  logger.info(`Access token refreshed for user: ${session.user.email}`);
  
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

/**
 * Helper: Parse time string to milliseconds
 */
const parseTimeToMs = (timeString) => {
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value;
  }
};
