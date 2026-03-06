import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production on GCP, this will use Application Default Credentials automatically
// For local development, set GOOGLE_APPLICATION_CREDENTIALS env var to point to service account key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'experiment626-sandbox',
  });
}

export const firebaseAdmin = admin;
export const auth = admin.auth();

// Verify a Firebase ID token and return the decoded token
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}

// Extract user ID from a verified token
export function getUserIdFromToken(decodedToken: admin.auth.DecodedIdToken): string {
  return decodedToken.uid;
}
