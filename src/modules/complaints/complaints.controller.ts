import { Request, Response } from 'express';
import { ComplaintsService } from './complaints.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import {
  createComplaintSchema,
  updateComplaintSchema,
  complaintIdParamSchema,
  customerIdParamSchema,
  getComplaintsQuerySchema,
} from './complaints.validation';

export class ComplaintsController {
  private complaintsService: ComplaintsService;

  constructor() {
    this.complaintsService = new ComplaintsService();
  }

  /**
   * Create a new complaint
   */
  public createComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createComplaintSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const complaint = await this.complaintsService.createComplaint(value);
      ResponseUtil.success(res, complaint, 'Complaint created successfully', 201);
    } catch (error: any) {
      console.error('Create complaint error:', error);
      ResponseUtil.error(res, 'Failed to create complaint', error.message);
    }
  };

  /**
   * Get complaint by ID
   */
  public getComplaintById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = complaintIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid complaint ID', error.details);
        return;
      }

      const complaint = await this.complaintsService.getComplaintById(value.id);

      if (!complaint) {
        ResponseUtil.notFound(res, 'Complaint not found');
        return;
      }

      ResponseUtil.success(res, complaint, 'Complaint retrieved successfully');
    } catch (error: any) {
      console.error('Get complaint error:', error);
      ResponseUtil.error(res, 'Failed to retrieve complaint', error.message);
    }
  };

  /**
   * Get all complaints with filtering and pagination
   */
  public getComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const { error, value } = getComplaintsQuerySchema.validate(req.query);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid query parameters', error.details);
        return;
      }

      const result = await this.complaintsService.getComplaints(value);

      ResponseUtil.paginated(
        res,
        result.complaints,
        result.total,
        value.page,
        value.limit,
        'Complaints retrieved successfully'
      );
    } catch (error: any) {
      console.error('Get complaints error:', error);
      ResponseUtil.error(res, 'Failed to retrieve complaints', error.message);
    }
  };

  /**
   * Get complaints by customer ID
   */
  public getComplaintsByCustomer = async (
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

      const complaints = await this.complaintsService.getComplaintsByCustomer(value.customerId);
      ResponseUtil.success(res, complaints, 'Customer complaints retrieved successfully');
    } catch (error: any) {
      console.error('Get customer complaints error:', error);
      ResponseUtil.error(res, 'Failed to retrieve customer complaints', error.message);
    }
  };

  /**
   * Update complaint
   */
  public updateComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = complaintIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid complaint ID', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateComplaintSchema.validate(req.body);
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      const complaint = await this.complaintsService.updateComplaint(paramValue.id, bodyValue);
      ResponseUtil.success(res, complaint, 'Complaint updated successfully');
    } catch (error: any) {
      console.error('Update complaint error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to update complaint', error.message);
    }
  };

  /**
   * Delete complaint
   */
  public deleteComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = complaintIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid complaint ID', error.details);
        return;
      }

      await this.complaintsService.deleteComplaint(value.id);
      ResponseUtil.success(res, null, 'Complaint deleted successfully');
    } catch (error: any) {
      console.error('Delete complaint error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to delete complaint', error.message);
    }
  };

  /**
   * Assign complaint to user
   */
  public assignComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = complaintIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid complaint ID', paramError.details);
        return;
      }

      // Validate request body
      const { assignedTo } = req.body;

      if (assignedTo !== null && typeof assignedTo !== 'string') {
        ResponseUtil.badRequest(res, 'assignedTo must be a string or null');
        return;
      }

      const complaint = await this.complaintsService.assignComplaint(paramValue.id, assignedTo);
      ResponseUtil.success(res, complaint, 'Complaint assigned successfully');
    } catch (error: any) {
      console.error('Assign complaint error:', error);

      if (error.message.includes('not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to assign complaint', error.message);
    }
  };

  /**
   * Get complaint statistics
   */
  public getComplaintStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.complaintsService.getComplaintStats();
      ResponseUtil.success(res, stats, 'Complaint statistics retrieved successfully');
    } catch (error: any) {
      console.error('Get complaint stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve complaint statistics', error.message);
    }
  };
}
