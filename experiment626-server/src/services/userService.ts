import { prisma } from '../db';

// Create or update a user from Firebase auth data
export async function upsertUser(
  firebaseUid: string,
  displayName: string,
  email?: string,
  authProvider: string = 'anonymous'
) {
  return prisma.user.upsert({
    where: { id: firebaseUid },
    update: {
      displayName,
      email,
      authProvider,
      lastLoginAt: new Date(),
    },
    create: {
      id: firebaseUid,
      displayName,
      email,
      authProvider,
    },
  });
}

// Get user by Firebase UID
export async function getUserById(firebaseUid: string) {
  return prisma.user.findUnique({
    where: { id: firebaseUid },
  });
}

// Create or get existing game association for a user in a galaxy
export async function getOrCreateGameAssociation(
  userId: string,
  galaxyId: string,
  empireId: string
) {
  const existing = await prisma.userGameAssociation.findUnique({
    where: {
      userId_galaxyId: { userId, galaxyId },
    },
  });

  if (existing) {
    // Update last active and mark as currently active
    return prisma.userGameAssociation.update({
      where: { id: existing.id },
      data: {
        isCurrentlyActive: true,
        lastActiveAt: new Date(),
      },
    });
  }

  // Create new association
  return prisma.userGameAssociation.create({
    data: {
      userId,
      galaxyId,
      empireId,
      isCurrentlyActive: true,
    },
  });
}

// Get existing game association (for re-attachment)
export async function getGameAssociation(
  userId: string,
  galaxyId: string
) {
  return prisma.userGameAssociation.findUnique({
    where: {
      userId_galaxyId: { userId, galaxyId },
    },
  });
}

// Mark user as disconnected from a galaxy (but keep association for re-attachment)
export async function markUserDisconnected(
  userId: string,
  galaxyId: string
): Promise<void> {
  await prisma.userGameAssociation.updateMany({
    where: { userId, galaxyId },
    data: {
      isCurrentlyActive: false,
      lastActiveAt: new Date(),
    },
  });
}

// Get all galaxies a user is associated with
export async function getUserGalaxies(userId: string) {
  return prisma.userGameAssociation.findMany({
    where: { userId },
    orderBy: { lastActiveAt: 'desc' },
  });
}
