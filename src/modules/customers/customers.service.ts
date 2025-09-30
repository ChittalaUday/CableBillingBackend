import bcrypt from 'bcryptjs';
import { prisma } from '@/database/prisma.service';
import { Customer } from '@prisma/client';

export interface CreateCustomerData {
  accountNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  password?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  connectionType: string;
  packageType: string;
  monthlyRate: number;
  installationDate: Date;
  notes?: string;
  createdBy: string;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  connectionType?: string;
  packageType?: string;
  monthlyRate?: number;
  installationDate?: Date;
  status?: string;
  notes?: string;
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  connectionType?: string;
  packageType?: string;
  city?: string;
  state?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerResponse {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  connectionType: string;
  packageType: string;
  monthlyRate: number;
  installationDate: Date;
  lastBillDate?: Date | null;
  nextBillDate?: Date | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string | null;
}

export interface PaginatedCustomersResponse {
  customers: CustomerResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CustomersService {
  /**
   * Create a new customer
   */
  public async createCustomer(data: CreateCustomerData): Promise<CustomerResponse> {
    // Check if phone already exists
    const existingPhone = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new Error('Customer with this phone number already exists');
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    // Generate customer number
    const customerNumber = await this.generateCustomerNumber();

    // Hash password if provided
    let hashedPassword = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const customer = await prisma.customer.create({
      data: {
        accountNo: data.accountNo,
        customerNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        connectionType: data.connectionType,
        packageType: data.packageType,
        monthlyRate: data.monthlyRate,
        installationDate: data.installationDate,
        notes: data.notes || null,
        createdBy: data.createdBy,
      },
    });

    return this.mapToCustomerResponse(customer);
  }

  /**
   * Get all customers with filtering and pagination
   */
  public async getCustomers(query: GetCustomersQuery): Promise<PaginatedCustomersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      connectionType,
      packageType,
      city,
      state,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (connectionType) {
      where.connectionType = connectionType;
    }

    if (packageType) {
      where.packageType = packageType;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      customers: customers.map(this.mapToCustomerResponse),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get customer by ID
   */
  public async getCustomerById(id: string): Promise<CustomerResponse> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            bills: true,
            complaints: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.mapToCustomerResponse(customer);
  }

  /**
   * Get customer by account number
   */
  public async getCustomerByAccountNo(accountNo: string): Promise<CustomerResponse> {
    const customer = await prisma.customer.findFirst({
      where: { customerNumber: accountNo },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.mapToCustomerResponse(customer);
  }

  /**
   * Get customer by phone number (for staff to find and update customer details)
   */
  public async getCustomerByPhone(phone: string): Promise<CustomerResponse> {
    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/[^\d]/g, '');

    const customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      throw new Error('Customer not found with this phone number');
    }

    return this.mapToCustomerResponse(customer);
  }

  /**
   * Update customer by phone number (for staff to update customer details)
   */
  public async updateCustomerByPhone(
    phone: string,
    data: UpdateCustomerData,
    updatedBy: string
  ): Promise<CustomerResponse> {
    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/[^\d]/g, '');

    const customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      throw new Error('Customer not found with this phone number');
    }

    // Check for unique constraints (excluding current customer)
    if (data.email && data.email !== customer.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existingEmail && existingEmail.id !== customer.id) {
        throw new Error('Another customer with this email already exists');
      }
    }

    if (data.phone && data.phone !== customer.phone) {
      const cleanNewPhone = data.phone.replace(/[^\d]/g, '');
      const existingPhone = await prisma.customer.findUnique({
        where: { phone: cleanNewPhone },
      });

      if (existingPhone && existingPhone.id !== customer.id) {
        throw new Error('Another customer with this phone number already exists');
      }
    }

    // Hash password if provided
    let updateData: any = { ...data, updatedBy };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Clean the new phone number if provided
    if (updateData.phone) {
      updateData.phone = updateData.phone.replace(/[^\d]/g, '');
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
    });

    return this.mapToCustomerResponse(updatedCustomer);
  }

  /**
   * Update customer by ID
   */
  public async updateCustomer(
    id: string,
    data: UpdateCustomerData,
    updatedBy: string
  ): Promise<CustomerResponse> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check for unique constraints
    if (data.email && data.email !== customer.email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new Error('Customer with this email already exists');
      }
    }

    if (data.phone && data.phone !== customer.phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw new Error('Customer with this phone number already exists');
      }
    }

    // Hash password if provided
    let updateData: any = { ...data, updatedBy };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return this.mapToCustomerResponse(updatedCustomer);
  }

  /**
   * Delete customer by ID
   */
  public async deleteCustomerById(id: string): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Delete related records first (handle foreign key constraints)
    await prisma.$transaction(async tx => {
      // Delete transactions
      await tx.transaction.deleteMany({
        where: { customerId: id },
      });

      // Delete due settlements
      await tx.dueSettlement.deleteMany({
        where: { customerId: id },
      });

      // Delete complaints
      await tx.complaint.deleteMany({
        where: { customerId: id },
      });

      // Delete bills
      await tx.bill.deleteMany({
        where: { customerId: id },
      });

      // Finally delete the customer
      await tx.customer.delete({
        where: { id },
      });
    });
  }

  /**
   * Authenticate customer for login
   */
  public async authenticateCustomer(
    accountNo: string,
    password: string
  ): Promise<CustomerResponse> {
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ accountNo: accountNo }, { customerNumber: accountNo }],
      },
    });

    if (!customer) {
      throw new Error('Invalid credentials');
    }

    if (customer.status !== 'ACTIVE') {
      throw new Error('Customer account is not active');
    }

    if (!customer.password) {
      throw new Error('No password set for this customer');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return this.mapToCustomerResponse(customer);
  }

  /**
   * Change customer password
   */
  public async changeCustomerPassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }
  }

  /**
   * Get customer statistics
   */
  public async getCustomerStats(): Promise<any> {
    const [
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      disconnectedCustomers,
      pendingCustomers,
      recentCustomers,
      connectionTypeStats,
      packageTypeStats,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'SUSPENDED' } }),
      prisma.customer.count({ where: { status: 'DISCONNECTED' } }),
      prisma.customer.count({ where: { status: 'PENDING' } }),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.customer.groupBy({
        by: ['connectionType'],
        _count: { connectionType: true },
      }),
      prisma.customer.groupBy({
        by: ['packageType'],
        _count: { packageType: true },
      }),
    ]);

    return {
      totalCustomers,
      statusBreakdown: {
        active: activeCustomers,
        suspended: suspendedCustomers,
        disconnected: disconnectedCustomers,
        pending: pendingCustomers,
      },
      recentCustomers,
      connectionTypeStats: connectionTypeStats.reduce(
        (acc, item) => {
          acc[item.connectionType] = item._count.connectionType;
          return acc;
        },
        {} as Record<string, number>
      ),
      packageTypeStats: packageTypeStats.reduce(
        (acc, item) => {
          acc[item.packageType] = item._count.packageType;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  /**
   * Generate unique customer number
   */
  private async generateCustomerNumber(): Promise<string> {
    const prefix = 'C';
    const randomNumber = Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, '0');
    const customerNumber = `${prefix}${randomNumber}`;

    // Check if the generated number already exists
    const existing = await prisma.customer.findUnique({
      where: { customerNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generateCustomerNumber();
    }

    return customerNumber;
  }

  /**
   * Map database customer to response format
   */
  private mapToCustomerResponse(customer: any): CustomerResponse {
    return {
      id: customer.id,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      connectionType: customer.connectionType,
      packageType: customer.packageType,
      monthlyRate: parseFloat(customer.monthlyRate.toString()),
      installationDate: customer.installationDate,
      lastBillDate: customer.lastBillDate,
      nextBillDate: customer.nextBillDate,
      status: customer.status,
      notes: customer.notes,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
    };
  }
}
