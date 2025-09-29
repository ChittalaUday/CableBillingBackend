import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticateCustomerJWT } from '@/middleware/auth.middleware';

const router = Router();
const billingController = new BillingController();

/**
 * Apply customer authentication middleware to all routes
 */
router.use(authenticateCustomerJWT);

/**
 * @route GET /api/customer/billing/bills
 * @desc Get all bills for the authenticated customer
 * @access Customer only
 */
router.get('/bills', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.customerId = req.customer.id;
  return billingController.getBillsByCustomer(req as any, res);
});

/**
 * @route GET /api/customer/billing/payments
 * @desc Get all payments for the authenticated customer
 * @access Customer only
 */
router.get('/payments', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.customerId = req.customer.id;
  return billingController.getPaymentsByCustomer(req as any, res);
});

/**
 * @route GET /api/customer/billing/due-settlements
 * @desc Get all due settlements for the authenticated customer
 * @access Customer only
 */
router.get('/due-settlements', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.customerId = req.customer.id;
  return billingController.getDueSettlementsByCustomer(req as any, res);
});

export default router;
