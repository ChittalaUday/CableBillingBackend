import { prisma } from '@/database/prisma.service';
import { BoxActivation, Customer, Transaction, User } from '@prisma/client';

export interface CreateBoxActivationData {
  customerId: string;
  actionType: string;
  performedBy?: string;
  reason?: string;
  notes?: string;
}

export interface BoxActivationResponse {
  id: string;
  customerId: string;
  actionType: string;
  actionDate: Date;
  performedBy?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionResponse {
  id: string;
  transactionNumber: string;
  customerId: string;
  type: string;
  amount: number;
  description: string;
  transactionDate: Date;
  status: string;
  performedBy?: string | null;
  relatedActionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BoxService {
  /**
   * Create a new box activation record
   */
  public async createBoxActivation(data: CreateBoxActivationData): Promise<{ boxActivation: BoxActivationResponse; transaction: TransactionResponse }> {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the box activation record
      const boxActivation = await tx.boxActivation.create({
        data: {
          customerId: data.customerId,
          actionType: data.actionType,
          performedBy: data.performedBy || null,
          reason: data.reason || null,
          notes: data.notes || null,
        },
      });

      // Update customer's box status
      let boxStatus = 'INACTIVE';
      if (data.actionType === 'ACTIVATED') {
        boxStatus = 'ACTIVE';
      } else if (data.actionType === 'SUSPENDED') {
        boxStatus = 'SUSPENDED';
      } else if (data.actionType === 'DEACTIVATED') {
        boxStatus = 'INACTIVE';
      } else if (data.actionType === 'REACTIVATED') {
        boxStatus = 'ACTIVE';
      }

      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          boxStatus,
          boxActivatedAt: data.actionType === 'ACTIVATED' ? new Date() : undefined,
          lastBoxStatusChangedAt: new Date(),
        },
      });

      // Create a corresponding transaction record
      const transactionNumber = await this.generateTransactionNumber();
      const transactionDescription = `Box ${data.actionType.toLowerCase()} for customer`;
      
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: data.customerId,
          type: `BOX_${data.actionType}`,
          amount: 0, // Box activations don't involve money directly
          description: transactionDescription,
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: data.performedBy || null,
          relatedActionId: boxActivation.id,
        },
      });

      // Update the box activation with the transaction ID
      await tx.boxActivation.update({
        where: { id: boxActivation.id },
        data: {
          transactionId: transaction.id,
        },
      });

      return {
        boxActivation: this.mapToBoxActivationResponse(boxActivation),
        transaction: this.mapToTransactionResponse(transaction),
      };
    });

    return result;
  }

  /**
   * Get all box activations for a customer
   */
  public async getBoxActivationsByCustomer(customerId: string): Promise<BoxActivationResponse[]> {
    const activations = await prisma.boxActivation.findMany({
      where: { customerId },
      orderBy: { actionDate: 'desc' },
    });

    return activations.map(this.mapToBoxActivationResponse);
  }

  /**
   * Get box activation by ID
   */
  public async getBoxActivationById(id: string): Promise<BoxActivationResponse | null> {
    const activation = await prisma.boxActivation.findUnique({
      where: { id },
    });

    return activation ? this.mapToBoxActivationResponse(activation) : null;
  }

  /**
   * Generate unique transaction number
   */
  private async generateTransactionNumber(): Promise<string> {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const transactionNumber = `${prefix}${timestamp}${random}`;

    // Check if the generated number already exists
    const existing = await prisma.transaction.findUnique({
      where: { transactionNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generateTransactionNumber();
    }

    return transactionNumber;
  }

  /**
   * Map database box activation to response format
   */
  private mapToBoxActivationResponse(activation: BoxActivation): BoxActivationResponse {
    return {
      id: activation.id,
      customerId: activation.customerId,
      actionType: activation.actionType,
      actionDate: activation.actionDate,
      performedBy: activation.performedBy,
      reason: activation.reason,
      notes: activation.notes,
      createdAt: activation.createdAt,
      updatedAt: activation.updatedAt,
    };
  }

  /**
   * Map database transaction to response format
   */
  private mapToTransactionResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      customerId: transaction.customerId,
      type: transaction.type,
      amount: parseFloat(transaction.amount.toString()),
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      status: transaction.status,
      performedBy: transaction.performedBy,
      relatedActionId: transaction.relatedActionId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}