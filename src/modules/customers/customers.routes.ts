import { Router } from 'express';
import { CustomersController } from './customers.controller';
import {
  authenticateJWT,
  adminOnly,
  managerOrAdmin,
  staffAndAbove,
  authenticateCustomerJWT,
  customerSelfOrStaff,
} from '@/middleware/auth.middleware';

const router = Router();
const customersController = new CustomersController();

/**
 * @route POST /api/customers/login
 * @desc Customer login
 * @access Public
 */
router.post('/login', customersController.customerLogin as any);

// Apply authentication to all other routes
router.use(authenticateJWT);

/**
 * @route GET /api/customers/me
 * @desc Get authenticated customer's own profile
 * @access Customer only
 */
router.get('/me', authenticateCustomerJWT as any, customersController.getCustomerById as any);

/**
 * @route PUT /api/customers/me
 * @desc Update authenticated customer's own profile
 * @access Customer only
 */
router.put('/me', authenticateCustomerJWT as any, customersController.updateCustomer as any);

/**
 * @route POST /api/customers
 * @desc Create a new customer
 * @access Staff and above
 */
router.post('/', staffAndAbove as any, customersController.createCustomer as any);

/**
 * @route GET /api/customers
 * @desc Get all customers with filtering and pagination
 * @access Staff and above
 */
router.get('/', staffAndAbove as any, customersController.getCustomers as any);

/**
 * @route GET /api/customers/stats
 * @desc Get customer statistics
 * @access Manager and Admin only
 */
router.get('/stats', managerOrAdmin as any, customersController.getCustomerStats as any);

/**
 * @route GET /api/customers/account/:accountNo
 * @desc Get customer by account number
 * @access Staff and above
 */
router.get(
  '/account/:accountNo',
  staffAndAbove as any,
  customersController.getCustomerByAccountNo as any
);

/**
 * @route GET /api/customers/phone/:phone
 * @desc Get customer by phone number
 * @access Staff and above
 */
router.get('/phone/:phone', staffAndAbove as any, customersController.getCustomerByPhone as any);

/**
 * @route PUT /api/customers/phone/:phone
 * @desc Update customer by phone number
 * @access Staff and above
 */
router.put('/phone/:phone', staffAndAbove as any, customersController.updateCustomerByPhone as any);

/**
 * @route GET /api/customers/:id
 * @desc Get customer by ID
 * @access Staff and above
 */
router.get('/:id', staffAndAbove as any, customersController.getCustomerById as any);

/**
 * @route PUT /api/customers/:id
 * @desc Update customer by ID
 * @access Staff and above
 */
router.put('/:id', staffAndAbove as any, customersController.updateCustomer as any);

/**
 * @route DELETE /api/customers/:id
 * @desc Delete customer by ID
 * @access Admin only
 */
router.delete('/:id', adminOnly as any, customersController.deleteCustomer as any);

/**
 * @route PUT /api/customers/:id/password
 * @desc Change customer password
 * @access Staff and above
 */
router.put(
  '/:id/password',
  staffAndAbove as any,
  customersController.changeCustomerPassword as any
);

export default router;
