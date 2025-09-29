# Complaint System Setup Instructions

This document provides instructions for setting up the complaint management system in the Cable Management System.

## Prerequisites

1. Ensure you have a working PostgreSQL database connection
2. Make sure all the complaint system files have been implemented:
   - `src/modules/complaints/complaints.validation.ts`
   - `src/modules/complaints/complaints.service.ts`
   - `src/modules/complaints/complaints.controller.ts`
   - `src/modules/complaints/complaints.routes.ts`
   - `src/modules/complaints/complaints.customer.routes.ts`
   - `src/database/seeds/complaints.seeder.ts`

## Database Migration Steps

1. **Reset migrations folder** (already done):

   ```bash
   # Remove existing migrations folder
   rm -rf prisma/migrations

   # Create new migrations folder
   mkdir prisma/migrations
   ```

2. **Update migration lock file** (already done):
   The `prisma/migrations/migration_lock.toml` file has been updated to use `provider = "postgresql"`

3. **Generate new migration**:

   ```bash
   npm run db:migrate --name complaint_system_init
   ```

4. **If you encounter connection issues**:
   - Verify your database connection settings in `.env`
   - Ensure the PostgreSQL server is accessible
   - Check firewall settings if connecting to a remote database

## Seeding Sample Data

After the database migration is complete, seed the sample complaints data:

```bash
npm run db:seed complaints
```

## Testing the Implementation

### Staff/Admin API Endpoints

1. Create a complaint:

   ```bash
   POST /api/complaints
   {
     "customerId": "customer-id",
     "title": "TV Signal Issue",
     "description": "Customer is experiencing intermittent signal loss",
     "category": "REPAIR",
     "priority": "MEDIUM"
   }
   ```

2. Get all complaints:

   ```bash
   GET /api/complaints
   ```

3. Get complaints by customer:

   ```bash
   GET /api/complaints/customer/:customerId
   ```

4. Update a complaint:
   ```bash
   PUT /api/complaints/:id
   {
     "status": "IN_PROGRESS",
     "assignedTo": "staff-id"
   }
   ```

### Customer API Endpoints

1. Create a complaint (customer can only create for themselves):

   ```bash
   POST /api/customer/complaints
   {
     "title": "TV Signal Issue",
     "description": "Customer is experiencing intermittent signal loss",
     "category": "REPAIR",
     "priority": "MEDIUM"
   }
   ```

2. Get own complaints:
   ```bash
   GET /api/customer/complaints
   ```

## Supported Complaint Categories

1. **REPAIR** - Issues with existing connections or equipment
2. **NEW_INSTALLATION** - Requests for new cable connections
3. **HOME_VISIT_COLLECTION** - Requests for payment collection at customer's residence
4. **WIRE_CUT** - Reports of damaged or cut cables

## Supported Priority Levels

1. **LOW** - Low priority issues
2. **MEDIUM** - Medium priority issues (default)
3. **HIGH** - High priority issues
4. **URGENT** - Urgent issues requiring immediate attention

## Supported Status Values

1. **OPEN** - Newly created complaints (default)
2. **IN_PROGRESS** - Complaints being worked on
3. **RESOLVED** - Complaints that have been resolved
4. **CLOSED** - Closed complaints

## Troubleshooting

### Database Connection Issues

1. Verify the `DIRECT_URL` in your `.env` file is correct
2. Ensure the PostgreSQL server is running and accessible
3. Check if any firewall is blocking the connection
4. Verify your database credentials

### Migration Errors

1. If you get "type datetime does not exist" errors, ensure you're using PostgreSQL provider
2. Make sure the migration files are generated for the correct database provider
3. Clear the migrations folder and regenerate if needed

### Seeding Issues

1. Ensure customers exist in the database before seeding complaints
2. Check the logs for any specific error messages
3. Verify the database connection is working

## Next Steps

1. Run the database migration
2. Seed the sample data
3. Test the API endpoints
4. Integrate with the frontend applications
