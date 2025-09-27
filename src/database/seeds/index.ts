import { PrismaClient } from '@prisma/client';
import { seedUsers, clearUsers } from './users.seeder';
import { seedCustomers, clearCustomers } from './customers.seeder';
import { seedPlans } from './plans.seeder';

const prisma = new PrismaClient();

async function clearPlans() {
  console.log('Clearing plans...');
  try {
    await prisma.plan.deleteMany();
    console.log('Plans cleared successfully');
  } catch (error) {
    console.error('Error clearing plans:', error);
  }
}

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - comment out if you want to preserve existing data)
    // await clearUsers();
    // await clearCustomers();

    // Seed users first
    // await seedUsers();

    // // Seed customers
    // await seedCustomers();

    // Seed plans
    await seedPlans();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// CLI argument handling
async function runSeeder(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'users':
      console.log('🌱 Seeding users only...');
      await seedUsers();
      break;
    case 'customers':
      console.log('🌱 Seeding customers only...');
      await seedCustomers();
      break;
    case 'plans':
      console.log('🌱 Seeding plans only...');
      await seedPlans();
      break;
    case 'clear':
      console.log('🗑️ Clearing all data...');
      await clearCustomers();
      await clearUsers();
      await clearPlans();
      break;
    case 'reset':
      console.log('🔄 Resetting database (clear + seed)...');
      await clearCustomers();
      await clearUsers();
      await clearPlans();
      await seedUsers();
      await seedCustomers();
      await seedPlans();
      break;
    default:
      console.log('🌱 Running full seed...');
      await main();
      break;
  }
}

runSeeder()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  });
