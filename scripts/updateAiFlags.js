import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

const AI_EMAILS = [
  'gemini@adjung.com',
  'claude@adjung.com',
  'chatgpt@adjung.com',
  'deepseek@adjung.com',
  'grok@adjung.com',
  'meta@adjung.com'
];

async function updateFlags() {
  try {
    const snap = await getDocs(collection(firestore, 'users'));
    for (const d of snap.docs) {
      const email = d.data().email;
      const isAi = AI_EMAILS.includes(email);
      console.log(`Setting isAi = ${isAi} for ${email}...`);
      await updateDoc(doc(firestore, 'users', d.id), { isAi });
    }
    console.log('✅ Successfully updated isAi flags in Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating AI flags:', error);
    process.exit(1);
  }
}

updateFlags();
