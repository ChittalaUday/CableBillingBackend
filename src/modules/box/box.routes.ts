import { Router } from 'express';
import { BoxController } from './box.controller';
import { authenticateJWT, staffAndAbove } from '@/middleware/auth.middleware';

const router = Router();
const boxController = new BoxController();

/**
 * Apply authentication middleware to all routes
 */
router.use(authenticateJWT);

/**
 * @route POST /api/box
 * @desc Create a new box activation
 * @access Staff and above
 */
router.post('/', staffAndAbove as any, boxController.createBoxActivation as any);

/**
 * @route GET /api/box/customer/:customerId
 * @desc Get all box activations for a customer
 * @access Staff and above or customer themselves
 */
router.get('/customer/:customerId', boxController.getBoxActivationsByCustomer as any);

/**
 * @route GET /api/box/:id
 * @desc Get box activation by ID
 * @access Staff and above
 */
router.get('/:id', staffAndAbove as any, boxController.getBoxActivationById as any);

export default router;
