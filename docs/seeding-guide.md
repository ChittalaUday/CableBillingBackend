# Database Seeding Guide

This guide explains how to use the database seeding system for the Cable Management System.

## Overview

The seeding system is organized with modular seeders that can be run individually or together. The main entry point is `src/database/seeds/index.ts` which orchestrates different seeding operations.

## Available Seeding Commands

### Basic Commands

```bash
# Run full seeding (currently only users)
npm run db:seed

# Seed only users
npm run db:seed:users

# Clear all existing data
npm run db:seed:clear

# Reset database (clear + seed)
npm run db:seed:reset
```

### Individual Seeder Files

- **`users.seeder.ts`** - Contains user seeding logic with different roles and sample accounts

## User Seeder Details

The user seeder creates the following accounts:

### Default System Users

| Role       | Email                | Username   | Password   |
| ---------- | -------------------- | ---------- | ---------- |
| Admin      | admin@cable.com      | admin      | admin123   |
| Manager    | manager@cable.com    | manager    | manager123 |
| Staff      | staff@cable.com      | staff      | staff123   |
| Technician | technician@cable.com | technician | tech123    |

### Additional Staff Members

| Role       | Email                   | Username      | Password |
| ---------- | ----------------------- | ------------- | -------- |
| Staff      | sarah.johnson@cable.com | sarah.johnson | cable123 |
| Technician | mike.williams@cable.com | mike.williams | cable123 |
| Manager    | emily.brown@cable.com   | emily.brown   | cable123 |

## Seeder Functions

### User Seeder (`users.seeder.ts`)

- **`seedUsers()`** - Creates all user accounts
- **`clearUsers()`** - Removes all users and related data (handles foreign key constraints)

## Usage Examples

### 1. Initial Setup

```bash
# After database schema is set up
npm run db:seed:users
```

### 2. Development Reset

```bash
# Clear everything and start fresh
npm run db:seed:reset
```

### 3. Add Only Users (preserving existing data)

```bash
# Just add users without affecting other data
npm run db:seed:users
```

### 4. Clear All Data

```bash
# Remove all seeded data
npm run db:seed:clear
```

## Adding New Seeders

To add a new seeder (e.g., for customers):

1. **Create the seeder file**: `src/database/seeds/customers.seeder.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCustomers(): Promise<void> {
  console.log('🏠 Seeding customers...');
  // Your customer seeding logic here
}

export async function clearCustomers(): Promise<void> {
  console.log('🗑️ Clearing customers...');
  // Your customer clearing logic here
}
```

2. **Update the index file**: `src/database/seeds/index.ts`

```typescript
import { seedCustomers } from './customers.seeder';

// Add to main() function
await seedCustomers();

// Add to CLI handling
case 'customers':
  await seedCustomers();
  break;
```

3. **Add npm script**: Update `package.json`

```json
"db:seed:customers": "tsx src/database/seeds/index.ts customers"
```

## Environment Considerations

### Development

- Uses `upsert` operations to avoid duplicates
- Safe to run multiple times
- Passwords are bcrypt hashed with salt rounds from config

### Production

- **Never run seeders in production** without careful consideration
- Use environment checks before running destructive operations
- Consider using migrations for production data changes

## Database Connection

The seeders use the same Prisma client configuration as the main application:

- Connects to Supabase PostgreSQL in production/development
- Falls back to SQLite if configured
- Properly handles connection cleanup

## Troubleshooting

### Common Issues

1. **Foreign Key Constraints**
   - The `clearUsers()` function handles this by deleting in the correct order
   - Always clear related data before clearing parent records

2. **Unique Constraint Violations**
   - Uses `upsert` operations to handle existing records
   - Email and username fields are unique

3. **Connection Issues**
   - Ensure database is accessible
   - Check environment variables
   - Run `npm run db:test` to verify connection

### Error Messages

- **"Unique constraint failed"** - Record already exists, seeder will update instead
- **"Foreign key constraint"** - Related data exists, use clear functions in correct order
- **"Connection refused"** - Database not accessible, check connection string

## Security Notes

- Default passwords are for development only
- Change all default passwords in production
- Consider using environment variables for sensitive data
- Passwords are properly hashed using bcrypt

## Future Enhancements

Planned seeders:

- Customer seeder with sample cable customers
- Bill seeder with historical billing data
- Payment seeder with payment history
- Complaint seeder with sample support tickets
- Report seeder with sample reports
