import { prisma } from '@/database/prisma.service';
import { Prisma, Complaint } from '@prisma/client';
import { Logger } from '@/utils/logger.util';

export interface CreateComplaintData {
  customerId: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  assignedTo?: string | null;
}

export interface UpdateComplaintData {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  assignedTo?: string | null;
  resolution?: string | null;
  resolvedAt?: Date | null;
}

export interface GetComplaintsQuery {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
}

export class ComplaintsService {
  /**
   * Create a new complaint
   */
  async createComplaint(data: CreateComplaintData): Promise<Complaint> {
    try {
      // Generate a unique complaint number
      const complaintCount = await prisma.complaint.count();
      const complaintNumber = `CMP-${String(complaintCount + 1).padStart(6, '0')}`;

      const complaintData: any = {
        complaintNumber,
        customer: { connect: { id: data.customerId } },
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'MEDIUM',
      };

      // Only add assignedUser if it's not null
      if (data.assignedTo !== undefined) {
        complaintData.assignedUser = data.assignedTo ? { connect: { id: data.assignedTo } } : null;
      }

      const complaint = await prisma.complaint.create({
        data: complaintData,
      });

      Logger.info(`Complaint created: ${complaint.id}`, { complaintId: complaint.id });
      return complaint;
    } catch (error) {
      Logger.error('Error creating complaint', error);
      throw error;
    }
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      const complaint = await prisma.complaint.findUnique({
        where: { id },
      });

      return complaint;
    } catch (error) {
      Logger.error(`Error fetching complaint ${id}`, error);
      throw error;
    }
  }

  /**
   * Get complaints with filtering and pagination
   */
  async getComplaints(
    query: GetComplaintsQuery
  ): Promise<{ complaints: Complaint[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        priority,
        assignedTo,
        customerId,
        search,
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ComplaintWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (category) {
        where.category = category;
      }

      if (priority) {
        where.priority = priority;
      }

      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { complaintNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.complaint.count({ where }),
      ]);

      return { complaints, total };
    } catch (error) {
      Logger.error('Error fetching complaints', error);
      throw error;
    }
  }

  /**
   * Get complaints by customer ID
   */
  async getComplaintsByCustomer(customerId: string): Promise<Complaint[]> {
    try {
      const complaints = await prisma.complaint.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      return complaints;
    } catch (error) {
      Logger.error(`Error fetching complaints for customer ${customerId}`, error);
      throw error;
    }
  }

  /**
   * Update complaint
   */
  async updateComplaint(id: string, data: UpdateComplaintData): Promise<Complaint> {
    try {
      // If status is being updated to RESOLVED or CLOSED, set resolvedAt
      if ((data.status === 'RESOLVED' || data.status === 'CLOSED') && !data.resolvedAt) {
        data.resolvedAt = new Date();
      }

      const complaint = await prisma.complaint.update({
        where: { id },
        data,
      });

      Logger.info(`Complaint updated: ${complaint.id}`, { complaintId: complaint.id });
      return complaint;
    } catch (error) {
      Logger.error(`Error updating complaint ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete complaint
   */
  async deleteComplaint(id: string): Promise<Complaint> {
    try {
      const complaint = await prisma.complaint.delete({
        where: { id },
      });

      Logger.info(`Complaint deleted: ${complaint.id}`, { complaintId: complaint.id });
      return complaint;
    } catch (error) {
      Logger.error(`Error deleting complaint ${id}`, error);
      throw error;
    }
  }

  /**
   * Assign complaint to user
   */
  async assignComplaint(id: string, assignedTo: string | null): Promise<Complaint> {
    try {
      const complaint = await prisma.complaint.update({
        where: { id },
        data: { assignedTo },
      });

      Logger.info(`Complaint assigned: ${complaint.id}`, {
        complaintId: complaint.id,
        assignedTo,
      });
      return complaint;
    } catch (error) {
      Logger.error(`Error assigning complaint ${id}`, error);
      throw error;
    }
  }

  /**
   * Get complaint statistics
   */
  async getComplaintStats(): Promise<any> {
    try {
      const [total, open, inProgress, resolved, closed] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: 'OPEN' } }),
        prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { status: 'RESOLVED' } }),
        prisma.complaint.count({ where: { status: 'CLOSED' } }),
      ]);

      const byCategory = await prisma.complaint.groupBy({
        by: ['category'],
        _count: true,
      });

      const byPriority = await prisma.complaint.groupBy({
        by: ['priority'],
        _count: true,
      });

      return {
        total,
        open,
        inProgress,
        resolved,
        closed,
        byCategory,
        byPriority,
      };
    } catch (error) {
      Logger.error('Error fetching complaint stats', error);
      throw error;
    }
  }
}
