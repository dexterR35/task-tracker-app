/**
 * Main Server File
 * Task Tracker PERN Stack Backend with Socket.IO
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Config imports
import config from './src/config/env.js';
import prisma, { testConnection, disconnectDatabase } from './src/config/database.js';
import { initializeSocket } from './src/config/socket.js';
import logger from './src/utils/logger.js';

// Middleware imports
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import tasksRoutes from './src/routes/tasks.routes.js';
import reportersRoutes from './src/routes/reporters.routes.js';
import deliverablesRoutes from './src/routes/deliverables.routes.js';
import boardsRoutes from './src/routes/boards.routes.js';

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      error: error.message,
    });
  }
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Task Tracker API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      reporters: '/api/reporters',
      deliverables: '/api/deliverables',
      boards: '/api/boards',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reporters', reportersRoutes);
app.use('/api/deliverables', deliverablesRoutes);
app.use('/api/boards', boardsRoutes);

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start server
    const PORT = config.port;
    const HOST = config.host;
    
    httpServer.listen(PORT, HOST, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Task Tracker API Server Running                         ║
║                                                               ║
║   Environment: ${config.env.padEnd(44)}║
║   Server:      http://${HOST}:${PORT}${' '.repeat(32 - HOST.length - PORT.toString().length)}║
║   Health:      http://${HOST}:${PORT}/health${' '.repeat(24 - HOST.length - PORT.toString().length)}║
║   API:         http://${HOST}:${PORT}/api${' '.repeat(27 - HOST.length - PORT.toString().length)}║
║                                                               ║
║   Socket.IO:   ✅ Enabled (Real-time features active)        ║
║   Database:    ✅ PostgreSQL Connected                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Close Socket.IO connections
    io.close(() => {
      logger.info('Socket.IO connections closed');
    });
    
    // Disconnect database
    await disconnectDatabase();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();

export default app;
