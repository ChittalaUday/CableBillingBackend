# Supabase PostgreSQL Setup Guide

This project uses Supabase PostgreSQL as the primary database. Follow these steps to configure your database connection.

## 1. Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `cable-management-system`
   - Database Password: Create a strong password
   - Region: Choose closest to your location
6. Click "Create new project"

## 2. Get Your Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## 3. Configure Environment Variables

1. Open your `.env` file
2. Replace the `DATABASE_URL` with your Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require&schema=public"
   ```

**Important Notes:**

- Replace `[YOUR-PASSWORD]` with the database password you created
- Replace `[PROJECT-REF]` with your project reference ID
- Keep `?sslmode=require&schema=public` at the end for SSL connection and schema specification

## 4. Initialize the Database

Run the following commands to set up your database:

```bash
# Generate Prisma client
npm run db:generate

# Push the schema to Supabase
npm run db:push

# Optional: Seed the database with initial data
npm run db:seed
```

## 5. Verify Connection

Start your development server to verify the connection:

```bash
npm run dev
```

If everything is configured correctly, you should see a successful database connection in the logs.

## Fallback Development Setup

If Supabase is temporarily unavailable during development, you can use SQLite as a fallback:

1. Update your `.env` file:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. Update your `prisma/schema.prisma` datasource:

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Note: You'll need to change `Decimal` types to `Float` in the schema for SQLite compatibility.

## Supabase Features Integration

This project can also leverage other Supabase features:

- **Authentication**: Supabase Auth for user management
- **Real-time**: Real-time subscriptions for live updates
- **Storage**: File storage for customer documents
- **Edge Functions**: Serverless functions for complex operations

## Security Considerations

- Never commit your actual database password to version control
- Use environment variables for all sensitive configuration
- Enable Row Level Security (RLS) in Supabase for additional protection
- Regularly rotate your database passwords
- Monitor database usage and performance in the Supabase dashboard

## Troubleshooting

### Connection Issues

- Verify your password and project reference ID
- Check if SSL is required (use `sslmode=require`)
- Ensure your IP is not blocked by Supabase

### Schema Issues

- Run `npm run db:push` to sync schema changes
- Use `npm run db:migrate` for production deployments

### Performance

- Monitor query performance in Supabase dashboard
- Use database indexes for frequently queried fields
- Consider connection pooling for high-traffic applications
