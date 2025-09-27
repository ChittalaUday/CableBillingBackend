import { Router } from 'express';
import { AuthService } from '@/services/auth.service';
import { ResponseUtil } from '@/utils/response.util';
import { Logger } from '@/utils/logger.util';
import { authenticateJWT } from '@/middleware/auth.middleware';
import { loginUserSchema, registerUserSchema } from '@/modules/users/users.validation';

const router = Router();
const authService = new AuthService();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerUserSchema.validate(req.body);
    if (error) {
      ResponseUtil.badRequest(res, 'Validation failed', error.details);
      return;
    }

    const result = await authService.register({
      email: value.email,
      username: value.username,
      password: value.password,
      confirmPassword: value.confirmPassword,
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone,
    });

    ResponseUtil.success(res, result, 'User registered successfully', 201);
  } catch (error: any) {
    Logger.authFailure('register', error.message, { email: req.body.email });

    if (error.message.includes('already exists') || error.message.includes('do not match')) {
      ResponseUtil.conflict(res, error.message);
      return;
    }

    ResponseUtil.error(res, 'Registration failed', error.message);
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginUserSchema.validate(req.body);
    if (error) {
      ResponseUtil.badRequest(res, 'Validation failed', error.details);
      return;
    }

    const result = await authService.login({
      email: value.email,
      password: value.password,
    });

    ResponseUtil.success(res, result, 'Login successful');
  } catch (error: any) {
    Logger.authFailure('login', error.message, { email: req.body.email });

    if (error.message.includes('Invalid credentials') || error.message.includes('deactivated')) {
      ResponseUtil.unauthorized(res, error.message);
      return;
    }

    ResponseUtil.error(res, 'Login failed', error.message);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      ResponseUtil.badRequest(res, 'Refresh token is required');
      return;
    }

    const result = await authService.refreshToken(refreshToken);
    ResponseUtil.success(res, result, 'Token refreshed successfully');
  } catch (error: any) {
    Logger.authFailure('refresh-token', error.message);
    ResponseUtil.unauthorized(res, 'Invalid refresh token');
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (placeholder for token blacklisting)
 * @access Private
 */
router.post('/logout', authenticateJWT, async (req, res) => {
  try {
    // In a production app, you would blacklist the token here
    // For now, we just return a success response
    Logger.authSuccess((req as any).user.id, 'logout');
    ResponseUtil.success(res, null, 'Logout successful');
  } catch (error: any) {
    Logger.authFailure('logout', error.message);
    ResponseUtil.error(res, 'Logout failed', error.message);
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    ResponseUtil.success(res, req.user, 'Current user profile retrieved successfully');
  } catch (error: any) {
    Logger.error('Get current user error', error);
    ResponseUtil.error(res, 'Failed to retrieve current user profile', error.message);
  }
});

/**
 * @route GET /api/auth/validate
 * @desc Validate JWT token
 * @access Private
 */
router.get('/validate', authenticateJWT, async (req, res) => {
  try {
    ResponseUtil.success(
      res,
      {
        valid: true,
        user: req.user,
      },
      'Token is valid'
    );
  } catch (error: any) {
    Logger.error('Token validation error', error);
    ResponseUtil.error(res, 'Token validation failed', error.message);
  }
});

export default router;
