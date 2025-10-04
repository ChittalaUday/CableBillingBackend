import { prisma } from '@/database/prisma.service';
import { Bill, DueSettlement, Transaction } from '@prisma/client';

export interface CreateBillData {
  customerId: string;
  planId: string[];
  amountPaid: number;
  billDate: Date;
  dueDate: Date;
  notes?: string;
  generatedBy: string;
}

export interface CreateDueSettlementData {
  customerId: string;
  billId: string;
  settledAmount: number;
  notes?: string;
  settledBy: string;
}

export interface CalculateBillingData {
  customerId: string;
  planIds: string[];
  amountPaid?: number;
}

export interface BillResponse {
  id: string;
  billNumber: string;
  customerId: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  status: string;
  paidAt?: Date | null;
  paidAmount?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  generatedBy: string;
  isPhysicalBillGenerated: boolean;
}

export interface DueSettlementResponse {
  id: string;
  customerId: string;
  billId: string;
  originalAmount: number;
  settledAmount: number;
  remainingAmount: number;
  settlementDate: Date;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  settledBy: string;
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
  referenceId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  performedBy?: string | null;
  relatedBillId?: string | null;
  relatedDueSettlementId?: string | null;
  relatedActionId?: string | null;
}

export class BillingService {
  /**
   * Calculate billing information based on customer and selected plans
   * This is a temporary calculation that doesn't make any changes to the database
   */
  public async calculateBilling(data: CalculateBillingData): Promise<{
    totalAmount: number;
    amountPaid: number;
    dueAmount: number;
    dueDate: Date;
    customerBalance: number;
    plans: any[];
  }> {
    // Get customer information
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get plan information
    const plans = await prisma.plan.findMany({
      where: { id: { in: data.planIds } },
    });

    if (plans.length !== data.planIds.length) {
      throw new Error('One or more plans not found');
    }

    // Calculate total amount based on plans
    let totalAmount = 0;
    let maxDuration = 1; // Default to 1 month

    const planDetails = plans.map(plan => {
      // Use discounted price if available, otherwise use regular price
      const effectivePrice = plan.discountedPrice !== null ? plan.discountedPrice : plan.price;

      // Calculate amount for this plan (price * duration in months)
      const planAmount = effectivePrice * plan.months;

      // Track maximum duration for due date calculation
      if (plan.months > maxDuration) {
        maxDuration = plan.months;
      }

      totalAmount += planAmount;

      return {
        id: plan.id,
        name: plan.name,
        price: plan.price,

        discountedPrice: plan.discountedPrice,
        effectivePrice: effectivePrice,
        months: plan.months,
        amount: planAmount,
      };
    });

    // Calculate due amount
    const amountPaid = data.amountPaid || 0;
    const dueAmount = Math.max(0, totalAmount - amountPaid);

    // Calculate due date (current date + max plan duration in months)
    // For consistency with createBill, we should use a reference date
    // In a real scenario, this would be the bill date when actually creating the bill
    const referenceDate = new Date(); // Current date for calculation purposes
    const dueDate = new Date(referenceDate);
    dueDate.setMonth(dueDate.getMonth() + maxDuration);

    // Calculate customer balance (existing balance + due amount)
    // The customer balance represents what the customer owes or is owed
    // If positive, customer owes money; if negative, customer has credit
    const customerBalance = (customer as any).balance + dueAmount;

    return {
      totalAmount,
      amountPaid,
      dueAmount,
      dueDate,
      customerBalance,
      plans: planDetails,
    };
  }

  /**
   * Create a new bill with calculated amounts based on plan pricing and duration
   * - Calculates amount based on plan duration and pricing (discounted price if available)
   * - Uses highest plan duration for due date calculation when multiple plans are provided
   * - Creates corresponding transaction record
   * - Updates customer billing dates
   * - Returns both the bill and transaction
   */
  public async createBill(
    data: CreateBillData
  ): Promise<{ bill: BillResponse; transaction: TransactionResponse }> {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // Get plan information to calculate amount and due date
      const plans = await tx.plan.findMany({
        where: { id: { in: data.planId } },
      });

      // check customer exists
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      if (plans.length !== data.planId.length) {
        throw new Error('One or more plans not found');
      }

      // Calculate total amount based on plans and find max duration
      let totalAmount = customer.balance || 0;
      let maxDuration = 1; // Default to 1 month
      let amountPaid = data.amountPaid || 0;

      const planDetails = plans.map(plan => {
        // Use discounted price if available, otherwise use regular price
        const effectivePrice = plan.discountedPrice !== null ? plan.discountedPrice : plan.price;

        // Calculate amount for this plan (effective price * duration in months)
        const planAmount = effectivePrice * plan.months;

        // Track maximum duration for due date calculation
        if (plan.months > maxDuration) {
          maxDuration = plan.months;
        }

        totalAmount += planAmount;

        return {
          id: plan.id,
          name: plan.name,
          effectivePrice: effectivePrice,
          months: plan.months,
          amount: planAmount,
        };
      });

      // Calculate due date (bill date + max plan duration in months)
      const dueDate = new Date(data.billDate);
      dueDate.setMonth(dueDate.getMonth() + maxDuration);

      // Generate unique bill number
      const billNumber = await this.generateBillNumber();

      // Create the bill with calculated amount and due date
      const bill = await tx.bill.create({
        data: {
          billNumber,
          customerId: data.customerId,
          planId: data.planId,
          billDate: data.billDate,
          paidAmount: data.amountPaid,
          dueDate: dueDate,
          amount: totalAmount,
          notes: data.notes || null,
          createdBy: data.generatedBy,
          generatedBy: data.generatedBy,
          isPhysicalBillGenerated: false,
        },
      });

      // Update customer's last bill date and next bill date
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          lastBillDate: data.billDate,
          nextBillDate: dueDate,
        },
      });

      // Create a corresponding transaction record
      const transactionNumber = await this.generateTransactionNumber();
      const transactionDescription = `Bill generated for customer - Amount: ${totalAmount}`;

      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: data.customerId,
          type: 'BILL_GENERATED',
          amount: totalAmount,
          amountPaid: amountPaid,
          dueAmount: totalAmount - amountPaid,
          description: transactionDescription,
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: data.generatedBy,
          relatedBillId: bill.id,
        },
      });

      return {
        bill: this.mapToBillResponse(bill),
        transaction: this.mapToTransactionResponse(transaction),
      };
    });

    return result;
  }

  public async updateBill(data: { billId: string }, user: any): Promise<BillResponse> {
    // Update the bill to mark the physical bill as generated
    const updatedBill = await prisma.bill.update({
      where: { id: data.billId },
      data: {
        status: 'Completed',
        isPhysicalBillGenerated: true,
        updatedAt: new Date(),
      },
    });

    return this.mapToBillResponse(updatedBill);
  }

  /**
   * Get all bills for a customer
   */
  public async getBillsByCustomer(customerId: string): Promise<BillResponse[]> {
    const bills = await prisma.bill.findMany({
      where: { customerId },
      orderBy: { billDate: 'desc' },
    });

    return bills.map(this.mapToBillResponse);
  }

  /**
   * Get bill by ID
   */
  public async getBillById(id: string): Promise<BillResponse | null> {
    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    return bill ? this.mapToBillResponse(bill) : null;
  }

  /**
   * Get all due settlements for a customer
   */
  public async getDueSettlementsByCustomer(customerId: string): Promise<DueSettlementResponse[]> {
    const dueSettlements = await prisma.dueSettlement.findMany({
      where: { customerId },
      orderBy: { settlementDate: 'desc' },
    });

    return dueSettlements.map(this.mapToDueSettlementResponse);
  }

  /**
   * Get due settlement by ID
   */
  public async getDueSettlementById(id: string): Promise<DueSettlementResponse | null> {
    const dueSettlement = await prisma.dueSettlement.findUnique({
      where: { id },
    });

    return dueSettlement ? this.mapToDueSettlementResponse(dueSettlement) : null;
  }

  /**
   * Generate unique bill number
   */
  private async generateBillNumber(): Promise<string> {
    const prefix = 'BILL';
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const billNumber = `${prefix}${timestamp}${random}`;

    // Check if the generated number already exists
    const existing = await prisma.bill.findUnique({
      where: { billNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generateBillNumber();
    }

    return billNumber;
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
   * Map database bill to response format
   */
  private mapToBillResponse(bill: Bill): BillResponse {
    return {
      id: bill.id,
      billNumber: bill.billNumber,
      customerId: bill.customerId,
      billDate: bill.billDate,
      dueDate: bill.dueDate,
      amount: parseFloat(bill.amount.toString()),
      status: bill.status,
      paidAt: bill.paidAt,
      paidAmount: bill.paidAmount ? parseFloat(bill.paidAmount.toString()) : null,
      notes: bill.notes,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
      createdBy: bill.createdBy,
      generatedBy: bill.generatedBy,
      isPhysicalBillGenerated: bill.isPhysicalBillGenerated,
    };
  }

  /**
   * Map database due settlement to response format
   */
  private mapToDueSettlementResponse(dueSettlement: DueSettlement): DueSettlementResponse {
    return {
      id: dueSettlement.id,
      customerId: dueSettlement.customerId,
      billId: dueSettlement.billId,
      originalAmount: parseFloat(dueSettlement.originalAmount.toString()),
      settledAmount: parseFloat(dueSettlement.settledAmount.toString()),
      remainingAmount: parseFloat(dueSettlement.remainingAmount.toString()),
      settlementDate: dueSettlement.settlementDate,
      status: dueSettlement.status,
      notes: dueSettlement.notes,
      createdAt: dueSettlement.createdAt,
      updatedAt: dueSettlement.updatedAt,
      settledBy: dueSettlement.settledBy,
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
      referenceId: transaction.referenceId,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      performedBy: transaction.performedBy,
      relatedBillId: transaction.relatedBillId,
      relatedDueSettlementId: transaction.relatedDueSettlementId,
      relatedActionId: transaction.relatedActionId,
    };
  }
}
