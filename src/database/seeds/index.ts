import { PrismaClient } from '@prisma/client';
import { seedUsers, clearUsers } from './users.seeder';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - comment out if you want to preserve existing data)
    // await clearUsers();

    // Seed users
    await seedUsers();

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
    case 'clear':
      console.log('🗑️ Clearing all data...');
      await clearUsers();
      break;
    case 'reset':
      console.log('🔄 Resetting database (clear + seed)...');
      await clearUsers();
      await seedUsers();
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
