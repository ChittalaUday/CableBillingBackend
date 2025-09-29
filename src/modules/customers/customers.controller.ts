import { Request, Response } from 'express';
import { CustomersService } from './customers.service';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { ResponseUtil } from '@/utils/response.util';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersQuerySchema,
  customerIdParamSchema,
  customerPhoneParamSchema,
  customerLoginSchema,
  changeCustomerPasswordSchema,
} from './customers.validation';

export class CustomersController {
  private customersService: CustomersService;

  constructor() {
    this.customersService = new CustomersService();
  }

  /**
   * Create a new customer (Staff and above)
   */
  public createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = createCustomerSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const customer = await this.customersService.createCustomer({
        accountNo: value.accountNo,
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        phone: value.phone,
        address: value.address,
        city: value.city,
        state: value.state,
        zipCode: value.zipCode,
        connectionType: value.connectionType,
        packageType: value.packageType,
        monthlyRate: value.monthlyRate,
        installationDate: new Date(value.installationDate),
        notes: value.notes,
        createdBy: req.user.id,
      });

      ResponseUtil.success(res, customer, 'Customer created successfully', 201);
    } catch (error: any) {
      console.error('Create customer error:', error);

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to create customer', error.message);
    }
  };

  /**
   * Get all customers with filtering and pagination (Staff and above)
   */
  public getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate query parameters
      const { error, value } = getCustomersQuerySchema.validate(req.query);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid query parameters', error.details);
        return;
      }

      const result = await this.customersService.getCustomers(value);

      ResponseUtil.paginated(
        res,
        result.customers,
        result.total,
        result.page,
        result.limit,
        'Customers retrieved successfully'
      );
    } catch (error: any) {
      console.error('Get customers error:', error);
      ResponseUtil.error(res, 'Failed to retrieve customers', error.message);
    }
  };

  /**
   * Get customer by ID (Staff and above or customer themselves)
   */
  public getCustomerById = async (req: any, res: Response): Promise<void> => {
    try {
      let customerId: string;

      // If customer is authenticated, use their own ID
      if (req.customer) {
        customerId = req.customer.id;
      } else if (req.user && req.params.id) {
        // Staff accessing customer data
        // Validate parameters
        const { error, value } = customerIdParamSchema.validate(req.params);
        if (error) {
          ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
          return;
        }
        customerId = value.id;
      } else {
        ResponseUtil.badRequest(res, 'Customer ID is required');
        return;
      }

      const customer = await this.customersService.getCustomerById(customerId);
      ResponseUtil.success(res, customer, 'Customer retrieved successfully');
    } catch (error: any) {
      console.error('Get customer by ID error:', error);

      if (error.message === 'Customer not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to retrieve customer', error.message);
    }
  };

  /**
   * Get customer by account number (Staff and above)
   */
  public getCustomerByAccountNo = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { accountNo } = req.params;

      if (!accountNo) {
        ResponseUtil.badRequest(res, 'Account number is required');
        return;
      }

      const customer = await this.customersService.getCustomerByAccountNo(accountNo);
      ResponseUtil.success(res, customer, 'Customer retrieved successfully');
    } catch (error: any) {
      console.error('Get customer by account number error:', error);

      if (error.message === 'Customer not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to retrieve customer', error.message);
    }
  };

  /**
   * Get customer by phone number (Staff and above)
   */
  public getCustomerByPhone = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = customerPhoneParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid phone number', error.details);
        return;
      }

      const customer = await this.customersService.getCustomerByPhone(value.phone);
      ResponseUtil.success(res, customer, 'Customer retrieved successfully');
    } catch (error: any) {
      console.error('Get customer by phone error:', error);

      if (error.message.includes('Customer not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to retrieve customer', error.message);
    }
  };

  /**
   * Update customer by phone number (Staff and above)
   */
  public updateCustomerByPhone = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = customerPhoneParamSchema.validate(
        req.params
      );
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid phone number', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateCustomerSchema.validate(req.body);
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      const customer = await this.customersService.updateCustomerByPhone(
        paramValue.phone,
        bodyValue,
        req.user.id
      );

      ResponseUtil.success(res, customer, 'Customer updated successfully');
    } catch (error: any) {
      console.error('Update customer by phone error:', error);

      if (error.message.includes('Customer not found')) {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to update customer', error.message);
    }
  };

  /**
   * Update customer by ID (Staff and above)
   */
  public updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = customerIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid customer ID', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = updateCustomerSchema.validate(req.body);
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      const customer = await this.customersService.updateCustomer(
        paramValue.id,
        bodyValue,
        req.user.id
      );

      ResponseUtil.success(res, customer, 'Customer updated successfully');
    } catch (error: any) {
      console.error('Update customer error:', error);

      if (error.message === 'Customer not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to update customer', error.message);
    }
  };

  /**
   * Delete customer by ID (Admin only)
   */
  public deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate parameters
      const { error, value } = customerIdParamSchema.validate(req.params);
      if (error) {
        ResponseUtil.badRequest(res, 'Invalid customer ID', error.details);
        return;
      }

      await this.customersService.deleteCustomerById(value.id);
      ResponseUtil.success(res, null, 'Customer deleted successfully');
    } catch (error: any) {
      console.error('Delete customer error:', error);

      if (error.message === 'Customer not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to delete customer', error.message);
    }
  };

  /**
   * Customer login (Public)
   */
  public customerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const { error, value } = customerLoginSchema.validate(req.body);
      if (error) {
        ResponseUtil.badRequest(res, 'Validation failed', error.details);
        return;
      }

      const customer = await this.customersService.authenticateCustomer(
        value.accountNo,
        value.password
      );

      ResponseUtil.success(res, customer, 'Customer login successful');
    } catch (error: any) {
      console.error('Customer login error:', error);

      if (
        error.message.includes('Invalid credentials') ||
        error.message.includes('not active') ||
        error.message.includes('password set')
      ) {
        ResponseUtil.unauthorized(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Login failed', error.message);
    }
  };

  /**
   * Change customer password (Customer themselves or Staff and above)
   */
  public changeCustomerPassword = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      // Validate parameters
      const { error: paramError, value: paramValue } = customerIdParamSchema.validate(req.params);
      if (paramError) {
        ResponseUtil.badRequest(res, 'Invalid customer ID', paramError.details);
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } = changeCustomerPasswordSchema.validate(
        req.body
      );
      if (bodyError) {
        ResponseUtil.badRequest(res, 'Validation failed', bodyError.details);
        return;
      }

      await this.customersService.changeCustomerPassword(
        paramValue.id,
        bodyValue.currentPassword,
        bodyValue.newPassword
      );

      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (error: any) {
      console.error('Change customer password error:', error);

      if (error.message === 'Customer not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      if (error.message.includes('Current password is incorrect')) {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.error(res, 'Failed to change password', error.message);
    }
  };

  /**
   * Get customer statistics (Manager and Admin only)
   */
  public getCustomerStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.customersService.getCustomerStats();
      ResponseUtil.success(res, stats, 'Customer statistics retrieved successfully');
    } catch (error: any) {
      console.error('Get customer stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve customer statistics', error.message);
    }
  };
}
