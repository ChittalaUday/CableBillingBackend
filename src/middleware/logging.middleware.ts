import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { Logger, httpLoggerStream } from '@/utils/logger.util';
import config from '@/config';

// Custom Morgan token for response time
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const startTime = res.locals['startTime'];
  return startTime ? `${Date.now() - startTime}ms` : '-';
});

// Custom Morgan token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.id || 'anonymous';
});

// Define log format based on environment
const getLogFormat = () => {
  if (config.app.env === 'production') {
    return ':remote-addr - :user-id [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';
  } else {
    return ':method :url :status :response-time-ms - :res[content-length]';
  }
};

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  res.locals['startTime'] = Date.now();
  next();
};

// Enhanced request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log incoming request
  Logger.apiRequest(req);

  // Store original res.end to capture response
  const originalEnd = res.end;

  (res as any).end = function (chunk?: any, encoding?: any) {
    const responseTime = res.locals['startTime'] ? Date.now() - res.locals['startTime'] : undefined;

    // Log response
    Logger.apiResponse(req, res, responseTime);

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: any, req: Request, res: Response, next: NextFunction) => {
  Logger.apiError(req, error);
  next(error);
};

// Morgan HTTP logger with Winston integration
export const httpLogger = morgan(getLogFormat(), {
  stream: httpLoggerStream,
  skip: (req: Request, res: Response) => {
    // Skip health check and static assets in production
    if (config.app.env === 'production') {
      return req.originalUrl === '/health' || req.originalUrl.startsWith('/static');
    }
    return false;
  },
});

// Middleware for structured API logging
export const structuredApiLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Store original res.json to capture response data
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log structured API response
    Logger.info('API Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: res.statusCode < 400,
    });

    return originalJson.call(this, body);
  };

  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Log structured API response for non-JSON responses
    Logger.info('API Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: res.statusCode < 400,
    });

    return originalSend.call(this, body);
  };

  next();
};
