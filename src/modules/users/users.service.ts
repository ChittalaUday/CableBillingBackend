import bcrypt from 'bcryptjs';
import { prisma } from '@/database/prisma.service';
import config from '@/config';
import { User, Prisma } from '@prisma/client';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UsersService {
  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, config.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || null,
        role: userData.role || 'STAFF',
        isActive: true,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Get all users with filtering and pagination
   */
  async getUsers(query: GetUsersQuery): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (typeof isVerified === 'boolean') {
      where.isVerified = isVerified;
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user by ID
   */
  async updateUserById(id: string, updateData: UpdateUserData): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check for email/username conflicts
    if (updateData.email || updateData.username) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(updateData.email ? [{ email: updateData.email }] : []),
                ...(updateData.username ? [{ username: updateData.username }] : []),
              ],
            },
          ],
        },
      });

      if (conflictUser) {
        throw new Error('User with this email or username already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete user by ID (soft delete by deactivating)
   */
  async deleteUserById(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete by deactivating the user
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
        username: `deleted_${Date.now()}_${user.username}`, // Prevent username conflicts
      },
    });
  }

  /**
   * Permanently delete user by ID (hard delete)
   */
  async permanentlyDeleteUserById(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete related records first (handle foreign key constraints)
    await prisma.$transaction(async tx => {
      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: id },
      });

      // Delete reports
      await tx.report.deleteMany({
        where: { createdBy: id },
      });

      // Update complaints to remove assigned user
      await tx.complaint.updateMany({
        where: { assignedTo: id },
        data: { assignedTo: null },
      });

      // Delete transactions, bills created by this user
      await tx.transaction.deleteMany({
        where: { customer: { createdBy: id } },
      });

      await tx.bill.deleteMany({
        where: { createdBy: id },
      });

      // Delete customers created by this user
      await tx.customer.deleteMany({
        where: { createdBy: id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });
  }

  /**
   * Change user password
   */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    byRole: { [key: string]: number };
    active: number;
    verified: number;
  }> {
    const [total, byRole, active, verified] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isVerified: true } }),
    ]);

    const roleStats = byRole.reduce(
      (acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      },
      {} as { [key: string]: number }
    );

    return {
      total,
      byRole: roleStats,
      active,
      verified,
    };
  }

  /**
   * Activate/Deactivate user
   */
  async toggleUserStatus(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Verify user
   */
  async verifyUser(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
