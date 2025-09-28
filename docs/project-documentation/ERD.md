# Enhanced Cable Billing System ERD

## Key Entities and Relationships

```mermaid
erDiagram
    USER ||--o{ CUSTOMER : "creates"
    USER ||--o{ BILL : "generates"
    USER ||--o{ PAYMENT : "collects"
    USER ||--o{ DUE_SETTLEMENT : "settles"
    USER ||--o{ BOX_ACTIVATION : "performs"
    USER ||--o{ TRANSACTION : "performs"
    
    CUSTOMER ||--o{ BILL : "has"
    CUSTOMER ||--o{ PAYMENT : "makes"
    CUSTOMER ||--o{ DUE_SETTLEMENT : "has"
    CUSTOMER ||--o{ TRANSACTION : "involved_in"
    CUSTOMER ||--o{ BOX_ACTIVATION : "has"
    CUSTOMER ||--o{ COMPLAINT : "files"
    CUSTOMER ||--o{ CUSTOMER_SUBSCRIPTION : "subscribes_to"
    
    BILL ||--o{ PAYMENT : "receives"
    BILL ||--o{ DUE_SETTLEMENT : "settles"
    BILL ||--o{ TRANSACTION : "generates"
    
    PAYMENT ||--|| TRANSACTION : "linked_to"
    DUE_SETTLEMENT ||--|| TRANSACTION : "generates"
    BOX_ACTIVATION ||--|| TRANSACTION : "generates"
    
    PLAN ||--o{ CUSTOMER_SUBSCRIPTION : "offers"
    
    USER {
        string id
        string email
        string username
        string firstName
        string lastName
        string role
        boolean isActive
    }
    
    CUSTOMER {
        string id
        string accountNo
        string customerNumber
        string firstName
        string lastName
        string email
        string phone
        string address
        string status
        string boxStatus
        datetime boxActivatedAt
        datetime lastBoxStatusChangedAt
    }
    
    BILL {
        string id
        string billNumber
        float amount
        datetime billDate
        datetime dueDate
        string status
        string generatedBy
        boolean isPhysicalBillGenerated
    }
    
    PAYMENT {
        string id
        string paymentNumber
        float amount
        string paymentMethod
        string paymentSource
        string collectedBy
        boolean isReceiptGenerated
    }
    
    DUE_SETTLEMENT {
        string id
        float originalAmount
        float settledAmount
        float remainingAmount
        datetime settlementDate
        string settledBy
    }
    
    TRANSACTION {
        string id
        string transactionNumber
        string type
        float amount
        string performedBy
        string relatedBillId
        string relatedPaymentId
        string relatedDueSettlementId
        string relatedActionId
    }
    
    BOX_ACTIVATION {
        string id
        string actionType
        datetime actionDate
        string performedBy
        string reason
    }
    
    PLAN {
        string id
        string name
        string type
        float price
        int months
        boolean isPriority
    }
    
    CUSTOMER_SUBSCRIPTION {
        string id
        string status
        datetime startDate
        datetime endDate
        float monthlyRate
        boolean isAutoRenew
    }
```

## Summary of Key Changes

1. **Enhanced Financial Tracking**:
   - Bills now track which staff member generated them (`generatedBy`)
   - Payments track collection source and staff member who collected them (`paymentSource`, `collectedBy`)
   - Due settlements track which staff member processed them (`settledBy`)
   - All financial operations automatically create Transaction records

2. **Box Activation Tracking**:
   - Customers now have box status fields (`boxStatus`, `boxActivatedAt`, `lastBoxStatusChangedAt`)
   - New BoxActivation model tracks all service actions (ACTIVATED, SUSPENDED, DEACTIVATED, REACTIVATED)
   - Every box action creates a corresponding Transaction record

3. **Centralized Transaction Logging**:
   - All financial and service actions create Transaction records
   - Transactions can be linked to Bills, Payments, DueSettlements, and BoxActivations
   - All transactions track which staff member performed them (`performedBy`)