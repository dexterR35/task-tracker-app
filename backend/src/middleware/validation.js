/**
 * Request Validation Middleware
 * Validates request body, params, and query using Joi schemas
 */

import Joi from 'joi';
import { ApiError } from './errorHandler.js';

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'params', 'query')
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      throw new ApiError(400, 'Validation failed', errors);
    }
    
    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Auth Schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required',
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  displayName: Joi.string().min(2).max(100).optional(),
  department: Joi.string().max(100).optional(),
  role: Joi.string().valid('USER', 'ADMIN', 'MANAGER', 'VIEWER').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// User Schemas
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  displayName: Joi.string().min(2).max(100).optional(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  phoneNumber: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
  department: Joi.string().max(100).optional(),
  position: Joi.string().max(100).optional(),
});

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

// Task Schemas
export const createTaskSchema = Joi.object({
  name: Joi.string().min(1).max(500).required(),
  gimodear: Joi.string().max(100).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  taskType: Joi.string().max(100).optional(),
  products: Joi.string().valid('marketing', 'acquisition', 'product').optional(),
  departments: Joi.array().items(Joi.string()).optional(),
  reporterId: Joi.string().uuid().optional(),
  reporterName: Joi.string().max(200).optional(),
  deliverableNames: Joi.array().items(Joi.string()).optional(),
  hasAiUsed: Joi.boolean().optional(),
  aiUsed: Joi.any().optional(),
  isVip: Joi.boolean().optional(),
  reworked: Joi.boolean().optional(),
  useShutterstock: Joi.boolean().optional(),
  isCompleted: Joi.boolean().optional(),
  complexity: Joi.number().integer().min(1).max(10).optional(),
  estimatedTime: Joi.number().positive().optional(),
  actualTime: Joi.number().positive().optional(),
  startDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  metadata: Joi.any().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  monthId: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
    'string.pattern.base': 'monthId must be in format YYYY-MM (e.g., 2024-09)',
  }),
  boardId: Joi.string().required(),
});

export const updateTaskSchema = Joi.object({
  name: Joi.string().min(1).max(500).optional(),
  gimodear: Joi.string().max(100).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  taskType: Joi.string().max(100).optional(),
  products: Joi.string().valid('marketing', 'acquisition', 'product').optional(),
  departments: Joi.array().items(Joi.string()).optional(),
  reporterId: Joi.string().uuid().optional().allow(null),
  reporterName: Joi.string().max(200).optional().allow(''),
  deliverableNames: Joi.array().items(Joi.string()).optional(),
  hasAiUsed: Joi.boolean().optional(),
  aiUsed: Joi.any().optional(),
  isVip: Joi.boolean().optional(),
  reworked: Joi.boolean().optional(),
  useShutterstock: Joi.boolean().optional(),
  isCompleted: Joi.boolean().optional(),
  complexity: Joi.number().integer().min(1).max(10).optional(),
  estimatedTime: Joi.number().positive().optional(),
  actualTime: Joi.number().positive().optional(),
  startDate: Joi.date().optional().allow(null),
  dueDate: Joi.date().optional().allow(null),
  completedAt: Joi.date().optional().allow(null),
  metadata: Joi.any().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Reporter Schemas
export const createReporterSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().optional(),
  department: Joi.string().max(100).optional(),
  company: Joi.string().max(200).optional(),
  position: Joi.string().max(100).optional(),
});

export const updateReporterSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().optional(),
  department: Joi.string().max(100).optional(),
  company: Joi.string().max(200).optional(),
  position: Joi.string().max(100).optional(),
  isActive: Joi.boolean().optional(),
});

// Deliverable Schemas
export const createDeliverableSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional().allow(''),
  category: Joi.string().max(100).optional(),
  estimatedTime: Joi.number().positive().optional(),
  complexity: Joi.number().integer().min(1).max(10).optional(),
});

export const updateDeliverableSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  category: Joi.string().max(100).optional(),
  estimatedTime: Joi.number().positive().optional(),
  complexity: Joi.number().integer().min(1).max(10).optional(),
  isActive: Joi.boolean().optional(),
});

// Board Schemas
export const createBoardSchema = Joi.object({
  monthId: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
    'string.pattern.base': 'monthId must be in format YYYY-MM (e.g., 2024-09)',
  }),
  year: Joi.string().pattern(/^\d{4}$/).required(),
  month: Joi.string().required(),
  department: Joi.string().max(100).optional(),
  title: Joi.string().max(200).optional(),
});
