import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

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

export type { User };
