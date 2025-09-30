import { BillingService } from '../../src/modules/billing/billing.service';
import { prisma } from '../../src/database/prisma.service';

// Mock the prisma client
jest.mock('../../src/database/prisma.service', () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    bill: {
      create: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    plan: {
      findMany: jest.fn(),
    },
  };
  
  return {
    prisma: mockPrisma,
  };
});

describe('BillingService - calculate billing', () => {
  let billingService: BillingService;
  
  beforeEach(() => {
    billingService = new BillingService();
    jest.clearAllMocks();
  });
  
  describe('createBill', () => {
    it('should calculate bill amount based on plan pricing and duration', async () => {
      // Mock plan data with different prices and durations
      const mockPlans = [
        {
          id: 'plan1',
          name: 'Basic Plan',
          price: 100,
          discountedPrice: null,
          months: 1,
        },
        {
          id: 'plan2',
          name: 'Premium Plan',
          price: 200,
          discountedPrice: 150, // Discounted price should be used
          months: 3,
        },
      ];
      
      // Mock the transaction function
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        // Mock plan.findMany to return our test plans
        (prisma.plan.findMany as jest.Mock).mockResolvedValue(mockPlans);
        
        // Mock the generateBillNumber and generateTransactionNumber methods
        billingService['generateBillNumber'] = jest.fn().mockResolvedValue('BILL001');
        billingService['generateTransactionNumber'] = jest.fn().mockResolvedValue('TXN001');
        
        // Mock bill.create
        (prisma.bill.create as jest.Mock).mockResolvedValue({
          id: 'bill1',
          billNumber: 'BILL001',
          customerId: 'customer1',
          planId: ['plan1', 'plan2'],
          billDate: new Date('2023-01-01'),
          dueDate: new Date('2023-04-01'), // 3 months from bill date
          amount: 550, // 100 * 1 + 150 * 3 = 550
          notes: null,
          createdBy: 'staff1',
          generatedBy: 'staff1',
          isPhysicalBillGenerated: false,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Mock transaction.create
        (prisma.transaction.create as jest.Mock).mockResolvedValue({
          id: 'txn1',
          transactionNumber: 'TXN001',
          customerId: 'customer1',
          type: 'BILL_GENERATED',
          amount: 550,
          description: 'Bill generated for customer - Amount: 550',
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: 'staff1',
          relatedBillId: 'bill1',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Mock customer.update
        (prisma.customer.update as jest.Mock).mockResolvedValue({});
        
        // Execute the callback with our mocked prisma client
        return callback(prisma);
      });
      
      const result = await billingService.createBill({
        customerId: 'customer1',
        planId: ['plan1', 'plan2'],
        amount: 0, // This should be recalculated
        billDate: new Date('2023-01-01'),
        dueDate: new Date('2023-01-01'), // This should be recalculated
        generatedBy: 'staff1',
      });
      
      // Verify the calculations
      expect(result.bill.amount).toBe(550); // 100 * 1 + 150 * 3
      expect(result.bill.dueDate).toEqual(new Date('2023-04-01')); // 3 months (max duration)
      expect(result.transaction.amount).toBe(550);
      
      // Verify mocks were called correctly
      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['plan1', 'plan2'] } },
      });
      
      expect(prisma.bill.create).toHaveBeenCalledWith({
        data: {
          billNumber: 'BILL001',
          customerId: 'customer1',
          planId: ['plan1', 'plan2'],
          billDate: new Date('2023-01-01'),
          dueDate: new Date('2023-04-01'),
          amount: 550,
          notes: null,
          createdBy: 'staff1',
          generatedBy: 'staff1',
          isPhysicalBillGenerated: false,
        },
      });
    });
    
    it('should handle single plan correctly', async () => {
      const mockPlans = [
        {
          id: 'plan1',
          name: 'Single Plan',
          price: 100,
          discountedPrice: 80,
          months: 2,
        },
      ];
      
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        (prisma.plan.findMany as jest.Mock).mockResolvedValue(mockPlans);
        billingService['generateBillNumber'] = jest.fn().mockResolvedValue('BILL002');
        billingService['generateTransactionNumber'] = jest.fn().mockResolvedValue('TXN002');
        
        (prisma.bill.create as jest.Mock).mockResolvedValue({
          id: 'bill2',
          billNumber: 'BILL002',
          customerId: 'customer2',
          planId: ['plan1'],
          billDate: new Date('2023-01-01'),
          dueDate: new Date('2023-03-01'), // 2 months from bill date
          amount: 160, // 80 * 2
          notes: null,
          createdBy: 'staff2',
          generatedBy: 'staff2',
          isPhysicalBillGenerated: false,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        (prisma.transaction.create as jest.Mock).mockResolvedValue({
          id: 'txn2',
          transactionNumber: 'TXN002',
          customerId: 'customer2',
          type: 'BILL_GENERATED',
          amount: 160,
          description: 'Bill generated for customer - Amount: 160',
          transactionDate: new Date(),
          status: 'COMPLETED',
          performedBy: 'staff2',
          relatedBillId: 'bill2',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        (prisma.customer.update as jest.Mock).mockResolvedValue({});
        
        return callback(prisma);
      });
      
      const result = await billingService.createBill({
        customerId: 'customer2',
        planId: ['plan1'],
        amount: 0,
        billDate: new Date('2023-01-01'),
        dueDate: new Date('2023-01-01'),
        generatedBy: 'staff2',
      });
      
      expect(result.bill.amount).toBe(160); // 80 * 2
      expect(result.bill.dueDate).toEqual(new Date('2023-03-01')); // 2 months
      expect(result.transaction.amount).toBe(160);
    });
  });
});