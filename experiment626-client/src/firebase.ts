import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithCredential,
  EmailAuthProvider,
  type User 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAXX8FGUtZhYo8EqbmpmbfJl90wX2K4rJE",
  authDomain: "experiment626-sandbox.firebaseapp.com",
  projectId: "experiment626-sandbox",
  storageBucket: "experiment626-sandbox.firebasestorage.app",
  messagingSenderId: "563878052536",
  appId: "1:563878052536:web:647b984288b9f1f5106a4d",
  measurementId: "G-NG7X47NLD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Auth state management
let currentUser: User | null = null;
let authResolve: ((user: User | null) => void) | null = null;
const authReady = new Promise<User | null>((resolve) => {
  authResolve = resolve;
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (authResolve) {
    authResolve(user);
    authResolve = null;
  }
});

// Get current user (waits for auth to initialize)
export async function getCurrentUser(): Promise<User | null> {
  await authReady;
  return currentUser;
}

// Get Firebase ID token for server requests
export async function getIdToken(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}

// Sign in anonymously (called on first visit)
export async function ensureAuthenticated(): Promise<User> {
  let user = await getCurrentUser();
  if (!user) {
    const credential = await signInAnonymously(auth);
    user = credential.user;
  }
  return user;
}

// Google Sign-In
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const currentUser = auth.currentUser;
  
  // If user is anonymous, link the Google account
  if (currentUser && currentUser.isAnonymous) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        await linkWithCredential(currentUser, credential);
        console.log("Linked Google account to anonymous user");
      }
      return result.user;
    } catch (error: any) {
      // If linking fails (e.g., account already exists), just sign in
      if (error.code === 'auth/credential-already-in-use') {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
      throw error;
    }
  }
  
  // Otherwise, just sign in with Google
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Email Link Sign-In (Magic Link)
const actionCodeSettings = {
  url: window.location.origin + '/#email-signin',
  handleCodeInApp: true,
};

export async function sendEmailLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Save email for later verification
  window.localStorage.setItem('emailForSignIn', email);
}

export async function completeEmailSignIn(): Promise<User | null> {
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    return null;
  }
  
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }
  if (!email) return null;
  
  const currentUser = auth.currentUser;
  
  // If user is anonymous, link the email account
  if (currentUser && currentUser.isAnonymous) {
    try {
      const credential = EmailAuthProvider.credentialWithLink(email, window.location.href);
      await linkWithCredential(currentUser, credential);
      window.localStorage.removeItem('emailForSignIn');
      console.log("Linked email to anonymous user");
      return currentUser;
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        // Email already linked to another account, sign in instead
        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem('emailForSignIn');
        return result.user;
      }
      throw error;
    }
  }
  
  // Otherwise, just sign in with email link
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem('emailForSignIn');
  return result.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await auth.signOut();
}

// Check if user is anonymous
export function isAnonymous(): boolean {
  return auth.currentUser?.isAnonymous ?? true;
}

export type { User };
