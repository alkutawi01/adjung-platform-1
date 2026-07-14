import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

async function clean() {
  try {
    const snap = await getDocs(collection(firestore, 'entries'));
    console.log('--- Scanning Firestore Entries ---');
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      const id = d.id;
      
      const isMock = id.startsWith('entry-mock-') || 
                     id.startsWith('entry-canonical-') || 
                     id.startsWith('entry-amina-') || 
                     id.startsWith('entry-zayd-') || 
                     id.startsWith('entry-sarah-') || 
                     id === 'sound-of-sean-hull';

      if (isMock) {
        console.log(`🗑️ Deleting mock entry: ${id} - "${data.title}"`);
        await deleteDoc(doc(firestore, 'entries', id));
        count++;
      } else {
        console.log(`Keep: ${id} - "${data.title}"`);
      }
    }
    console.log(`--- Clean up complete. Deleted ${count} entries. ---`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

clean();
