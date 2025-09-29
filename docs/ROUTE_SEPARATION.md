# Route Separation Implementation

This document explains how the routes have been separated between staff/admin users and customers in the Cable Management System.

## Overview

The application now has two distinct sets of routes:

1. Staff/Admin routes - Full management capabilities
2. Customer routes - Self-service access to their own data only

## Implementation Details

### 1. Staff/Admin Routes

Staff/admin users continue to use the existing routes under `/api/` prefix:

- `/api/customers/*` - Customer management
- `/api/billing/*` - Billing management
- `/api/plans/*` - Plan management
- `/api/box/*` - Box management
- `/api/users/*` - User management

These routes are protected by staff role-based access control and allow full management capabilities.

### 2. Customer Routes

Customers now have their own dedicated routes under `/api/customer/` prefix:

- `/api/customer/me` - Customer profile management
- `/api/customer/billing/bills` - View own bills
- `/api/customer/billing/payments` - View own payments
- `/api/customer/billing/due-settlements` - View own due settlements

These routes are protected by customer authentication and only allow access to data belonging to the authenticated customer.

## Authentication

### Staff/Admin Authentication

- Uses JWT tokens with role-based access control
- Roles: ADMIN, MANAGER, STAFF, TECHNICIAN
- Protected by `authenticateJWT` and role-specific middleware

### Customer Authentication

- Uses separate JWT tokens for customers
- Protected by `authenticateCustomerJWT` middleware
- Customers can only access their own data

## Key Changes Made

1. Created separate route files for customer-specific endpoints:
   - `src/modules/billing/billing.customer.routes.ts`
   - `src/modules/customers/customers.customer.routes.ts`

2. Modified existing route files to properly enforce access control:
   - `src/modules/billing/billing.routes.ts`
   - `src/modules/customers/customers.routes.ts`

3. Updated server.ts to register both route sets:
   - Staff routes: `/api/*`
   - Customer routes: `/api/customer/*`

4. Enhanced middleware to properly handle both user types:
   - `customerSelfOrStaff` - Allows customers to access their own data or staff to access any data
   - `authenticateCustomerJWT` - Authenticates customers separately from staff

## Usage Examples

### Staff/Admin Access

```bash
# Get all customers (staff only)
GET /api/customers

# Get bills for a specific customer (staff only)
GET /api/billing/bills/customer/:customerId
```

### Customer Self-Service Access

```bash
# Get own profile (customer only)
GET /api/customer/me

# Get own bills (customer only)
GET /api/customer/billing/bills
```

## Security

The implementation ensures that:

1. Customers cannot access data belonging to other customers
2. Customers cannot access staff/admin functionality
3. Staff roles are properly enforced with role-based access control
4. All endpoints are properly authenticated

This separation provides a clean, secure architecture where each user type has access only to the functionality they need.
