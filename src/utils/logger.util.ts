import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '@/config';
import { firebaseLogger } from '@/services/firebase-logger.service';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for log levels
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
});

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...extra } = info;
    const log: any = {
      timestamp,
      level,
      message,
    };

    if (stack) {
      log.stack = stack;
    }

    if (Object.keys(extra).length > 0) {
      log.extra = extra;
    }

    return JSON.stringify(log);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const { timestamp, level, message, stack } = info;
    return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (config.app.env === 'development') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
}

// File transports for all environments
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: `${config.logging.filePath}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }),
  // Combined logs
  new DailyRotateFile({
    filename: `${config.logging.filePath}/combined-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  }),
  // API access logs
  new DailyRotateFile({
    filename: `${config.logging.filePath}/api-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
export const httpLoggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
export class Logger {
  static error(message: string, error?: any, meta?: any) {
    logger.error(message, { error: error?.stack || error, ...meta });

    // Also log to Firebase if enabled
    // Always log error messages to Firebase
    if (firebaseLogger.isEnabled()) {
      const firebaseLog: any = {
        timestamp: new Date(), // Ensure this is a proper Date object
        level: 'error',
        message,
        metadata: { error: error?.stack || error, ...meta },
      };

      // Only add properties if they exist
      if (meta?.userId) firebaseLog.userId = meta.userId;
      if (meta?.ip) firebaseLog.ipAddress = meta.ip;
      if (meta?.userAgent) firebaseLog.userAgent = meta.userAgent;

      firebaseLogger.logActivity(firebaseLog);
    }
  }

  static warn(message: string, meta?: any) {
    logger.warn(message, meta);

    // Also log to Firebase if enabled
    // Only log non-GET requests and error logs
    if (
      firebaseLogger.isEnabled() &&
      meta &&
      ((meta as any).method !== 'GET' || (meta as any).statusCode >= 400)
    ) {
      const firebaseLog: any = {
        timestamp: new Date(), // Ensure this is a proper Date object
        level: 'warn',
        message,
        metadata: meta,
      };

      // Only add properties if they exist
      if (meta?.userId) firebaseLog.userId = meta.userId;
      if (meta?.ip) firebaseLog.ipAddress = meta.ip;
      if (meta?.userAgent) firebaseLog.userAgent = meta.userAgent;

      firebaseLogger.logActivity(firebaseLog);
    }
  }

  static info(message: string, meta?: any) {
    logger.info(message, meta);

    // Also log to Firebase if enabled
    // Only log non-GET requests and error logs
    if (
      firebaseLogger.isEnabled() &&
      meta &&
      ((meta as any).method !== 'GET' || (meta as any).statusCode >= 400)
    ) {
      const firebaseLog: any = {
        timestamp: new Date(), // Ensure this is a proper Date object
        level: 'info',
        message,
        metadata: meta,
      };

      // Only add properties if they exist
      if (meta?.userId) firebaseLog.userId = meta.userId;
      if (meta?.ip) firebaseLog.ipAddress = meta.ip;
      if (meta?.userAgent) firebaseLog.userAgent = meta.userAgent;

      firebaseLogger.logActivity(firebaseLog);
    }
  }

  static http(message: string, meta?: any) {
    logger.http(message, meta);

    // Also log to Firebase if enabled
    // Only log non-GET requests and error logs
    if (
      firebaseLogger.isEnabled() &&
      meta &&
      ((meta as any).method !== 'GET' || (meta as any).statusCode >= 400)
    ) {
      const firebaseLog: any = {
        timestamp: new Date(), // Ensure this is a proper Date object
        level: 'http',
        message,
        metadata: meta,
      };

      // Only add properties if they exist
      if (meta?.userId) firebaseLog.userId = meta.userId;
      if (meta?.ip) firebaseLog.ipAddress = meta.ip;
      if (meta?.userAgent) firebaseLog.userAgent = meta.userAgent;

      firebaseLogger.logActivity(firebaseLog);
    }
  }

  static debug(message: string, meta?: any) {
    logger.debug(message, meta);

    // Also log to Firebase if enabled
    // Only log non-GET requests and error logs
    if (
      firebaseLogger.isEnabled() &&
      meta &&
      ((meta as any).method !== 'GET' || (meta as any).statusCode >= 400)
    ) {
      const firebaseLog: any = {
        timestamp: new Date(), // Ensure this is a proper Date object
        level: 'debug',
        message,
        metadata: meta,
      };

      // Only add properties if they exist
      if (meta?.userId) firebaseLog.userId = meta.userId;
      if (meta?.ip) firebaseLog.ipAddress = meta.ip;
      if (meta?.userAgent) firebaseLog.userAgent = meta.userAgent;

      firebaseLogger.logActivity(firebaseLog);
    }
  }

  // API-specific logging methods
  static apiRequest(req: any, meta?: any) {
    logger.http('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      ...meta,
    });
  }

  static apiResponse(req: any, res: any, responseTime?: number, meta?: any) {
    logger.http('API Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      userId: req.user?.id,
      ...meta,
    });
  }

  static apiError(req: any, error: any, meta?: any) {
    logger.error('API Error', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      error: error?.stack || error,
      ...meta,
    });
  }

  // Authentication logging
  static authSuccess(userId: string, action: string, meta?: any) {
    logger.info(`Auth Success: ${action}`, {
      userId,
      action,
      ...meta,
    });
  }

  static authFailure(action: string, reason: string, meta?: any) {
    logger.warn(`Auth Failure: ${action}`, {
      action,
      reason,
      ...meta,
    });
  }

  // Database logging
  static dbOperation(operation: string, table?: string, meta?: any) {
    logger.debug(`DB Operation: ${operation}`, {
      operation,
      table,
      ...meta,
    });
  }

  static dbError(operation: string, error: any, meta?: any) {
    logger.error(`DB Error: ${operation}`, {
      operation,
      error: error?.stack || error,
      ...meta,
    });
  }
}

export default logger;
