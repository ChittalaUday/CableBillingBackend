import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger.util';

const prisma = new PrismaClient();

interface SampleComplaint {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
}

export class ComplaintsSeeder {
  private readonly SAMPLE_COMPLAINTS: SampleComplaint[] = [
    {
      title: 'TV Signal Issue',
      description: 'Customer is experiencing intermittent signal loss on multiple channels',
      category: 'REPAIR',
      priority: 'MEDIUM',
      status: 'OPEN',
    },
    {
      title: 'New Connection Request',
      description: 'Customer wants to set up a new cable connection at their residence',
      category: 'NEW_INSTALLATION',
      priority: 'HIGH',
      status: 'OPEN',
    },
    {
      title: 'Payment Collection',
      description: 'Customer requested home visit for payment collection',
      category: 'HOME_VISIT_COLLECTION',
      priority: 'LOW',
      status: 'IN_PROGRESS',
    },
    {
      title: 'Cable Cut Repair',
      description: 'Customer reported cable cut near the street pole',
      category: 'WIRE_CUT',
      priority: 'URGENT',
      status: 'OPEN',
    },
    {
      title: 'Box Not Working',
      description: 'Set-top box is not powering on despite all connections being proper',
      category: 'REPAIR',
      priority: 'MEDIUM',
      status: 'RESOLVED',
    },
  ];

  /**
   * Seed sample complaints
   */
  public async seed(): Promise<void> {
    try {
      Logger.info('Starting complaints seeding...');

      // Get some customers to assign complaints to
      const customers = await prisma.customer.findMany({
        take: 5,
        select: { id: true },
      });

      if (customers.length === 0) {
        Logger.warn('No customers found. Skipping complaints seeding.');
        return;
      }

      let successCount = 0;

      for (let i = 0; i < this.SAMPLE_COMPLAINTS.length; i++) {
        const complaintData = this.SAMPLE_COMPLAINTS[i];
        if (!complaintData) continue;

        const customerIndex = i % customers.length;
        if (!customers[customerIndex]) continue;
        const customerId = customers[customerIndex].id;

        try {
          // Generate a unique complaint number
          const complaintCount = await prisma.complaint.count();
          const complaintNumber = `CMP-${String(complaintCount + i + 1).padStart(6, '0')}`;

          await prisma.complaint.create({
            data: {
              complaintNumber,
              customerId,
              title: complaintData.title,
              description: complaintData.description,
              category: complaintData.category,
              priority: complaintData.priority,
              status: complaintData.status,
            },
          });

          successCount++;
        } catch (error: any) {
          Logger.warn(`Failed to create complaint "${complaintData.title}": ${error.message}`);
        }
      }

      Logger.info(`Complaints seeding completed. Success: ${successCount}`);
    } catch (error) {
      Logger.error('Complaints seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all complaints
   */
  public async clear(): Promise<void> {
    try {
      Logger.info('Clearing complaints...');

      // Remove assigned users first
      await prisma.complaint.updateMany({
        where: { assignedTo: { not: null } },
        data: { assignedTo: null },
      });

      // Delete all complaints
      await prisma.complaint.deleteMany();

      Logger.info('All complaints cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear complaints:', error);
      throw error;
    }
  }
}

// Export seeder functions
export const seedComplaints = async (): Promise<void> => {
  const seeder = new ComplaintsSeeder();
  await seeder.seed();
};

export const clearComplaints = async (): Promise<void> => {
  const seeder = new ComplaintsSeeder();
  await seeder.clear();
};
