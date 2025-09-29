import { Router } from 'express';
import { ComplaintsController } from './complaints.controller';
import { authenticateJWT, staffAndAbove, managerOrAdmin } from '@/middleware/auth.middleware';

const router = Router();
const complaintsController = new ComplaintsController();

/**
 * Apply authentication middleware to all routes
 */
router.use(authenticateJWT);

/**
 * @route POST /api/complaints
 * @desc Create a new complaint
 * @access Staff and above
 */
router.post('/', staffAndAbove as any, complaintsController.createComplaint as any);

/**
 * @route GET /api/complaints
 * @desc Get all complaints with filtering and pagination
 * @access Staff and above
 */
router.get('/', staffAndAbove as any, complaintsController.getComplaints as any);

/**
 * @route GET /api/complaints/stats
 * @desc Get complaint statistics
 * @access Manager and Admin only
 */
router.get('/stats', managerOrAdmin as any, complaintsController.getComplaintStats as any);

/**
 * @route GET /api/complaints/customer/:customerId
 * @desc Get all complaints for a customer
 * @access Staff and above
 */
router.get(
  '/customer/:customerId',
  staffAndAbove as any,
  complaintsController.getComplaintsByCustomer as any
);

/**
 * @route GET /api/complaints/:id
 * @desc Get complaint by ID
 * @access Staff and above
 */
router.get('/:id', staffAndAbove as any, complaintsController.getComplaintById as any);

/**
 * @route PUT /api/complaints/:id
 * @desc Update complaint
 * @access Staff and above
 */
router.put('/:id', staffAndAbove as any, complaintsController.updateComplaint as any);

/**
 * @route PUT /api/complaints/:id/assign
 * @desc Assign complaint to user
 * @access Staff and above
 */
router.put('/:id/assign', staffAndAbove as any, complaintsController.assignComplaint as any);

/**
 * @route DELETE /api/complaints/:id
 * @desc Delete complaint
 * @access Admin only
 */
router.delete('/:id', managerOrAdmin as any, complaintsController.deleteComplaint as any);

export default router;
