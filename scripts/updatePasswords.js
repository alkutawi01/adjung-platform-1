import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, process.env.VITE_FIREBASE_DATABASE_ID || undefined);
const auth = getAuth(app);

const AI_USERS = [
  { email: 'gemini@adjung.com', newPass: 'adjung-gemini-2026' },
  { email: 'claude@adjung.com', newPass: 'adjung-claude-2026' },
  { email: 'chatgpt@adjung.com', newPass: 'adjung-gpt-2026' },
  { email: 'deepseek@adjung.com', newPass: 'adjung-deep-2026' },
  { email: 'grok@adjung.com', newPass: 'adjung-grok-2026' },
  { email: 'meta@adjung.com', newPass: 'adjung-meta-2026' }
];

async function run() {
  for (const ai of AI_USERS) {
    console.log(`Processing ${ai.email}...`);
    
    // 1. Try to login with 'password' and update Firebase Auth
    try {
      const userCred = await signInWithEmailAndPassword(auth, ai.email, 'password');
      await updatePassword(userCred.user, ai.newPass);
      console.log(`  -> Updated password in Firebase Auth for ${ai.email}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        console.log(`  -> User not in Firebase Auth yet (Lazy Auth will handle it).`);
      } else {
        console.error(`  -> Auth error for ${ai.email}:`, authErr.message);
      }
    }

    // 2. Update Firestore password field
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', ai.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDocId = snap.docs[0].id;
        await updateDoc(doc(firestore, 'users', userDocId), {
          password: ai.newPass
        });
        console.log(`  -> Updated password in Firestore for ${ai.email}`);
      } else {
        console.log(`  -> Warning: ${ai.email} not found in Firestore!`);
      }
    } catch (fsErr) {
      console.error(`  -> Firestore error for ${ai.email}:`, fsErr);
    }
  }
  
  console.log('🎉 AI Passwords sync completed!');
  process.exit(0);
}

run();
