import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance for the application
export const prisma = new PrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
