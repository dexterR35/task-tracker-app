import { logger } from './logger';

// Security configuration
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  SUSPICIOUS_LOGIN_THRESHOLD: 3, // Failed attempts before suspicious
};

// Login attempt limiting utilities
export const isAccountLocked = (failedAttempts, lastFailedAttempt) => {
  if (!failedAttempts || failedAttempts < SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  if (!lastFailedAttempt) {
    return true; // Locked if max attempts reached but no timestamp
  }
  
  const timeSinceLastAttempt = Date.now() - lastFailedAttempt;
  return timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION;
};

export const getLockoutTimeRemaining = (lastFailedAttempt) => {
  if (!lastFailedAttempt) return 0;
  
  const timeSinceLastAttempt = Date.now() - lastFailedAttempt;
  const timeRemaining = SECURITY_CONFIG.LOCKOUT_DURATION - timeSinceLastAttempt;
  return Math.max(0, timeRemaining);
};

// Rate limiting utilities (for rapid attempts)
export const isRateLimited = (lastLoginAttempt) => {
  if (!lastLoginAttempt) return false;
  
  const timeSinceLastAttempt = Date.now() - lastLoginAttempt;
  // Only rate limit if the last attempt was very recent (within 5 seconds)
  return timeSinceLastAttempt < 5000; // 5 seconds instead of 1 minute
};

export const getRateLimitTimeRemaining = (lastLoginAttempt) => {
  if (!lastLoginAttempt) return 0;
  
  const timeSinceLastAttempt = Date.now() - lastLoginAttempt;
  const timeRemaining = 5000 - timeSinceLastAttempt; // 5 seconds
  return Math.max(0, timeRemaining);
};

// Security monitoring
export const detectSuspiciousActivity = (failedAttempts, lastLoginAttempt) => {
  const isSuspicious = failedAttempts >= SECURITY_CONFIG.SUSPICIOUS_LOGIN_THRESHOLD;
  
  if (isSuspicious) {
    logger.warn('Suspicious login activity detected:', {
      failedAttempts,
      lastLoginAttempt: new Date(lastLoginAttempt).toISOString(),
    });
  }
  
  return isSuspicious;
};

// Login attempt tracking
export const trackLoginAttempt = (success, email, ipAddress = null) => {
  const attempt = {
    timestamp: Date.now(),
    success,
    email,
    ipAddress,
    userAgent: navigator.userAgent,
  };
  
  logger.log('Login attempt tracked:', {
    success,
    email,
    timestamp: new Date(attempt.timestamp).toISOString(),
  });
  
  return attempt;
};

// Security validation
export const validateLoginAttempt = (email, password) => {
  const errors = [];
  
  // Basic validation
  if (!email || !email.trim()) {
    errors.push('Email is required');
  }
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Security recommendations
export const getSecurityRecommendations = (lastLogin, failedAttempts) => {
  const recommendations = [];
  
  // Check if user hasn't logged in for a while
  if (lastLogin) {
    const daysSinceLastLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastLogin > 30) {
      recommendations.push('Consider changing your password after a long period of inactivity');
    }
  }
  
  // Check for multiple failed attempts
  if (failedAttempts > 0) {
    recommendations.push('Multiple failed login attempts detected. Consider changing your password');
  }
  
  return recommendations;
};
