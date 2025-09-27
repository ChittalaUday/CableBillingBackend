import { Router } from 'express';
import { PlansController } from './plans.controller';
import { authenticateJWT, managerOrAdmin } from '@/middleware/auth.middleware';

const router = Router();
const plansController = new PlansController();

/**
 * @route POST /api/plans
 * @desc Create a new plan
 * @access Manager and Admin only
 */
router.post('/', authenticateJWT as any, managerOrAdmin as any, plansController.createPlan as any);

/**
 * @route GET /api/plans
 * @desc Get all plans with filtering and pagination
 * @access Public
 */
router.get('/', plansController.getPlans as any);

/**
 * @route GET /api/plans/stats
 * @desc Get plan statistics
 * @access Manager and Admin only
 */
router.get(
  '/stats',
  authenticateJWT as any,
  managerOrAdmin as any,
  plansController.getPlanStats as any
);

/**
 * @route GET /api/plans/:id
 * @desc Get plan by ID
 * @access Public
 */
router.get('/:id', plansController.getPlanById as any);

/**
 * @route PUT /api/plans/:id
 * @desc Update plan by ID
 * @access Manager and Admin only
 */
router.put(
  '/:id',
  authenticateJWT as any,
  managerOrAdmin as any,
  plansController.updatePlan as any
);

/**
 * @route DELETE /api/plans/:id
 * @desc Delete plan by ID
 * @access Manager and Admin only
 */
router.delete(
  '/:id',
  authenticateJWT as any,
  managerOrAdmin as any,
  plansController.deletePlan as any
);

export default router;
