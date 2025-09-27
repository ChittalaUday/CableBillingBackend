/**
 * Database Connection Test Script
 *
 * This script tests the database connection and helps set up the database.
 * Run with: npm run db:test or tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔌 Testing database connection...');
  console.log(`📡 Database URL: ${process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@')}`);

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 Database version:', result);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableArray = tables as any[];
    console.log(`📋 Found ${tableArray.length} tables in the database`);

    if (tableArray.length === 0) {
      console.log('⚠️  No tables found. You may need to push your schema:');
      console.log('   npm run db:push');
    } else {
      console.log('📝 Tables:', tableArray.map((t: any) => t.table_name).join(', '));
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Connection tips:');
        console.log('   1. Check your DATABASE_URL in .env file');
        console.log('   2. Verify your Supabase project is running');
        console.log('   3. Check your internet connection');
        console.log('   4. Verify your Supabase password and project reference');
      } else if (error.message.includes('password authentication failed')) {
        console.log('\n💡 Authentication tips:');
        console.log('   1. Check your database password in .env file');
        console.log('   2. Reset your database password in Supabase dashboard');
      } else if (error.message.includes('SSL')) {
        console.log('\n💡 SSL tips:');
        console.log('   1. Add sslmode=require to your DATABASE_URL');
        console.log('   2. Example: ?sslmode=require&schema=public');
      }
    }

    console.log('\n🔄 Fallback option: Use SQLite for local development');
    console.log('   Update .env: DATABASE_URL="file:./dev.db"');
    console.log('   Update schema: provider = "sqlite" (and change Decimal to Float)');

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Push schema
    console.log('📤 Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await testConnection();
      break;
    case 'setup':
      await setupDatabase();
      break;
    default:
      console.log('📖 Usage:');
      console.log('   tsx scripts/test-db-connection.ts test   - Test database connection');
      console.log('   tsx scripts/test-db-connection.ts setup  - Set up database');
      console.log('');
      console.log('🔧 Or use npm scripts:');
      console.log('   npm run db:test   - Test connection');
      console.log('   npm run db:setup  - Complete setup');

      // Default to testing connection
      await testConnection();
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
