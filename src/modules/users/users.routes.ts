import { Router, Request, Response, NextFunction } from 'express';
import { UsersController } from './users.controller';
import {
  authenticateJWT,
  adminOnly,
  managerOrAdmin,
  staffAndAbove,
  selfOrManagerAdmin,
} from '@/middleware/auth.middleware';

const router = Router();
const usersController = new UsersController();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Manager and Admin only
 */
router.post('/', managerOrAdmin as any, usersController.createUser as any);

/**
 * @route GET /api/users
 * @desc Get all users with filtering and pagination
 * @access Staff and above
 */
router.get('/', staffAndAbove as any, usersController.getUsers as any);

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access All authenticated users
 */
router.get('/me', usersController.getCurrentUser as any);

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 * @access Manager and Admin only
 */
router.get('/stats', managerOrAdmin as any, usersController.getUserStats as any);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Self or Manager/Admin
 */
router.get('/:id', selfOrManagerAdmin as any, usersController.getUserById as any);

/**
 * @route PUT /api/users/:id
 * @desc Update user by ID
 * @access Self or Manager/Admin
 */
router.put('/:id', selfOrManagerAdmin as any, usersController.updateUser as any);

/**
 * @route PATCH /api/users/:id/toggle-status
 * @desc Toggle user active status
 * @access Admin only
 */
router.patch('/:id/toggle-status', adminOnly as any, usersController.toggleUserStatus as any);

/**
 * @route PATCH /api/users/:id/verify
 * @desc Verify user
 * @access Manager and Admin only
 */
router.patch('/:id/verify', managerOrAdmin as any, usersController.verifyUser as any);

/**
 * @route PUT /api/users/:id/change-password
 * @desc Change user password
 * @access Self only (handled in controller)
 */
router.put(
  '/:id/change-password',
  (req: Request, res: Response, next: NextFunction) => {
    // Only allow users to change their own password
    if (req.params['id'] !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'You can only change your own password',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  },
  usersController.changePassword as any
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user by ID (soft delete)
 * @access Admin only
 */
router.delete('/:id', adminOnly as any, usersController.deleteUser as any);

/**
 * @route DELETE /api/users/:id/permanent
 * @desc Permanently delete user by ID
 * @access Admin only
 */
router.delete('/:id/permanent', adminOnly as any, usersController.permanentlyDeleteUser as any);

export default router;
