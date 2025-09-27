import { prisma } from '@/database/prisma.service';
import { Plan, PlanType } from '@prisma/client';

export interface CreatePlanData {
  name: string;
  description?: string;
  type: PlanType;
  price: number;
  channels: string[];
  packageDetails?: any;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  type?: PlanType;
  price?: number;
  channels?: string[];
  packageDetails?: any;
  isActive?: boolean;
}

export interface GetPlansQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: PlanType;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlanResponse {
  id: string;
  name: string;
  description?: string | null;
  type: PlanType;
  price: number;
  channels: string[];
  packageDetails?: any | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPlansResponse {
  plans: PlanResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PlansService {
  /**
   * Create a new plan
   */
  public async createPlan(data: CreatePlanData): Promise<PlanResponse> {
    // Check if plan name already exists
    const existingPlan = await prisma.plan.findUnique({
      where: { name: data.name },
    });

    if (existingPlan) {
      throw new Error('Plan with this name already exists');
    }

    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        description: data.description || null,
        type: data.type,
        price: data.price,
        channels: data.channels,
        packageDetails: data.packageDetails || null,
      },
    });

    return this.mapToPlanResponse(plan);
  }

  /**
   * Get all plans with filtering and pagination
   */
  public async getPlans(query: GetPlansQuery): Promise<PaginatedPlansResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.plan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      plans: plans.map(this.mapToPlanResponse),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get plan by ID
   */
  public async getPlanById(id: string): Promise<PlanResponse> {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    return this.mapToPlanResponse(plan);
  }

  /**
   * Update plan by ID
   */
  public async updatePlan(id: string, data: UpdatePlanData): Promise<PlanResponse> {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check for unique constraints
    if (data.name && data.name !== plan.name) {
      const existingName = await prisma.plan.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new Error('Plan with this name already exists');
      }
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data,
    });

    return this.mapToPlanResponse(updatedPlan);
  }

  /**
   * Delete plan by ID
   */
  public async deletePlanById(id: string): Promise<void> {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if plan has active subscriptions
    if (plan._count && plan._count.subscriptions > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }

    await prisma.plan.delete({
      where: { id },
    });
  }

  /**
   * Get plan statistics
   */
  public async getPlanStats(): Promise<any> {
    const [totalPlans, activePlans, inactivePlans, planTypeStats, subscriptionStats] =
      await Promise.all([
        prisma.plan.count(),
        prisma.plan.count({ where: { isActive: true } }),
        prisma.plan.count({ where: { isActive: false } }),
        prisma.plan.groupBy({
          by: ['type'],
          _count: { type: true },
        }),
        prisma.plan.findMany({
          include: {
            _count: {
              select: {
                subscriptions: true,
              },
            },
          },
        }),
      ]);

    return {
      totalPlans,
      activePlans,
      inactivePlans,
      planTypeStats: planTypeStats.reduce(
        (acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        },
        {} as Record<string, number>
      ),
      subscriptionStats: subscriptionStats.map(plan => ({
        planId: plan.id,
        planName: plan.name,
        subscriptions: plan._count?.subscriptions || 0,
      })),
    };
  }

  /**
   * Map database plan to response format
   */
  private mapToPlanResponse(plan: any): PlanResponse {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: parseFloat(plan.price.toString()),
      channels: plan.channels,
      packageDetails: plan.packageDetails,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
