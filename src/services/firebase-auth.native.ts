import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth, initializeAuth,
  // Firebase's web typings omit this verified Metro react-native export.
  // @ts-expect-error Native-only Firebase Auth export.
  getReactNativePersistence,
} from 'firebase/auth';

export function initializeFirebaseAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}
