import { Router } from 'express';
import { ComplaintsController } from './complaints.controller';
import { authenticateCustomerJWT } from '@/middleware/auth.middleware';

const router = Router();
const complaintsController = new ComplaintsController();

/**
 * Apply customer authentication middleware to all routes
 */
router.use(authenticateCustomerJWT);

/**
 * @route POST /api/customer/complaints
 * @desc Create a new complaint (customer can only create for themselves)
 */
router.post('/', (req: any, res: any) => {
  // Inject the customer ID into the request body
  req.body.customerId = req.customer.id;
  return complaintsController.createComplaint(req as any, res);
});

/**
 * @route GET /api/customer/complaints
 * @desc Get all complaints for the authenticated customer
 */
router.get('/', (req: any, res: any) => {
  // Inject the customer ID into the request params
  req.params.customerId = req.customer.id;
  return complaintsController.getComplaintsByCustomer(req as any, res);
});

/**
 * @route GET /api/customer/complaints/:id
 * @desc Get a specific complaint (only if it belongs to the customer)
 */
router.get('/:id', async (req: any, res: any) => {
  try {
    // First check if the complaint belongs to the customer
    const complaint = await complaintsController['complaintsService'].getComplaintById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.customerId !== req.customer.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own complaints.',
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get complaint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint',
      error: error.message,
    });
  }
});

export default router;
