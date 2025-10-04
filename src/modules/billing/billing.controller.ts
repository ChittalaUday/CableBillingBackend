import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import Joi, { string } from 'joi';

// Validation schemas
const createBillSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),

  paidAt: Joi.date().max('now').optional().messages({
    'date.max': 'Installation date cannot be in the future',
  }),
  planId: Joi.array().items(Joi.string()).required().messages({
    'any.required': 'Plan ID is required',
    'array.empty': 'Plan ID cannot be empty',
    'array.base': 'Plan ID must be an array',
    'array.includes': 'Plan ID must be an array of valid plan ID strings',
  }),
  amountPaid: Joi.number().positive().optional(), // Make amount optional
  billDate: Joi.date().max('now').required().messages({
    'any.required': 'Bill date is required',
    'date.max': 'Bill date cannot be in the future',
  }),
  notes: Joi.string().optional().allow(''),
});

const updateBillSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),

  billNumber: Joi.string().optional(),
  // billId is now retrieved from URL parameters, not request body
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

const calculateBillingSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  planIds: Joi.array().items(Joi.string()).required().messages({
    'any.required': 'Plan IDs are required',
    'array.empty': 'Plan IDs cannot be empty',
    'array.base': 'Plan IDs must be an array',
    'array.includes': 'Plan IDs must be an array of valid plan ID strings',
  }),
  amountPaid: Joi.number().min(0).optional(),
});

export class BillingController {
  private billingService: BillingService;

  constructor() {
    this.billingService = new BillingService();
  }

  /**
   * Calculate billing information (temporary calculation, no database changes)
   */
  public calculateBilling = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = calculateBillingSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      // Calculate billing
      const result = await this.billingService.calculateBilling(value);

      ResponseUtil.success(res, result, 'Billing calculation completed successfully');
    } catch (error: any) {
      console.error('Calculate billing error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to calculate billing', error.message);
    }
  };

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

      // For backward compatibility, we still accept amount in the request but don't use it
      // The amount will be calculated based on the plans in the service
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
   * Update a bill (Staff and above)
   */
  public updateBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Get bill ID from URL parameters
      const { error: paramError, value: paramValue } = billingIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid bill ID', paramError.details);
        return;
      }

      const { id: billId } = paramValue;

      // Validate request body (if any)
      const { error, value } = updateBillSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      // Update bill
      const result = await this.billingService.updateBill({ billId, ...value }, req.user);

      ResponseUtil.success(res, result, 'Bill updated successfully');
    } catch (error: any) {
      console.error('Update bill error:', error);
      ResponseUtil.error(res, 'Failed to update bill', error.message);
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
