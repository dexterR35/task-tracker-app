# Production-Ready Express Routes Guide

This document outlines the production-ready improvements made to the Express API routes.

## Key Improvements

### 1. Input Validation (`server/middleware/validation.js`)

Comprehensive validation middleware that validates and sanitizes request data:

```javascript
import { validateBody, validateQuery } from '../middleware/validation.js';

// Example usage in routes
router.post(
  '/',
  validateBody({
    title: 'required|string|min:1|max:500',
    email: 'required|email',
    status: 'optional|enum:todo,in-progress,completed',
    boardId: 'required|uuid',
  }),
  controller.create
);
```

**Validation Rules:**
- `required` - Field must be present
- `optional` - Field can be omitted
- `string` - Must be a string
- `uuid` - Must be a valid UUID
- `email` - Must be a valid email
- `integer` - Must be an integer
- `date` - Must be a valid date (ISO format)
- `enum:value1,value2` - Must be one of the specified values
- `array` - Must be an array
- `min:N` - Minimum length/value
- `max:N` - Maximum length/value

### 2. Error Handling (`server/middleware/errorHandler.js`)

Standardized error handling with proper error codes and messages:

```javascript
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// In controllers
export const create = asyncHandler(async (req, res) => {
  // Your code here
  // Errors are automatically caught and handled
});

// Or throw custom errors
throw new ApiError('Custom message', 400, 'CUSTOM_CODE');
```

**Error Types Handled:**
- Database errors (PostgreSQL error codes)
- JWT errors (expired, invalid)
- Validation errors
- Custom API errors
- Unknown errors (with safe production messages)

### 3. Request Logging (`server/middleware/requestLogger.js`)

Structured logging for all requests:

- Logs method, URL, status code, response time
- Includes request ID for tracing
- Logs at appropriate levels (error/warn/info)
- JSON format in production for log aggregation

### 4. Structured Logging (`server/utils/logger.js`)

Production-ready logger with levels:

```javascript
import { logger } from '../utils/logger.js';

logger.error('Error message', { additional: 'data' });
logger.warn('Warning message', { context: 'info' });
logger.info('Info message', { details: 'data' });
logger.debug('Debug message', { debug: 'info' });
```

**Log Levels:**
- `error` - Errors that need attention
- `warn` - Warnings
- `info` - General information
- `debug` - Debug information (development only)

Set `LOG_LEVEL` environment variable to control logging.

### 5. Database Transactions (`server/utils/transactions.js`)

Safe transaction handling:

```javascript
import { withTransaction } from '../utils/transactions.js';

await withTransaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  // Automatically commits on success, rolls back on error
});
```

### 6. Security Enhancements

**Request Size Limits:**
- JSON body: 10MB (configurable via `MAX_BODY_SIZE`)
- URL-encoded: 10MB

**Compression:**
- Gzip compression for responses > 1KB
- Reduces bandwidth usage

**Helmet Security Headers:**
- HSTS in production
- XSS protection
- Content type sniffing protection

### 7. Response Compression

Automatic compression of responses:
- Reduces bandwidth usage
- Improves response times
- Configurable compression level

## Environment Variables

Add these to your `.env` file:

```bash
# Logging
LOG_LEVEL=info  # error, warn, info, debug

# Request Limits
MAX_BODY_SIZE=10mb

# Rate Limiting (already configured)
API_RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=20
AUTH_REFRESH_RATE_LIMIT_MAX=50
```

## Migration Guide

### Updating Existing Routes

1. **Add validation middleware:**

```javascript
// Before
router.post('/', controller.create);

// After
router.post(
  '/',
  validateBody({ title: 'required|string|max:500' }),
  asyncHandler(controller.create)
);
```

2. **Use asyncHandler for controllers:**

```javascript
// Before
export async function create(req, res, next) {
  try {
    // code
  } catch (err) {
    next(err);
  }
}

// After
export const create = asyncHandler(async (req, res) => {
  // code - errors automatically handled
});
```

3. **Use sanitized data:**

```javascript
// Access sanitized body
const { title, status } = req.sanitizedBody || req.body;
```

## Best Practices

1. **Always validate input** - Use validation middleware
2. **Use asyncHandler** - Automatic error handling
3. **Log appropriately** - Use structured logging
4. **Handle database errors** - Use transactions for multi-step operations
5. **Return consistent responses** - Use error handler for consistent format
6. **Set appropriate status codes** - 200, 201, 400, 401, 403, 404, 500

## Example: Complete Route with All Features

```javascript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import * as controller from '../controllers/exampleController.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  validateQuery({ boardId: 'required|uuid' }),
  asyncHandler(controller.list)
);

router.post(
  '/',
  validateBody({
    title: 'required|string|min:1|max:500',
    status: 'optional|enum:todo,in-progress,completed',
  }),
  asyncHandler(controller.create)
);

export default router;
```

## Monitoring

In production, monitor:
- Request logs (status codes, response times)
- Error logs (error types, frequencies)
- Database query performance
- Rate limit hits
- Authentication failures

Use log aggregation tools (e.g., ELK, Datadog, CloudWatch) to analyze structured JSON logs.
