# Billing System

This document describes the comprehensive billing system implemented for the Cable Management System.

## Overview

The billing system provides complete financial tracking and management capabilities for the cable TV service. It includes functionality for creating bills, processing payments, managing due settlements, and maintaining a complete audit trail of all financial transactions.

## Key Features

### 1. Bill Management
- Create and track customer bills
- Automatic bill numbering
- Staff tracking for bill generation
- Physical bill generation flag
- Integration with customer account updates

### 2. Payment Processing
- Record customer payments
- Multiple payment sources (CASH, ONLINE, CHEQUE, CARD)
- Staff tracking for payment collection
- Receipt generation flag
- Automatic bill status updates

### 3. Due Settlement Management
- Process partial or full due settlements
- Track settlement history
- Staff tracking for settlements
- Automatic bill status updates

### 4. Transaction Logging
- Centralized ledger for all financial activities
- Automatic transaction generation for all operations
- Staff tracking for all transactions
- Comprehensive transaction types

### 5. Audit Trail
- Complete history of all financial actions
- Timestamped records
- Staff accountability
- Customer-specific tracking

## API Endpoints

### Bill Management
- `POST /api/billing/bills` - Create a new bill
- `GET /api/billing/bills/customer/:customerId` - Get all bills for a customer
- `GET /api/billing/bills/:id` - Get bill by ID

### Payment Processing
- `POST /api/billing/payments` - Create a new payment
- `GET /api/billing/payments/customer/:customerId` - Get all payments for a customer
- `GET /api/billing/payments/:id` - Get payment by ID

### Due Settlement Management
- `POST /api/billing/due-settlements` - Create a new due settlement
- `GET /api/billing/due-settlements/customer/:customerId` - Get all due settlements for a customer
- `GET /api/billing/due-settlements/:id` - Get due settlement by ID

## Data Models

### Bill
```prisma
model Bill {
  id                    String    @id @default(cuid())
  billNumber            String    @unique
  customerId            String
  billDate              DateTime
  dueDate               DateTime
  amount                Float
  status                String    @default("PENDING")
  paidAt                DateTime?
  paidAmount            Float?
  notes                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdBy             String
  generatedBy           String    // Staff who generated the bill
  isPhysicalBillGenerated Boolean @default(false) // Physical receipt generated
}
```

### Payment
```prisma
model Payment {
  id                 String   @id @default(cuid())
  paymentNumber      String   @unique
  customerId         String
  billId             String?
  amount             Float
  paymentMethod      String
  paymentDate        DateTime
  transactionId      String?  @unique
  status             String   @default("COMPLETED")
  notes              String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  paymentSource      String   // "CASH", "ONLINE", "CHEQUE", etc.
  collectedBy        String?  // Staff who collected payment
  isReceiptGenerated Boolean  @default(false) // Physical receipt generated
}
```

### Due Settlement
```prisma
model DueSettlement {
  id              String   @id @default(cuid())
  customerId      String
  billId          String
  originalAmount  Float
  settledAmount   Float
  remainingAmount Float
  settlementDate  DateTime
  status          String   @default("PARTIAL")
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  settledBy       String   // Staff who settled the due
}
```

### Transaction
```prisma
model Transaction {
  id                String   @id @default(cuid())
  transactionNumber String   @unique
  customerId        String
  type              String   // "BILL_GENERATED", "PAYMENT_RECEIVED", "DUE_SETTLED", etc.
  amount            Float
  description       String
  transactionDate   DateTime
  status            String   @default("COMPLETED")
  referenceId       String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  performedBy       String?  // Staff who executed action; null if system/online
  
  // Optional relations to other entities
  relatedBillId     String?  @unique
  relatedPaymentId  String?  @unique
  relatedDueSettlementId String?  @unique
  relatedActionId   String?  @unique
}
```

## Implementation Details

### 1. Database Transactions
All operations are performed within database transactions to ensure data consistency across related entities.

### 2. Automatic Updates
- Customer account information is automatically updated when bills are created
- Bill status is automatically updated when payments are processed
- Bill status is automatically updated when due settlements are processed

### 3. Unique Number Generation
- Bills, payments, and transactions have unique auto-generated numbers
- Collision detection and prevention for number generation

### 4. Staff Accountability
All actions are tied to specific staff members:
- Bill generation tracking
- Payment collection tracking
- Due settlement processing tracking

### 5. Audit Trail
Every financial action generates a corresponding transaction record:
- Complete history of all financial activities
- Timestamped records with user identification
- Linking between related entities

## Security and Authorization

### Role-Based Access Control
- Creating bills, payments, and due settlements requires STAFF or higher permissions
- Viewing financial data can be done by staff or the customer themselves
- Viewing specific financial records by ID requires STAFF or higher permissions

### Data Validation
- Comprehensive validation for all input data
- Proper error handling and messaging
- Protection against invalid operations

## Benefits

### 1. Complete Financial Tracking
- End-to-end tracking of all financial activities
- Real-time status updates
- Historical data retention

### 2. Enhanced Accountability
- All actions tied to specific staff members
- Complete audit trail
- Regulatory compliance support

### 3. Improved Reporting
- Better data for financial reporting
- Staff performance tracking
- Customer payment history

### 4. Operational Efficiency
- Streamlined billing processes
- Automated status updates
- Reduced manual intervention

## Future Enhancements

### 1. Integration Opportunities
- Payment gateway integration for online payments
- Automated billing and payment processing
- CRM system integration

### 2. Advanced Features
- Recurring billing support
- Late payment tracking and notifications
- Financial analytics and reporting
- Customer self-service payment portal

## Conclusion

The comprehensive billing system provides robust financial management capabilities for the Cable Management System. It ensures complete tracking of all financial activities, maintains proper audit trails, and provides the necessary tools for efficient billing operations.