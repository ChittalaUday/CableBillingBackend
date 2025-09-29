import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticateCustomerJWT } from '@/middleware/auth.middleware';

const router = Router();
const customersController = new CustomersController();

/**
 * Apply customer authentication middleware to all routes
 */
router.use(authenticateCustomerJWT);

/**
 * @route GET /api/customer/me
 * @desc Get authenticated customer's own profile
 * @access Customer only
 */
router.get('/me', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.id = req.customer.id;
  return customersController.getCustomerById(req as any, res);
});

/**
 * @route PUT /api/customer/me
 * @desc Update authenticated customer's own profile
 * @access Customer only
 */
router.put('/me', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.id = req.customer.id;
  return customersController.updateCustomer(req as any, res);
});

/**
 * @route PUT /api/customer/me/password
 * @desc Change authenticated customer's password
 * @access Customer only
 */
router.put('/me/password', (req: any, res: any) => {
  // Inject the customer ID into the request params for the controller
  req.params.id = req.customer.id;
  return customersController.changeCustomerPassword(req as any, res);
});

export default router;
