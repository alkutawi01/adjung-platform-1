import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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

async function updatePermissions() {
  const docRef = doc(firestore, 'system_settings', 'main');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rolePermissions = data.rolePermissions || {};
      
      if (rolePermissions.Writer) {
        rolePermissions.Writer.viewIndex = true;
        rolePermissions.Writer.viewDirectory = true;
      }
      
      await updateDoc(docRef, {
        rolePermissions: rolePermissions
      });
      console.log('✅ Successfully updated Writer permissions in Firestore!');
    } else {
      console.error('system_settings/main not found!');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error updating permissions:', error);
    process.exit(1);
  }
}

updatePermissions();
