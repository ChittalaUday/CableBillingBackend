import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedUsers(): Promise<void> {
  console.log('👤 Seeding users...');

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cable.com' },
    update: {},
    create: {
      email: 'admin@cable.com',
      username: 'admin',
      password: hashedAdminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  });

  // Create manager user
  const hashedManagerPassword = await bcrypt.hash('manager123', 12);

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@cable.com' },
    update: {},
    create: {
      email: 'manager@cable.com',
      username: 'manager',
      password: hashedManagerPassword,
      firstName: 'Cable',
      lastName: 'Manager',
      phone: '+1234567891',
      role: 'MANAGER',
      isActive: true,
      isVerified: true,
    },
  });

  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 12);

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@cable.com' },
    update: {},
    create: {
      email: 'staff@cable.com',
      username: 'staff',
      password: staffPassword,
      firstName: 'Cable',
      lastName: 'Staff',
      phone: '+1234567892',
      role: 'STAFF',
      isActive: true,
      isVerified: true,
    },
  });

  // Create technician user
  const technicianPassword = await bcrypt.hash('tech123', 12);

  const technicianUser = await prisma.user.upsert({
    where: { email: 'technician@cable.com' },
    update: {},
    create: {
      email: 'technician@cable.com',
      username: 'technician',
      password: technicianPassword,
      firstName: 'Field',
      lastName: 'Technician',
      phone: '+1234567893',
      role: 'TECHNICIAN',
      isActive: true,
      isVerified: true,
    },
  });

  // Create additional staff members
  const additionalStaff = [
    {
      email: 'sarah.johnson@cable.com',
      username: 'sarah.johnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567894',
      role: 'STAFF' as const,
    },
    {
      email: 'mike.williams@cable.com',
      username: 'mike.williams',
      firstName: 'Mike',
      lastName: 'Williams',
      phone: '+1234567895',
      role: 'TECHNICIAN' as const,
    },
    {
      email: 'emily.brown@cable.com',
      username: 'emily.brown',
      firstName: 'Emily',
      lastName: 'Brown',
      phone: '+1234567896',
      role: 'MANAGER' as const,
    },
  ];

  const defaultPassword = await bcrypt.hash('cable123', 12);

  for (const userData of additionalStaff) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: defaultPassword,
        isActive: true,
        isVerified: true,
      },
    });
  }

  console.log('✅ User seeding completed!');
  console.log('👤 Created users:');
  console.log('   - Admin: admin@cable.com (password: admin123)');
  console.log('   - Manager: manager@cable.com (password: manager123)');
  console.log('   - Staff: staff@cable.com (password: staff123)');
  console.log('   - Technician: technician@cable.com (password: tech123)');
  console.log(
    '   - Additional staff: sarah.johnson@cable.com, mike.williams@cable.com, emily.brown@cable.com (password: cable123)'
  );
}

export async function clearUsers(): Promise<void> {
  console.log('🗑️ Clearing existing users...');

  // Delete in order due to foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.complaint.updateMany({
    where: { assignedTo: { not: null } },
    data: { assignedTo: null },
  });
  await prisma.dueSettlement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Users cleared successfully!');
}
