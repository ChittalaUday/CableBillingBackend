# Complaint Management System

This document explains the implementation of the complaint management system in the Cable Management System.

## Overview

The complaint system allows customers to submit complaints and staff members to manage and resolve them. The system supports four specific categories of complaints:

1. **REPAIR** - Issues with existing connections or equipment
2. **NEW_INSTALLATION** - Requests for new cable connections
3. **HOME_VISIT_COLLECTION** - Requests for payment collection at customer's residence
4. **WIRE_CUT** - Reports of damaged or cut cables

## Features

### For Customers

- Submit complaints through their app
- View their own complaints
- Track complaint status

### For Staff/Admin

- View all complaints
- Assign complaints to specific staff members
- Update complaint status and priority
- Resolve complaints with resolution notes
- Generate complaint statistics

## Implementation Details

### Data Model

The system uses the existing `Complaint` model in the Prisma schema with the following fields:

- `id` - Unique identifier
- `complaintNumber` - Unique complaint number (auto-generated)
- `customerId` - Reference to the customer who submitted the complaint
- `title` - Brief title of the complaint
- `description` - Detailed description of the issue
- `category` - One of: REPAIR, NEW_INSTALLATION, HOME_VISIT_COLLECTION, WIRE_CUT
- `priority` - One of: LOW, MEDIUM, HIGH, URGENT
- `status` - One of: OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `assignedTo` - Reference to the staff member assigned to handle the complaint
- `resolvedAt` - Timestamp when the complaint was resolved
- `resolution` - Notes about how the complaint was resolved
- `createdAt` - Timestamp when the complaint was created
- `updatedAt` - Timestamp when the complaint was last updated

### API Endpoints

#### Staff/Admin Routes (`/api/complaints`)

- `POST /` - Create a new complaint
- `GET /` - Get all complaints with filtering and pagination
- `GET /stats` - Get complaint statistics
- `GET /customer/:customerId` - Get all complaints for a specific customer
- `GET /:id` - Get a specific complaint
- `PUT /:id` - Update a complaint
- `PUT /:id/assign` - Assign a complaint to a staff member
- `DELETE /:id` - Delete a complaint (Admin only)

#### Customer Routes (`/api/customer/complaints`)

- `POST /` - Create a new complaint (customer can only create for themselves)
- `GET /` - Get all complaints for the authenticated customer
- `GET /:id` - Get a specific complaint (only if it belongs to the customer)

### Authentication and Authorization

- Staff routes require authentication with JWT and appropriate roles
- Customer routes require customer authentication
- Customers can only access their own complaints
- Staff members can access all complaints

### Seeding

The system includes a seeder that creates sample complaints for testing purposes. The seeder can be run with:

```bash
npm run db:seed complaints
```

## Usage Examples

### Creating a Complaint (Customer)

```bash
POST /api/customer/complaints
{
  "title": "TV Signal Issue",
  "description": "Experiencing intermittent signal loss on multiple channels",
  "category": "REPAIR",
  "priority": "MEDIUM"
}
```

### Creating a Complaint (Staff)

```bash
POST /api/complaints
{
  "customerId": "customer-id",
  "title": "New Connection Request",
  "description": "Customer wants to set up a new cable connection",
  "category": "NEW_INSTALLATION",
  "priority": "HIGH"
}
```

### Assigning a Complaint to Staff

```bash
PUT /api/complaints/:id/assign
{
  "assignedTo": "staff-user-id"
}
```

### Updating Complaint Status

```bash
PUT /api/complaints/:id
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

## Categories Explained

1. **REPAIR** - For technical issues with existing connections, equipment malfunctions, signal problems, etc.
2. **NEW_INSTALLATION** - For customers requesting new cable connections at their residence or business.
3. **HOME_VISIT_COLLECTION** - For customers who prefer to have their payments collected at their residence.
4. **WIRE_CUT** - For reports of damaged, cut, or vandalized cables that require immediate attention.

Each category can be assigned different priority levels and handled by appropriate staff members based on their expertise.
