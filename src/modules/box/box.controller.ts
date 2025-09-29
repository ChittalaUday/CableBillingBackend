import { Request, Response } from 'express';
import { BoxService } from './box.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import Joi from 'joi';

// Validation schemas
const createBoxActivationSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
  actionType: Joi.string()
    .valid('ACTIVATED', 'SUSPENDED', 'DEACTIVATED', 'REACTIVATED')
    .required()
    .messages({
      'any.required': 'Action type is required',
      'any.only': 'Action type must be one of: ACTIVATED, SUSPENDED, DEACTIVATED, REACTIVATED',
    }),
  reason: Joi.string().optional().allow(''),
  notes: Joi.string().optional().allow(''),
});

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
    'string.empty': 'Customer ID cannot be empty',
  }),
});

const boxActivationIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'Box activation ID is required',
    'string.empty': 'Box activation ID cannot be empty',
  }),
});

export class BoxController {
  private boxService: BoxService;

  constructor() {
    this.boxService = new BoxService();
  }

  /**
   * Create a new box activation (Staff and above)
   */
  public createBoxActivation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createBoxActivationSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const { customerId, actionType, reason, notes } = value;

      // Create box activation
      const result = await this.boxService.createBoxActivation({
        customerId,
        actionType,
        performedBy: req.user.id,
        reason,
        notes,
      });

      ResponseUtil.success(res, result, 'Box activation created successfully', 201);
    } catch (error: any) {
      console.error('Create box activation error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create box activation', error.message);
    }
  };

  /**
   * Get all box activations for a customer (Staff and above or customer themselves)
   */
  public getBoxActivationsByCustomer = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = customerIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
        return;
      }

      const { customerId } = value;

      // Check if user is authorized to view this customer's box activations
      // Staff can view any customer's data, customers can only view their own
      if (req.user.role === 'CUSTOMER' && req.user.id !== customerId) {
        ResponseUtil.forbidden(
          res,
          "You are not authorized to view this customer's box activations"
        );
        return;
      }

      const activations = await this.boxService.getBoxActivationsByCustomer(customerId);
      ResponseUtil.success(res, activations, 'Box activations retrieved successfully');
    } catch (error: any) {
      console.error('Get box activations error:', error);
      ResponseUtil.error(res, 'Failed to retrieve box activations', error.message);
    }
  };

  /**
   * Get box activation by ID (Staff and above)
   */
  public getBoxActivationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = boxActivationIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid box activation ID', error.details);
        return;
      }

      const { id } = value;

      const activation = await this.boxService.getBoxActivationById(id);

      if (!activation) {
        ResponseUtil.notFound(res, 'Box activation not found');
        return;
      }

      ResponseUtil.success(res, activation, 'Box activation retrieved successfully');
    } catch (error: any) {
      console.error('Get box activation by ID error:', error);
      ResponseUtil.error(res, 'Failed to retrieve box activation', error.message);
    }
  };
}
