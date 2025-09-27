import { Request, Response } from 'express';
import { PlansService } from './plans.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import {
  createPlanSchema,
  updatePlanSchema,
  getPlansQuerySchema,
  planIdParamSchema,
} from './plans.validation';

export class PlansController {
  private plansService: PlansService;

  constructor() {
    this.plansService = new PlansService();
  }

  /**
   * Create a new plan (Admin/Manager only)
   */
  public createPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createPlanSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const plan = await this.plansService.createPlan({
        name: value.name,
        description: value.description,
        type: value.type,
        price: value.price,
        channels: value.channels,
        packageDetails: value.packageDetails,
      });

      ResponseUtil.success(res, plan, 'Plan created successfully', 201);
    } catch (error: any) {
      console.error('Create plan error:', error);

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create plan', error.message);
    }
  };

  /**
   * Get all plans with filtering and pagination
   */
  public getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const { error, value } = getPlansQuerySchema.validate(req.query);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid query parameters', error.details);
        return;
      }

      const result = await this.plansService.getPlans(value);

      ResponseUtil.paginated(
        res,
        result.plans,
        result.total,
        result.page,
        result.limit,
        'Plans retrieved successfully'
      );
    } catch (error: any) {
      console.error('Get plans error:', error);
      ResponseUtil.error(res, 'Failed to retrieve plans', error.message);
    }
  };

  /**
   * Get plan by ID
   */
  public getPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = planIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid plan ID', error.details);
        return;
      }

      const plan = await this.plansService.getPlanById(value.id);
      ResponseUtil.success(res, plan, 'Plan retrieved successfully');
    } catch (error: any) {
      console.error('Get plan by ID error:', error);

      if (error.message === 'Plan not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to retrieve plan', error.message);
    }
  };

  /**
   * Update plan by ID (Admin/Manager only)
   */
  public updatePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = planIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid plan ID', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updatePlanSchema.validate(req.body);
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      const plan = await this.plansService.updatePlan(paramValue.id, bodyValue);
      ResponseUtil.success(res, plan, 'Plan updated successfully');
    } catch (error: any) {
      console.error('Update plan error:', error);

      if (error.message === 'Plan not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to update plan', error.message);
    }
  };

  /**
   * Delete plan by ID (Admin/Manager only)
   */
  public deletePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = planIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid plan ID', error.details);
        return;
      }

      await this.plansService.deletePlanById(value.id);
      ResponseUtil.success(res, null, 'Plan deleted successfully');
    } catch (error: any) {
      console.error('Delete plan error:', error);

      if (error.message === 'Plan not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('active subscriptions')) {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to delete plan', error.message);
    }
  };

  /**
   * Get plan statistics (Manager and Admin only)
   */
  public getPlanStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.plansService.getPlanStats();
      ResponseUtil.success(res, stats, 'Plan statistics retrieved successfully');
    } catch (error: any) {
      console.error('Get plan stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve plan statistics', error.message);
    }
  };
}
