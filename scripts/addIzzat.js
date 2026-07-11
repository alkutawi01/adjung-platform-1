import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

async function addAdmin() {
  const userId = 'user-izzat-anas';
  try {
    // 1. Add User
    await setDoc(doc(firestore, 'users', userId), {
      username: 'izzatanas',
      email: 'alkutawi01@gmail.com',
      role: 'Chief Editor',
      penName: 'Izzat Anas',
      signature: 'I.A.',
      avatarColor: 'bg-stone-800',
      bioSummary: 'Chief Editor at Adjung.',
      suspended: false,
      affiliation: 'Adjung Platform',
      password: 'Bismillah@01',
      createdAt: new Date().toISOString().split('T')[0]
    });

    // 2. Add Profile
    await setDoc(doc(firestore, 'profiles', userId), {
      heroTitle: 'Ketua Editor',
      heroSubtitle: 'Membina platform ilmu'
    });

    // 3. Add Identity
    await setDoc(doc(firestore, 'identities', 'id-user-izzat-anas'), {
      accountId: userId,
      username: 'izzatanas',
      displayName: 'Izzat Anas',
      penName: 'Izzat Anas',
      biography: 'Chief Editor at Adjung.',
      lifeTimeline: '[]',
      careerHighlights: '[]',
      philosophicalStances: '[]',
      notableWorks: '[]',
      signatures: []
    });

    console.log('✅ Account alkutawi01@gmail.com (Izzat Anas) successfully added to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding account:', error);
    process.exit(1);
  }
}

addAdmin();
