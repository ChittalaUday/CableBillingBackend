import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import 'reflect-metadata';

import config from '@/config';
import { prisma } from '@/database/prisma.service';
import { ResponseUtil } from '@/utils/response.util';
import { Logger } from '@/utils/logger.util';
import { httpLogger, requestTimer, structuredApiLogger } from '@/middleware/logging.middleware';

// Import route modules
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import customersRoutes from '@/modules/customers/customers.routes';
import logsRoutes from '@/modules/logs/logs.routes';
import plansRoutes from '@/modules/plans/plans.routes';
import boxRoutes from '@/modules/box/box.routes';
import billingRoutes from '@/modules/billing/billing.routes';
// import staffRoutes from '@/modules/staff/staff.routes';
// import complaintsRoutes from '@/modules/complaints/complaints.routes';
// import notificationsRoutes from '@/modules/notifications/notifications.routes';
// import reportsRoutes from '@/modules/reports/reports.routes';

const app = express();

// Logging middleware (before other middleware)
app.use(requestTimer);
app.use(httpLogger);
app.use(structuredApiLogger);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: 429,
  },
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  ResponseUtil.success(
    res,
    {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.env,
    },
    'Server is healthy'
  );
});

// API routes
app.get('/api', (req, res) => {
  ResponseUtil.success(
    res,
    {
      name: config.app.name,
      version: config.app.version,
      description: config.app.description,
      environment: config.app.env,
    },
    'Cable Management System API'
  );
});

// Module routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/box', boxRoutes);
app.use('/api/billing', billingRoutes);
// app.use('/api/staff', staffRoutes);
// app.use('/api/complaints', complaintsRoutes);
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/reports', reportsRoutes);

// 404 handler
app.use('*', (req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Logger.apiError(req, error);

  // Handle Prisma errors
  if (error.code === 'P2002') {
    ResponseUtil.conflict(res, 'A record with this information already exists');
    return;
  }

  if (error.code === 'P2025') {
    ResponseUtil.notFound(res, 'Record not found');
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    ResponseUtil.badRequest(res, 'Validation failed', error.details);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Invalid token');
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token expired');
    return;
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message =
    config.app.env === 'development'
      ? error.message || 'Internal server error'
      : 'Internal server error';

  ResponseUtil.error(
    res,
    message,
    config.app.env === 'development' ? error.stack : undefined,
    statusCode
  );
});

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    Logger.info('Database connected successfully');

    // Start server
    const server = app.listen(config.app.port, config.app.host, () => {
      Logger.info(`Server running on http://${config.app.host}:${config.app.port}`);
      Logger.info(`Environment: ${config.app.env}`);
      Logger.info(`API Documentation: http://${config.app.host}:${config.app.port}/api-docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      Logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        Logger.info('HTTP server closed');

        try {
          await prisma.$disconnect();
          Logger.info('Database connection closed');
          Logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          Logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  Logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Start the server
startServer();