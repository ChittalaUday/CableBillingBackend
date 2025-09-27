import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import {
  registerUserSchema,
  updateUserSchema,
  changePasswordSchema,
  getUsersQuerySchema,
  userIdParamSchema,
} from './users.validation';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  /**
   * Create a new user (Admin/Manager only)
   */
  public createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = registerUserSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      // Role-based restrictions
      const { role } = value;
      const currentUserRole = req.user.role;

      // Only admins can create admin users
      if (role === 'ADMIN' && currentUserRole !== 'ADMIN') {
        ResponseUtil.forbidden(res, 'Only admins can create admin users');
        return;
      }

      // Only admins and managers can create manager users
      if (role === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(currentUserRole)) {
        ResponseUtil.forbidden(res, 'Only admins and managers can create manager users');
        return;
      }

      const user = await this.usersService.createUser({
        email: value.email,
        username: value.username,
        password: value.password,
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone,
        role: value.role,
      });

      ResponseUtil.success(res, user, 'User created successfully', 201);
    } catch (error: any) {
      console.error('Create user error:', error);

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create user', error.message);
    }
  };

  /**
   * Get all users with filtering and pagination (Staff and above)
   */
  public getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const { error, value } = getUsersQuerySchema.validate(req.query);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid query parameters', error.details);
        return;
      }

      const result = await this.usersService.getUsers(value);

      ResponseUtil.paginated(
        res,
        result.users,
        result.total,
        result.page,
        result.limit,
        'Users retrieved successfully'
      );
    } catch (error: any) {
      console.error('Get users error:', error);
      ResponseUtil.error(res, 'Failed to retrieve users', error.message);
    }
  };

  /**
   * Get current user profile
   */
  public getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.usersService.getUserById(req.user.id);
      ResponseUtil.success(res, user, 'Current user profile retrieved successfully');
    } catch (error: any) {
      console.error('Get current user error:', error);
      ResponseUtil.error(res, 'Failed to retrieve current user profile', error.message);
    }
  };

  /**
   * Get user by ID (Self or Manager/Admin)
   */
  public getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = userIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid user ID', error.details);
        return;
      }

      const user = await this.usersService.getUserById(value.id);
      ResponseUtil.success(res, user, 'User retrieved successfully');
    } catch (error: any) {
      console.error('Get user by ID error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to retrieve user', error.message);
    }
  };

  /**
   * Update user by ID (Self or Manager/Admin)
   */
  public updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = userIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid user ID', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateUserSchema.validate(req.body);
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      const targetUserId = paramValue.id;
      const currentUser = req.user;

      // Role-based restrictions for role updates
      if (bodyValue.role) {
        // Only admins can change roles to/from admin
        if (
          (bodyValue.role === 'ADMIN' || currentUser.role === 'ADMIN') &&
          currentUser.role !== 'ADMIN'
        ) {
          ResponseUtil.forbidden(res, 'Only admins can manage admin roles');
          return;
        }

        // Only admins and managers can change roles to/from manager
        if (bodyValue.role === 'MANAGER' && !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
          ResponseUtil.forbidden(res, 'Only admins and managers can assign manager roles');
          return;
        }

        // Users cannot change their own role (except admins)
        if (targetUserId === currentUser.id && currentUser.role !== 'ADMIN') {
          ResponseUtil.forbidden(res, 'You cannot change your own role');
          return;
        }
      }

      // Prevent users from deactivating themselves
      if (bodyValue.isActive === false && targetUserId === currentUser.id) {
        ResponseUtil.forbidden(res, 'You cannot deactivate your own account');
        return;
      }

      const user = await this.usersService.updateUserById(targetUserId, bodyValue);
      ResponseUtil.success(res, user, 'User updated successfully');
    } catch (error: any) {
      console.error('Update user error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to update user', error.message);
    }
  };

  /**
   * Delete user by ID (Admin only, cannot delete self)
   */
  public deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = userIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid user ID', error.details);
        return;
      }

      const targetUserId = value.id;
      const currentUser = req.user;

      // Prevent self-deletion
      if (targetUserId === currentUser.id) {
        ResponseUtil.forbidden(res, 'You cannot delete your own account');
        return;
      }

      await this.usersService.deleteUserById(targetUserId);
      ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error: any) {
      console.error('Delete user error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to delete user', error.message);
    }
  };

  /**
   * Permanently delete user by ID (Admin only, cannot delete self)
   */
  public permanentlyDeleteUser = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = userIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid user ID', error.details);
        return;
      }

      const targetUserId = value.id;
      const currentUser = req.user;

      // Prevent self-deletion
      if (targetUserId === currentUser.id) {
        ResponseUtil.forbidden(res, 'You cannot permanently delete your own account');
        return;
      }

      await this.usersService.permanentlyDeleteUserById(targetUserId);
      ResponseUtil.success(res, null, 'User permanently deleted successfully');
    } catch (error: any) {
      console.error('Permanently delete user error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to permanently delete user', error.message);
    }
  };

  /**
   * Change password (Self only)
   */
  public changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      await this.usersService.changePassword(req.user.id, value.currentPassword, value.newPassword);

      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.message === 'Current password is incorrect') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to change password', error.message);
    }
  };

  /**
   * Get user statistics (Manager and Admin only)
   */
  public getUserStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.usersService.getUserStats();
      ResponseUtil.success(res, stats, 'User statistics retrieved successfully');
    } catch (error: any) {
      console.error('Get user stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve user statistics', error.message);
    }
  };

  /**
   * Toggle user status (Admin only, cannot toggle self)
   */
  public toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = userIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid user ID', error.details);
        return;
      }

      const targetUserId = value.id;
      const currentUser = req.user;

      // Prevent self-toggle
      if (targetUserId === currentUser.id) {
        ResponseUtil.forbidden(res, 'You cannot toggle your own account status');
        return;
      }

      const user = await this.usersService.toggleUserStatus(targetUserId);
      const action = user.isActive ? 'activated' : 'deactivated';
      ResponseUtil.success(res, user, `User ${action} successfully`);
    } catch (error: any) {
      console.error('Toggle user status error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to toggle user status', error.message);
    }
  };

  /**
   * Verify user (Admin and Manager only)
   */
  public verifyUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = userIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid user ID', error.details);
        return;
      }

      const user = await this.usersService.verifyUser(value.id);
      ResponseUtil.success(res, user, 'User verified successfully');
    } catch (error: any) {
      console.error('Verify user error:', error);

      if (error.message === 'User not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to verify user', error.message);
    }
  };
}
