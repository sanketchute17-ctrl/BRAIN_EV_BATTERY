import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('your-firebase-api-key')
  );
};

let appInstance: FirebaseApp | null = null;
try {
  if (isFirebaseConfigured()) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
} catch (e) {
  console.warn('Firebase init safe fallback:', e);
}
export const firebaseApp: FirebaseApp | null = appInstance;

let authInstance: Auth | null = null;
try {
  if (firebaseApp) {
    authInstance = getAuth(firebaseApp);
  }
} catch (e) {
  console.warn('Firebase Auth init safe fallback:', e);
}
export const firebaseAuth: Auth | null = authInstance;
