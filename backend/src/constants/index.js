/**
 * Backend Application Constants
 * Central location for all backend constants matching PostgreSQL schema
 *
 * Usage:
 *   import { USER_ROLES, PERMISSIONS, VALID_MARKETS } from '../constants/index.js';
 *
 *   // Validate form data
 *   if (!VALID_MARKETS.includes(market)) { throw new Error('Invalid market'); }
 *
 *   // Check permissions
 *   if (user.role === USER_ROLES.ADMIN) { ... }
 */

// ============================================================================
// DATABASE ENUMS (Match PostgreSQL Schema)
// ============================================================================

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  VIEWER: "VIEWER",
};

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  CREATE_TASKS: "create_tasks",
  UPDATE_TASKS: "update_tasks",
  DELETE_TASKS: "delete_tasks",
  VIEW_TASKS: "view_tasks",
  CREATE_BOARDS: "create_boards",
  MANAGE_REPORTERS: "manage_reporters",
  MANAGE_DELIVERABLES: "manage_deliverables",
  MANAGE_USERS: "manage_users",
  MANAGE_SETTINGS: "manage_settings",
};

// ============================================================================
// FORM OPTIONS (Must Match Frontend Exactly!)
// ============================================================================

// =============================================================================
// ROCKET TEAM - Internal Team Departments
// =============================================================================
// RocketTeam is the internal creative/development team
export const ROCKET_TEAM_DEPARTMENTS = [
  "design",
  "video",
  "developer",
];

// Alias for backward compatibility
export const USER_DEPARTMENTS = ROCKET_TEAM_DEPARTMENTS;

// =============================================================================
// CHANNEL DEPARTMENTS - External Stakeholders
// =============================================================================
// These are external departments/channels that request work from RocketTeam
export const CHANNEL_DEPARTMENTS = [
  "acquisition",
  "marketing",
  "customer_relationship_management",
  "games_team",
  "other",
  "product",
  "vip",
  "content",
  "performance_marketing_local",
  "miscellaneous",
  "human_resources",
  "acquisition_social_media",
  "brand_management",
  "search_engine_optimization",
];

// Countries
export const COUNTRIES = [
  "romania",
  "com",
  "united_kingdom",
  "ireland",
  "finland",
  "denmark",
  "germany",
  "austria",
  "italy",
  "greece",
  "france",
];

// Product Types
export const PRODUCT_TYPES = [
  "marketing_casino",
  "marketing_sport",
  "marketing_poker",
  "marketing_lotto",
  "acquisition_casino",
  "acquisition_sport",
  "acquisition_poker",
  "acquisition_lotto",
  "product_casino",
  "product_sport",
  "product_poker",
  "product_lotto",
  "miscellaneous",
];

// AI Models
export const AI_MODELS = [
  "adobe_photoshop",
  "adobe_firefly",
  "chatgpt",
  "shutterstock",
  "midjourney",
  "nightcafe",
  "freepick",
  "cursor_ai",
  "run_diffusion",
];


export const VALIDATION = {
  EMAIL_PATTERN:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(netbet\.[a-zA-Z0-9.-]+|gimo\.co\.uk)$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 255,
  COMPLEXITY_MIN: 1,
  COMPLEXITY_MAX: 10,
};

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

export const BCRYPT_ROUNDS = 12;

// ============================================================================
// PAGINATION
// ============================================================================

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================

export const SOCKET_EVENTS = {
  // Task Events
  TASK_CREATED: "task:created",
  TASK_UPDATED: "task:updated",
  TASK_DELETED: "task:deleted",
  TASK_STATUS_CHANGED: "task:status_changed",
  TASK_ASSIGNED: "task:assigned",
  
  // Deliverable Events
  DELIVERABLE_CREATED: "deliverable:created",
  DELIVERABLE_UPDATED: "deliverable:updated",
  DELIVERABLE_DELETED: "deliverable:deleted",
  
  // Reporter Events
  REPORTER_CREATED: "reporter:created",
  REPORTER_UPDATED: "reporter:updated",
  REPORTER_DELETED: "reporter:deleted",
  
  // User Events
  USER_CREATED: "user:created",
  USER_UPDATED: "user:updated",
  USER_DELETED: "user:deleted",
  USER_ROLE_CHANGED: "user:role_changed",
  USER_STATUS_CHANGED: "user:status_changed",
  
  // Board Events
  BOARD_CREATED: "board:created",
  BOARD_UPDATED: "board:updated",
  BOARD_DELETED: "board:deleted",
  
  // Authentication Events
  USER_LOGIN: "auth:user_login",
  USER_LOGOUT: "auth:user_logout",
  SESSION_EXPIRED: "auth:session_expired",
  
  // Real-time Collaboration
  FILTER_APPLIED: "filter:applied",
  BULK_ACTION: "bulk:action",
  DATA_REFRESH: "data:refresh",
};
