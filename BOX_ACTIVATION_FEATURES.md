# Box Activation Features

This document describes the new box activation features added to the Cable Management System.

## Overview

The enhanced system now includes comprehensive tracking of set-top box activations, suspensions, deactivations, and reactivations. Every box action is logged with full audit trail capabilities and automatically generates corresponding transaction records.

## New Features

### 1. Box Status Tracking

Customers now have additional fields to track their box status:
- `boxStatus`: Current status of the box (ACTIVE, INACTIVE, SUSPENDED)
- `boxActivatedAt`: Timestamp when the box was first activated
- `lastBoxStatusChangedAt`: Timestamp of the last status change

### 2. Box Activation Model

A new `BoxActivation` model tracks all service actions:
- `actionType`: Type of action (ACTIVATED, SUSPENDED, DEACTIVATED, REACTIVATED)
- `actionDate`: When the action occurred
- `performedBy`: Staff member who performed the action
- `reason`: Reason for the action
- `notes`: Additional notes

### 3. Enhanced Transaction Logging

All box actions automatically generate transaction records:
- `type`: BOX_ACTIVATED, BOX_SUSPENDED, BOX_DEACTIVATED, BOX_REACTIVATED
- `relatedActionId`: Links to the BoxActivation record
- `performedBy`: Staff member who performed the action

## API Endpoints

### Create Box Activation
```
POST /api/box
```
**Request Body:**
```json
{
  "customerId": "string",
  "actionType": "ACTIVATED|SUSPENDED|DEACTIVATED|REACTIVATED",
  "reason": "string (optional)",
  "notes": "string (optional)"
}
```

### Get Box Activations for Customer
```
GET /api/box/customer/:customerId
```

### Get Box Activation by ID
```
GET /api/box/:id
```

## Database Changes

### New Table: box_activations
- id (String, Primary Key)
- customerId (String, Foreign Key to customers)
- actionType (String)
- actionDate (DateTime)
- performedBy (String, Foreign Key to users, optional)
- reason (String, optional)
- notes (String, optional)
- createdAt (DateTime)
- updatedAt (DateTime)

### Updated Table: customers
- boxStatus (String, default: "INACTIVE")
- boxActivatedAt (DateTime, optional)
- lastBoxStatusChangedAt (DateTime, optional)

### Updated Table: transactions
- relatedActionId (String, Foreign Key to box_activations, optional, unique)

## Implementation Details

1. **Data Consistency**: All box activation operations are performed within database transactions to ensure data consistency.

2. **Automatic Customer Updates**: When a box activation is created, the customer's box status fields are automatically updated.

3. **Transaction Generation**: Every box activation automatically generates a corresponding transaction record for audit purposes.

4. **Authorization**: 
   - Creating box activations requires STAFF or higher permissions
   - Viewing box activations can be done by staff or the customer themselves
   - Viewing specific box activations by ID requires STAFF or higher permissions

## Example Usage Flow

1. **New Customer Activation**:
   - Staff creates a new customer
   - Staff creates a box activation with actionType "ACTIVATED"
   - System updates customer's boxStatus to "ACTIVE"
   - System sets customer's boxActivatedAt timestamp
   - System creates a transaction record of type "BOX_ACTIVATED"

2. **Customer Suspension**:
   - Staff creates a box activation with actionType "SUSPENDED"
   - System updates customer's boxStatus to "SUSPENDED"
   - System creates a transaction record of type "BOX_SUSPENDED"

3. **Customer Reactivation**:
   - Staff creates a box activation with actionType "REACTIVATED"
   - System updates customer's boxStatus to "ACTIVE"
   - System creates a transaction record of type "BOX_REACTIVATED"

## Security Considerations

1. All endpoints are protected by JWT authentication
2. Role-based access control ensures only authorized personnel can perform actions
3. Customer data is only accessible to the customer themselves or staff members
4. All actions are logged with timestamps and responsible user IDs

## Future Enhancements

1. Integration with automated box activation systems
2. Email/SMS notifications for box status changes
3. Reporting on box activation statistics
4. Integration with billing system for activation fees