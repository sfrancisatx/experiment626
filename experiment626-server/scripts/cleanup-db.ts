#!/usr/bin/env ts-node

/**
 * Database Cleanup Utility
 * 
 * This script provides various cleanup operations for the Experiment626 database:
 * - Remove all game associations
 * - Remove stale/inactive game associations
 * - Remove all users and associations (full reset)
 * - Remove specific user's data
 * 
 * Usage:
 *   npm run cleanup:all              # Remove all game associations
 *   npm run cleanup:stale            # Remove inactive associations older than 7 days
 *   npm run cleanup:reset            # Full database reset (users + associations)
 *   npm run cleanup:user <userId>    # Remove specific user's data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CleanupStats {
  usersDeleted: number;
  associationsDeleted: number;
}

/**
 * Remove all game associations but keep users
 */
async function cleanupAllAssociations(): Promise<CleanupStats> {
  console.log('🧹 Removing all game associations...');
  
  const result = await prisma.userGameAssociation.deleteMany({});
  
  console.log(`✅ Deleted ${result.count} game associations`);
  return {
    usersDeleted: 0,
    associationsDeleted: result.count
  };
}

/**
 * Remove stale/inactive game associations
 * Default: associations that haven't been active in the last 7 days
 */
async function cleanupStaleAssociations(daysInactive: number = 7): Promise<CleanupStats> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
  
  console.log(`🧹 Removing associations inactive since ${cutoffDate.toISOString()}...`);
  
  const result = await prisma.userGameAssociation.deleteMany({
    where: {
      lastActiveAt: {
        lt: cutoffDate
      }
    }
  });
  
  console.log(`✅ Deleted ${result.count} stale game associations`);
  return {
    usersDeleted: 0,
    associationsDeleted: result.count
  };
}

/**
 * Full database reset - removes all users and their associations
 * WARNING: This is destructive and cannot be undone
 */
async function fullReset(): Promise<CleanupStats> {
  console.log('⚠️  FULL DATABASE RESET - This will delete ALL users and associations!');
  console.log('Waiting 3 seconds... Press Ctrl+C to cancel');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🧹 Deleting all data...');
  
  // Delete associations first (due to foreign key constraint)
  const associations = await prisma.userGameAssociation.deleteMany({});
  console.log(`   Deleted ${associations.count} game associations`);
  
  // Delete users
  const users = await prisma.user.deleteMany({});
  console.log(`   Deleted ${users.count} users`);
  
  console.log('✅ Full reset complete');
  return {
    usersDeleted: users.count,
    associationsDeleted: associations.count
  };
}

/**
 * Remove a specific user and their associations
 */
async function cleanupUser(userId: string): Promise<CleanupStats> {
  console.log(`🧹 Removing user ${userId} and their associations...`);
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameAssociations: true }
  });
  
  if (!user) {
    console.log(`❌ User ${userId} not found`);
    return { usersDeleted: 0, associationsDeleted: 0 };
  }
  
  const associationCount = user.gameAssociations.length;
  
  // Delete user (associations will cascade delete)
  await prisma.user.delete({
    where: { id: userId }
  });
  
  console.log(`✅ Deleted user ${user.displayName} (${user.email || 'anonymous'})`);
  console.log(`   Deleted ${associationCount} associated game records`);
  
  return {
    usersDeleted: 1,
    associationsDeleted: associationCount
  };
}

/**
 * List all users and their game counts (for inspection)
 */
async function listUsers(): Promise<void> {
  console.log('📋 Current users in database:\n');
  
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { gameAssociations: true }
      }
    },
    orderBy: { lastLoginAt: 'desc' }
  });
  
  if (users.length === 0) {
    console.log('   No users found');
    return;
  }
  
  console.log('ID                                    | Display Name        | Email                    | Games | Last Login');
  console.log('─'.repeat(120));
  
  for (const user of users) {
    const id = user.id.padEnd(38);
    const name = (user.displayName || '').padEnd(20).substring(0, 20);
    const email = (user.email || 'anonymous').padEnd(25).substring(0, 25);
    const games = user._count.gameAssociations.toString().padStart(5);
    const lastLogin = user.lastLoginAt.toISOString().split('T')[0];
    
    console.log(`${id} | ${name} | ${email} | ${games} | ${lastLogin}`);
  }
  
  console.log(`\nTotal: ${users.length} users`);
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'all':
        await cleanupAllAssociations();
        break;
      
      case 'stale':
        const days = arg ? parseInt(arg, 10) : 7;
        await cleanupStaleAssociations(days);
        break;
      
      case 'reset':
        await fullReset();
        break;
      
      case 'user':
        if (!arg) {
          console.error('❌ Error: User ID required');
          console.log('Usage: npm run cleanup:user <userId>');
          process.exit(1);
        }
        await cleanupUser(arg);
        break;
      
      case 'list':
        await listUsers();
        break;
      
      default:
        console.log('Database Cleanup Utility\n');
        console.log('Available commands:');
        console.log('  npm run cleanup:all              - Remove all game associations');
        console.log('  npm run cleanup:stale [days]     - Remove inactive associations (default: 7 days)');
        console.log('  npm run cleanup:reset            - Full database reset (WARNING: destructive)');
        console.log('  npm run cleanup:user <userId>    - Remove specific user and their data');
        console.log('  npm run cleanup:list             - List all users and their game counts');
        console.log('\nExamples:');
        console.log('  npm run cleanup:all');
        console.log('  npm run cleanup:stale 14');
        console.log('  npm run cleanup:user abc123xyz');
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
