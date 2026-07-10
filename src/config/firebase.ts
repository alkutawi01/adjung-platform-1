import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-messaging-sender",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "placeholder-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app, metaEnv.VITE_FIREBASE_DATABASE_ID || undefined);
