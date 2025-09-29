import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import Joi from 'joi';

// Validation schemas
const createBillSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be positive',
  }),
  billDate: Joi.date().max('now').required().messages({
    'any.required': 'Bill date is required',
    'date.max': 'Bill date cannot be in the future',
  }),
  dueDate: Joi.date().min(Joi.ref('billDate')).required().messages({
    'any.required': 'Due date is required',
    'date.min': 'Due date must be after bill date',
  }),
  notes: Joi.string().optional().allow(''),
});

const createPaymentSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be positive',
  }),
  paymentMethod: Joi.string().required().messages({
    'any.required': 'Payment method is required',
  }),
  paymentSource: Joi.string().valid('CASH', 'ONLINE', 'CHEQUE', 'CARD').required().messages({
    'any.required': 'Payment source is required',
    'any.only': 'Payment source must be one of: CASH, ONLINE, CHEQUE, CARD',
  }),
  paymentDate: Joi.date().max('now').required().messages({
    'any.required': 'Payment date is required',
    'date.max': 'Payment date cannot be in the future',
  }),
  billId: Joi.string().optional(),
  collectedBy: Joi.string().optional(),
  notes: Joi.string().optional().allow(''),
});

const createDueSettlementSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  billId: Joi.string().required().messages({
    'any.required': 'Bill ID is required',
    'string.empty': 'Bill ID cannot be empty',
  }),
  settledAmount: Joi.number().positive().required().messages({
    'any.required': 'Settled amount is required',
    'number.positive': 'Settled amount must be positive',
  }),
  notes: Joi.string().optional().allow(''),
});

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

const billingIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'ID is required',
    'string.empty': 'ID cannot be empty',
  }),
});

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  /**
   * Create a new bill (Staff and above)
   */
  public createBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createBillSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const billData = {
        ...value,
        generatedBy: req.user.id,
      };

      // Create bill
      const result = await this.billingService.createBill(billData);

      ResponseUtil.success(res, result, 'Bill created successfully', 201);
    } catch (error: any) {
      console.error('Create bill error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create bill', error.message);
    }
  };

  /**
   * Create a payment (Staff and above)
   */
  public createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createPaymentSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const paymentData = {
        ...value,
        collectedBy: req.user.id,
      };

      // Create payment
      const result = await this.billingService.createPayment(paymentData);

      ResponseUtil.success(res, result, 'Payment created successfully', 201);
    } catch (error: any) {
      console.error('Create payment error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create payment', error.message);
    }
  };

  /**
   * Create a due settlement (Staff and above)
   */
  public createDueSettlement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createDueSettlementSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const dueSettlementData = {
        ...value,
        settledBy: req.user.id,
      };

      // Create due settlement
      const result = await this.billingService.createDueSettlement(dueSettlementData);

      ResponseUtil.success(res, result, 'Due settlement created successfully', 201);
    } catch (error: any) {
      console.error('Create due settlement error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create due settlement', error.message);
    }
  };

  /**
   * Get all bills for a customer (Staff and above or customer themselves)
   */
  public getBillsByCustomer = async (req: any, res: Response): Promise<void> => {
    try {
      // For customers, use their own ID; for staff, use the provided customerId
      let customerId: string;

      if (req.customer) {
        // Customer accessing their own data
        customerId = req.customer.id;
      } else if (req.user && ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'].includes(req.user.role)) {
        // Staff accessing customer data - validate the provided customerId
        const { error, value } = customerIdParamSchema.validate(req.params);
        if (error) {
          ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
          return;
        }
        customerId = value.customerId;
      } else {
        ResponseUtil.forbidden(res, 'Access denied');
        return;
      }

      const bills = await this.billingService.getBillsByCustomer(customerId);
      ResponseUtil.success(res, bills, 'Bills retrieved successfully');
    } catch (error: any) {
      console.error('Get bills error:', error);
      ResponseUtil.error(res, 'Failed to retrieve bills', error.message);
    }
  };

  /**
   * Get bill by ID (Staff and above)
   */
  public getBillById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = billingIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid bill ID', error.details);
        return;
      }

      const { id } = value;

      const bill = await this.billingService.getBillById(id);

      if (!bill) {
        ResponseUtil.notFound(res, 'Bill not found');
        return;
      }

      ResponseUtil.success(res, bill, 'Bill retrieved successfully');
    } catch (error: any) {
      console.error('Get bill by ID error:', error);
      ResponseUtil.error(res, 'Failed to retrieve bill', error.message);
    }
  };

  /**
   * Get all payments for a customer (Staff and above or customer themselves)
   */
  public getPaymentsByCustomer = async (req: any, res: Response): Promise<void> => {
    try {
      // For customers, use their own ID; for staff, use the provided customerId
      let customerId: string;

      if (req.customer) {
        // Customer accessing their own data
        customerId = req.customer.id;
      } else if (req.user && ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'].includes(req.user.role)) {
        // Staff accessing customer data - validate the provided customerId
        const { error, value } = customerIdParamSchema.validate(req.params);
        if (error) {
          ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
          return;
        }
        customerId = value.customerId;
      } else {
        ResponseUtil.forbidden(res, 'Access denied');
        return;
      }

      const payments = await this.billingService.getPaymentsByCustomer(customerId);
      ResponseUtil.success(res, payments, 'Payments retrieved successfully');
    } catch (error: any) {
      console.error('Get payments error:', error);
      ResponseUtil.error(res, 'Failed to retrieve payments', error.message);
    }
  };

  /**
   * Get payment by ID (Staff and above)
   */
  public getPaymentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = billingIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid payment ID', error.details);
        return;
      }

      const { id } = value;

      const payment = await this.billingService.getPaymentById(id);

      if (!payment) {
        ResponseUtil.notFound(res, 'Payment not found');
        return;
      }

      ResponseUtil.success(res, payment, 'Payment retrieved successfully');
    } catch (error: any) {
      console.error('Get payment by ID error:', error);
      ResponseUtil.error(res, 'Failed to retrieve payment', error.message);
    }
  };

  /**
   * Get all due settlements for a customer (Staff and above or customer themselves)
   */
  public getDueSettlementsByCustomer = async (req: any, res: Response): Promise<void> => {
    try {
      // For customers, use their own ID; for staff, use the provided customerId
      let customerId: string;

      if (req.customer) {
        // Customer accessing their own data
        customerId = req.customer.id;
      } else if (req.user && ['ADMIN', 'MANAGER', 'STAFF', 'TECHNICIAN'].includes(req.user.role)) {
        // Staff accessing customer data - validate the provided customerId
        const { error, value } = customerIdParamSchema.validate(req.params);
        if (error) {
          ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
          return;
        }
        customerId = value.customerId;
      } else {
        ResponseUtil.forbidden(res, 'Access denied');
        return;
      }

      const dueSettlements = await this.billingService.getDueSettlementsByCustomer(customerId);
      ResponseUtil.success(res, dueSettlements, 'Due settlements retrieved successfully');
    } catch (error: any) {
      console.error('Get due settlements error:', error);
      ResponseUtil.error(res, 'Failed to retrieve due settlements', error.message);
    }
  };

  /**
   * Get due settlement by ID (Staff and above)
   */
  public getDueSettlementById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = billingIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid due settlement ID', error.details);
        return;
      }

      const { id } = value;

      const dueSettlement = await this.billingService.getDueSettlementById(id);

      if (!dueSettlement) {
        ResponseUtil.notFound(res, 'Due settlement not found');
        return;
      }

      ResponseUtil.success(res, dueSettlement, 'Due settlement retrieved successfully');
    } catch (error: any) {
      console.error('Get due settlement by ID error:', error);
      ResponseUtil.error(res, 'Failed to retrieve due settlement', error.message);
    }
  };
}
