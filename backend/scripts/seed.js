/**
 * Database Seed Script
 * Seeds the database with initial data
 */

import { v4 as uuidv4 } from 'uuid';
import pool, { query } from '../src/config/database.js';
import logger from '../src/utils/logger.js';
import { hashPassword } from '../src/utils/password.js';

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const adminResult = await query(
      `INSERT INTO users (email, password, name, "displayName", role, "isActive")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET 
         password = EXCLUDED.password,
         name = EXCLUDED.name,
         "displayName" = EXCLUDED."displayName",
         role = EXCLUDED.role
       RETURNING *`,
      ['admin@tasktracker.com', adminPassword, 'Admin User', 'Admin', 'ADMIN', true]
    );
    
    const admin = adminResult.rows[0];
    logger.info('✓ Admin user created/updated');
    
    // Create regular user
    const userPassword = await hashPassword('user123');
    const userResult = await query(
      `INSERT INTO users (email, password, name, "displayName", role, department, "isActive")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET 
         password = EXCLUDED.password,
         name = EXCLUDED.name,
         "displayName" = EXCLUDED."displayName"
       RETURNING *`,
      ['user@tasktracker.com', userPassword, 'Test User', 'Test User', 'USER', 'design', true]
    );
    
    const user = userResult.rows[0];
    logger.info('✓ Regular user created/updated');
    
    // Create reporters
    const reporters = [
      {
        name: 'John Marketing',
        email: 'john.marketing@company.com',
        phoneNumber: '+1234567890',
        department: 'Marketing',
        company: 'Example Corp',
        position: 'Marketing Manager',
      },
      {
        name: 'Sarah Sales',
        email: 'sarah.sales@company.com',
        phoneNumber: '+1234567891',
        department: 'Sales',
        company: 'Example Corp',
        position: 'Sales Director',
      },
    ];
    
    for (const reporter of reporters) {
      await query(
        `INSERT INTO reporters (name, email, "phoneNumber", department, company, position, "createdById", "createdByName")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO NOTHING`,
        [reporter.name, reporter.email, reporter.phoneNumber, reporter.department, 
         reporter.company, reporter.position, admin.id, admin.name]
      );
    }
    
    logger.info('✓ Reporters created');
    
    // Create deliverables
    const deliverables = [
      {
        name: 'Banner Ad',
        department: 'design',
        timePerUnit: 1.5,
        timeUnit: 'hr',
        variationsTime: 0.5,
        requiresQuantity: true,
      },
      {
        name: 'Social Media Post',
        department: 'design',
        timePerUnit: 0.5,
        timeUnit: 'hr',
        variationsTime: 0.25,
        requiresQuantity: true,
      },
      {
        name: 'Video Edit',
        department: 'video',
        timePerUnit: 3.0,
        timeUnit: 'hr',
        variationsTime: 1.0,
        requiresQuantity: false,
      },
      {
        name: 'Animation',
        department: 'video',
        timePerUnit: 4.0,
        timeUnit: 'hr',
        variationsTime: 1.5,
        requiresQuantity: true,
      },
      {
        name: 'Landing Page',
        department: 'developer',
        timePerUnit: 8.0,
        timeUnit: 'hr',
        variationsTime: 0,
        requiresQuantity: false,
      },
      {
        name: 'Email Template',
        department: 'design',
        timePerUnit: 2.0,
        timeUnit: 'hr',
        variationsTime: 0.5,
        requiresQuantity: true,
      },
    ];
    
    for (const deliverable of deliverables) {
      await query(
        `INSERT INTO deliverables (name, department, "timePerUnit", "timeUnit", "variationsTime", "requiresQuantity", "createdById", "createdByName")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO NOTHING`,
        [deliverable.name, deliverable.department, deliverable.timePerUnit, deliverable.timeUnit,
         deliverable.variationsTime, deliverable.requiresQuantity, admin.id, admin.name]
      );
    }
    
    logger.info('✓ Deliverables created');
    
    // Create a sample board
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const monthId = `${year}-${month}`;
    const boardId = uuidv4();
    
    await query(
      `INSERT INTO boards ("boardId", "monthId", year, month, department, title, "createdBy", "createdByName")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("monthId") DO NOTHING`,
      [boardId, monthId, year, month, 'design', `${month}/${year} Board`, admin.id, admin.name]
    );
    
    logger.info('✓ Sample board created');
    
    logger.info('');
    logger.info('========================================');
    logger.info('✅ Database seeded successfully!');
    logger.info('========================================');
    logger.info('');
    logger.info('Login credentials:');
    logger.info('  Admin:');
    logger.info('    Email: admin@tasktracker.com');
    logger.info('    Password: admin123');
    logger.info('  User:');
    logger.info('    Email: user@tasktracker.com');
    logger.info('    Password: user123');
    logger.info('========================================');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    await pool.end();
    process.exit(1);
  }
}

seed();
