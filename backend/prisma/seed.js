/**
 * Database Seed File
 * Seeds initial data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tasktracker.com' },
    update: {},
    create: {
      email: 'admin@tasktracker.com',
      password: adminPassword,
      name: 'Admin User',
      displayName: 'Admin',
      role: 'ADMIN',
      permissions: ['all'],
      department: 'management',
      isActive: true,
      isVerified: true,
    },
  });
  
  console.log('✅ Admin user created:', admin.email);
  
  // Create test user
  const userPassword = await bcrypt.hash('User@123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@tasktracker.com' },
    update: {},
    create: {
      email: 'user@tasktracker.com',
      password: userPassword,
      name: 'Test User',
      displayName: 'Test User',
      role: 'USER',
      department: 'design',
      isActive: true,
      isVerified: true,
    },
  });
  
  console.log('✅ Test user created:', user.email);
  
  // Create sample reporters
  const reporters = await Promise.all([
    prisma.reporter.upsert({
      where: { email: 'reporter1@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'reporter1@example.com',
        department: 'marketing',
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
    prisma.reporter.upsert({
      where: { email: 'reporter2@example.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'reporter2@example.com',
        department: 'product',
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
  ]);
  
  console.log(`✅ ${reporters.length} reporters created`);
  
  // Create sample deliverables
  const deliverables = await Promise.all([
    prisma.deliverable.upsert({
      where: { name: 'Banner Design' },
      update: {},
      create: {
        name: 'Banner Design',
        description: 'Website and app banner designs',
        category: 'Design',
        estimatedTime: 2.5,
        complexity: 5,
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
    prisma.deliverable.upsert({
      where: { name: 'Social Media Post' },
      update: {},
      create: {
        name: 'Social Media Post',
        description: 'Social media content creation',
        category: 'Marketing',
        estimatedTime: 1.5,
        complexity: 3,
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
    prisma.deliverable.upsert({
      where: { name: 'Email Template' },
      update: {},
      create: {
        name: 'Email Template',
        description: 'HTML email template design',
        category: 'Design',
        estimatedTime: 3.0,
        complexity: 6,
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
    prisma.deliverable.upsert({
      where: { name: 'Landing Page' },
      update: {},
      create: {
        name: 'Landing Page',
        description: 'Full landing page design',
        category: 'Design',
        estimatedTime: 8.0,
        complexity: 8,
        isActive: true,
        createdById: admin.id,
        createdByName: admin.name,
      },
    }),
  ]);
  
  console.log(`✅ ${deliverables.length} deliverables created`);
  
  // Create sample board for current month
  const now = new Date();
  const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const board = await prisma.board.upsert({
    where: { monthId },
    update: {},
    create: {
      boardId: '20000000-0000-0000-0000-000000000001',
      monthId,
      year: now.getFullYear().toString(),
      month: monthNames[now.getMonth()],
      department: 'design',
      title: `${monthNames[now.getMonth()]} ${now.getFullYear()} Board`,
      isActive: true,
      isClosed: false,
      createdBy: admin.id,
      createdByName: admin.name,
    },
  });
  
  console.log(`✅ Board created for ${monthId}`);
  
  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@tasktracker.com / Admin@123456');
  console.log('   User:  user@tasktracker.com / User@123456\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
