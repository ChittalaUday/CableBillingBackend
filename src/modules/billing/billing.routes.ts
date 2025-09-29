import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticateJWT, staffAndAbove, customerSelfOrStaff } from '@/middleware/auth.middleware';

const router = Router();
const billingController = new BillingController();

/**
 * Apply authentication middleware to all routes
 */
router.use(authenticateJWT);

/**
 * @route POST /api/billing/bills
 * @desc Create a new bill
 * @access Staff and above
 */
router.post('/bills', staffAndAbove as any, billingController.createBill as any);

/**
 * @route POST /api/billing/payments
 * @desc Create a new payment
 * @access Staff and above
 */
router.post('/payments', staffAndAbove as any, billingController.createPayment as any);

/**
 * @route POST /api/billing/due-settlements
 * @desc Create a new due settlement
 * @access Staff and above
 */
router.post('/due-settlements', staffAndAbove as any, billingController.createDueSettlement as any);

/**
 * @route GET /api/billing/bills/customer/:customerId
 * @desc Get all bills for a customer
 * @access Staff and above or customer themselves
 */
router.get(
  '/bills/customer/:customerId',
  customerSelfOrStaff as any,
  billingController.getBillsByCustomer as any
);

/**
 * @route GET /api/billing/bills/:id
 * @desc Get bill by ID
 * @access Staff and above
 */
router.get('/bills/:id', staffAndAbove as any, billingController.getBillById as any);

/**
 * @route GET /api/billing/payments/customer/:customerId
 * @desc Get all payments for a customer
 * @access Staff and above or customer themselves
 */
router.get(
  '/payments/customer/:customerId',
  customerSelfOrStaff as any,
  billingController.getPaymentsByCustomer as any
);

/**
 * @route GET /api/billing/payments/:id
 * @desc Get payment by ID
 * @access Staff and above
 */
router.get('/payments/:id', staffAndAbove as any, billingController.getPaymentById as any);

/**
 * @route GET /api/billing/due-settlements/customer/:customerId
 * @desc Get all due settlements for a customer
 * @access Staff and above or customer themselves
 */
router.get(
  '/due-settlements/customer/:customerId',
  customerSelfOrStaff as any,
  billingController.getDueSettlementsByCustomer as any
);

/**
 * @route GET /api/billing/due-settlements/:id
 * @desc Get due settlement by ID
 * @access Staff and above
 */
router.get(
  '/due-settlements/:id',
  staffAndAbove as any,
  billingController.getDueSettlementById as any
);

export default router;
