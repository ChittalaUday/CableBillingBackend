import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/database/prisma.service';
import config from '@/config';
import { ResponseUtil } from '@/utils/response.util';
import { JwtPayload, AuthenticatedUser } from '@/types/common.types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      customer?: any; // Add customer interface
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface CustomerAuthenticatedRequest extends Request {
  customer: any;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      ResponseUtil.unauthorized(res, 'Authorization header missing');
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      ResponseUtil.unauthorized(res, 'Token missing from authorization header');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        phone: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      ResponseUtil.unauthorized(res, 'User not found');
      return;
    }

    if (!user.isActive) {
      ResponseUtil.unauthorized(res, 'Account is deactivated');
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, 'Invalid token');
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtil.unauthorized(res, 'Token expired');
      return;
    }

    console.error('Authentication error:', error);
    ResponseUtil.error(res, 'Authentication failed', undefined, 500);
  }
};

/**
 * Role-based Authorization Middleware Factory
 * Creates middleware that checks if user has required role(s)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    const hasRequiredRole = allowedRoles.includes(req.user.role);

    if (!hasRequiredRole) {
      ResponseUtil.forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      return;
    }

    next();
  };
};

/**
 * Admin Only Authorization
 */
export const adminOnly = authorize('ADMIN');

/**
 * Manager or Admin Authorization
 */
export const managerOrAdmin = authorize('ADMIN', 'MANAGER');

/**
 * Staff and above Authorization (STAFF, MANAGER, ADMIN)
 */
export const staffAndAbove = authorize('ADMIN', 'MANAGER', 'STAFF');

/**
 * Customer JWT Authentication Middleware
 * Verifies JWT token for customer and attaches customer to request
 */
export const authenticateCustomerJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      ResponseUtil.unauthorized(res, 'Authorization header missing');
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      ResponseUtil.unauthorized(res, 'Token missing from authorization header');
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Get customer from database
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        connectionType: true,
        packageType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      ResponseUtil.unauthorized(res, 'Customer not found');
      return;
    }

    if (customer.status !== 'ACTIVE') {
      ResponseUtil.unauthorized(res, 'Customer account is not active');
      return;
    }

    // Attach customer to request
    req.customer = customer;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, 'Invalid token');
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtil.unauthorized(res, 'Token expired');
      return;
    }

    console.error('Customer authentication error:', error);
    ResponseUtil.error(res, 'Authentication failed', undefined, 500);
  }
};

/**
 * Owner or Admin Authorization
 * Allows access if user is the resource owner or has admin privileges
 */
export const ownerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      ResponseUtil.forbidden(
        res,
        'Access denied. You can only access your own resources or be an admin.'
      );
      return;
    }

    next();
  };
};

/**
 * Self or Manager/Admin Authorization
 * Allows users to access their own data or managers/admins to access any user data
 */
export const selfOrManagerAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res, 'Authentication required');
    return;
  }

  const targetUserId = req.params['id'] || req.params['userId'];
  const isSelf = req.user.id === targetUserId;
  const isManagerOrAdmin = ['ADMIN', 'MANAGER'].includes(req.user.role);

  if (!isSelf && !isManagerOrAdmin) {
    ResponseUtil.forbidden(
      res,
      'Access denied. You can only access your own data or have manager/admin privileges.'
    );
    return;
  }

  next();
};

/**
 * All authenticated users (any role)
 */
export const authenticated = authorize('ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN');

/**
 * Customer or Staff Authorization
 * Allows customers to access their own data or staff to access any customer data
 */
export const customerOrStaff = (req: any, res: Response, next: NextFunction): void => {
  // Check if user is authenticated staff member
  if (req.user && ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'].includes(req.user.role)) {
    next();
    return;
  }

  // Check if customer is authenticated
  if (req.customer) {
    next();
    return;
  }

  ResponseUtil.unauthorized(res, 'Authentication required');
};

/**
 * Customer Self or Staff Authorization
 * Allows customers to access their own data only or staff to access any customer data
 */
export const customerSelfOrStaff = (req: any, res: Response, next: NextFunction): void => {
  // Check if user is authenticated staff member
  if (req.user && ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'].includes(req.user.role)) {
    next();
    return;
  }

  // Check if customer is accessing their own data
  if (req.customer) {
    const targetCustomerId = req.params['id'] || req.params['customerId'];
    if (req.customer.id === targetCustomerId) {
      next();
      return;
    }
  }

  ResponseUtil.forbidden(res, 'Access denied. You can only access your own data or have staff privileges.');
};
