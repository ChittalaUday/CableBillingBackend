import { prisma } from '@/database/prisma.service';
import { Bill, Payment, DueSettlement, Transaction } from '@prisma/client';

export interface CreateBillData {
  customerId: string;
  amount: number;
  billDate: Date;
  dueDate: Date;
  notes?: string;
  generatedBy: string;
}

export interface CreatePaymentData {
  customerId: string;
  amount: number;
  paymentMethod: string;
  paymentSource: string;
  paymentDate: Date;
  billId?: string;
  collectedBy?: string;
  notes?: string;
}

export interface CreateDueSettlementData {
  customerId: string;
  billId: string;
  settledAmount: number;
  notes?: string;
  settledBy: string;
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

export interface PaymentResponse {
  id: string;
  paymentNumber: string;
  customerId: string;
  billId?: string | null;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  paymentSource: string;
  collectedBy?: string | null;
  isReceiptGenerated: boolean;
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
  relatedPaymentId?: string | null;
  relatedDueSettlementId?: string | null;
  relatedActionId?: string | null;
}

export class BillingService {
  /**
   * Create a new bill
   */
  public async createBill(
    data: CreateBillData
  ): Promise<{ bill: BillResponse; transaction: TransactionResponse }> {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // Generate unique bill number
      const billNumber = await this.generateBillNumber();

      // Create the bill
      const bill = await tx.bill.create({
        data: {
          billNumber,
          customerId: data.customerId,
          billDate: data.billDate,
          dueDate: data.dueDate,
          amount: data.amount,
          notes: data.notes || null,
          createdBy: data.generatedBy,
          generatedBy: data.generatedBy,
          isPhysicalBillGenerated: false,
        },
      });

      // Update customer's last bill date
      await tx.customer.update({
        where: { id: data.customerId },
        data: {
          lastBillDate: data.billDate,
          nextBillDate: data.dueDate,
        },
      });

      // Create a corresponding transaction record
      const transactionNumber = await this.generateTransactionNumber();
      const transactionDescription = `Bill generated for customer - Amount: ${data.amount}`;

      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: data.customerId,
          type: 'BILL_GENERATED',
          amount: data.amount,
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

  /**
   * Create a payment
   */
  public async createPayment(
    data: CreatePaymentData
  ): Promise<{ payment: PaymentResponse; transaction: TransactionResponse }> {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // Generate unique payment number
      const paymentNumber = await this.generatePaymentNumber();

      // Create the payment
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: data.customerId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          paymentSource: data.paymentSource,
          paymentDate: data.paymentDate,
          billId: data.billId || null,
          collectedBy: data.collectedBy || null,
          notes: data.notes || null,
          isReceiptGenerated: false,
          status: 'COMPLETED',
        },
      });

      // If payment is for a specific bill, update bill status
      if (data.billId) {
        const bill = await tx.bill.findUnique({
          where: { id: data.billId },
        });

        if (bill) {
          // Calculate if bill is fully paid
          const existingPayments = await tx.payment.findMany({
            where: { billId: data.billId },
          });

          const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0) + data.amount;
          const isFullyPaid = totalPaid >= bill.amount;

          await tx.bill.update({
            where: { id: data.billId },
            data: {
              paidAt: isFullyPaid ? new Date() : bill.paidAt,
              paidAmount: totalPaid,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
            },
          });
        }
      }

      // Create a corresponding transaction record
      const transactionNumber = await this.generateTransactionNumber();
      const transactionDescription = `Payment received from customer - Amount: ${data.amount}, Method: ${data.paymentMethod}`;

      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: data.customerId,
          type: 'PAYMENT_RECEIVED',
          amount: data.amount,
          description: transactionDescription,
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: data.collectedBy || null,
          relatedPaymentId: payment.id,
        },
      });

      return {
        payment: this.mapToPaymentResponse(payment),
        transaction: this.mapToTransactionResponse(transaction),
      };
    });

    return result;
  }

  /**
   * Create a due settlement
   */
  public async createDueSettlement(
    data: CreateDueSettlementData
  ): Promise<{ dueSettlement: DueSettlementResponse; transaction: TransactionResponse }> {
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
      // Get the bill to determine original amount
      const bill = await tx.bill.findUnique({
        where: { id: data.billId },
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      // Calculate remaining amount
      const existingSettlements = await tx.dueSettlement.findMany({
        where: { billId: data.billId },
      });

      const settledAmount = existingSettlements.reduce((sum, s) => sum + s.settledAmount, 0);
      const remainingAmount = bill.amount - settledAmount - data.settledAmount;

      // Create the due settlement
      const dueSettlement = await tx.dueSettlement.create({
        data: {
          customerId: data.customerId,
          billId: data.billId,
          originalAmount: bill.amount,
          settledAmount: data.settledAmount,
          remainingAmount,
          settlementDate: new Date(),
          status: remainingAmount <= 0 ? 'SETTLED' : 'PARTIAL',
          notes: data.notes || null,
          settledBy: data.settledBy,
        },
      });

      // Update bill status if fully settled
      if (remainingAmount <= 0) {
        await tx.bill.update({
          where: { id: data.billId },
          data: {
            status: 'SETTLED',
          },
        });
      }

      // Create a corresponding transaction record
      const transactionNumber = await this.generateTransactionNumber();
      const transactionDescription = `Due settlement processed for customer - Amount: ${data.settledAmount}`;

      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: data.customerId,
          type: 'DUE_SETTLED',
          amount: data.settledAmount,
          description: transactionDescription,
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: data.settledBy,
          relatedDueSettlementId: dueSettlement.id,
        },
      });

      return {
        dueSettlement: this.mapToDueSettlementResponse(dueSettlement),
        transaction: this.mapToTransactionResponse(transaction),
      };
    });

    return result;
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
   * Get all payments for a customer
   */
  public async getPaymentsByCustomer(customerId: string): Promise<PaymentResponse[]> {
    const payments = await prisma.payment.findMany({
      where: { customerId },
      orderBy: { paymentDate: 'desc' },
    });

    return payments.map(this.mapToPaymentResponse);
  }

  /**
   * Get payment by ID
   */
  public async getPaymentById(id: string): Promise<PaymentResponse | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    return payment ? this.mapToPaymentResponse(payment) : null;
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
   * Generate unique payment number
   */
  private async generatePaymentNumber(): Promise<string> {
    const prefix = 'PYMT';
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const paymentNumber = `${prefix}${timestamp}${random}`;

    // Check if the generated number already exists
    const existing = await prisma.payment.findUnique({
      where: { paymentNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generatePaymentNumber();
    }

    return paymentNumber;
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
   * Map database payment to response format
   */
  private mapToPaymentResponse(payment: Payment): PaymentResponse {
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      customerId: payment.customerId,
      billId: payment.billId,
      amount: parseFloat(payment.amount.toString()),
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      paymentSource: payment.paymentSource,
      collectedBy: payment.collectedBy,
      isReceiptGenerated: payment.isReceiptGenerated,
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
      relatedPaymentId: transaction.relatedPaymentId,
      relatedDueSettlementId: transaction.relatedDueSettlementId,
      relatedActionId: transaction.relatedActionId,
    };
  }
}
