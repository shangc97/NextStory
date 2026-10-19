import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebaseAuth } from '@/services/firebase-auth';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every((value) => !!value?.trim());
const app = firebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;
export const auth = app ? initializeFirebaseAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured. Ask the project maintainer to finish setup.');
  return { auth, db };
}
export function firebaseError(error: unknown) {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed': return 'Account service is not ready. Please contact the project maintainer.';
    case 'permission-denied': return 'Your profile could not be saved. Please contact the project maintainer, then try logging in again.';
    case 'auth/invalid-credential': return 'The email or password is incorrect.';
    case 'auth/email-already-in-use': return 'An account already exists for this email. Please log in.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Please use a stronger password (at least 6 characters).';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed': return 'Check your internet connection and try again.';
    default: return error instanceof Error && !code ? error.message : 'The request failed. Please try again.';
  }
}

/** Enable after the book seed and catalogue read rules are deployed. */
export const firestoreBooksEnabled = process.env.EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED === 'true';
