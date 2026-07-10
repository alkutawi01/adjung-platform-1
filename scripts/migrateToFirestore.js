import sqlite3 from 'sqlite3';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Missing Firebase credentials in .env file.');
  console.log('Please make sure you configure your VITE_FIREBASE_* variables first.');
  process.exit(1);
}

const dbPath = path.resolve('adjung.db');
if (!fs.existsSync(dbPath)) {
  console.error(`❌ Error: SQLite database not found at ${dbPath}`);
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('📖 Connected to SQLite database: adjung.db');
});

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function migrate() {
  try {
    console.log('🚀 Starting Adjung SQLite to Firestore Migration...');

    // 1. Migrate Users
    console.log('Migrating users...');
    const users = await query('SELECT * FROM users');
    for (const u of users) {
      const docRef = doc(firestore, 'users', u.id);
      await setDoc(docRef, {
        username: u.username,
        email: u.email,
        role: u.role,
        penName: u.penName,
        signature: u.signature,
        avatarColor: u.avatarColor || '',
        bioSummary: u.bioSummary || '',
        suspended: u.isSuspended === 1,
        affiliation: u.affiliation || '',
        password: u.password || 'password' // Preserved plain text password for lazy Auth creation
      });
      console.log(`✅ User migrated: ${u.username}`);
    }

    // 2. Migrate Profiles
    console.log('Migrating writer profiles...');
    const profiles = await query('SELECT * FROM profiles');
    for (const p of profiles) {
      const docRef = doc(firestore, 'profiles', p.authorId);
      await setDoc(docRef, {
        heroTitle: p.heroTitle || '',
        heroSubtitle: p.heroSubtitle || ''
      });
      console.log(`✅ Profile migrated: ${p.authorId}`);
    }

    // 3. Migrate Identities
    console.log('Migrating digital identities...');
    const identities = await query('SELECT * FROM identities');
    for (const iden of identities) {
      const docRef = doc(firestore, 'identities', iden.identityId);
      await setDoc(docRef, {
        accountId: iden.accountId,
        username: iden.username,
        displayName: iden.displayName,
        penName: iden.penName,
        biography: iden.biography || '',
        lifeTimeline: JSON.parse(iden.lifeTimeline || '[]'),
        signatures: JSON.parse(iden.signatures || '[]'),
        publicVisibility: iden.publicVisibility || 'Public',
        affiliation: iden.affiliation || ''
      });
      console.log(`✅ Identity migrated: ${iden.identityId}`);
    }

    // 4. Migrate Entries
    console.log('Migrating entries (articles, essays, notes)...');
    const entries = await query('SELECT * FROM entries');
    for (const e of entries) {
      const docRef = doc(firestore, 'entries', e.id);
      await setDoc(docRef, {
        publicationClass: e.publicationClass || 'Scholarly',
        authorId: e.authorId,
        publisher: e.publisher || '',
        contentType: e.contentType,
        status: e.status,
        visibility: e.visibility,
        createdDate: e.createdDate,
        updatedDate: e.updatedDate,
        publishedDate: e.publishedDate,
        title: e.title,
        slug: e.slug,
        tags: JSON.parse(e.tags || '[]'),
        canonicalUrl: e.canonicalUrl || '',
        content: e.content,
        footnotes: JSON.parse(e.footnotes || '[]'),
        footnotesData: JSON.parse(e.footnotesData || '[]'),
        marginNotes: JSON.parse(e.marginNotes || '{}'),
        marginNotesData: JSON.parse(e.marginNotesData || '{}'),
        excerpt: e.excerpt || '',
        subtitle: e.subtitle || '',
        featuredImage: e.featuredImage || '',
        revisions: JSON.parse(e.revisions || '[]'),
        citations: JSON.parse(e.citations || '[]'),
        citationIds: JSON.parse(e.citationIds || '[]'),
        referenceSortOrder: e.referenceSortOrder || 'appearance',
        referenceStyle: e.referenceStyle || '',
        signatureVersionId: e.signatureVersionId || '',
        priority: e.priority || 'Normal',
        effectiveFrom: e.effectiveFrom || null,
        effectiveUntil: e.effectiveUntil || null,
        isPinned: e.isPinned === 1,
        editorialCategory: e.editorialCategory || '',
        isInstitutional: e.isInstitutional === 1,
        discipline: e.discipline || '',
        underReview: e.underReview === 1
      });
      console.log(`✅ Entry migrated: ${e.title}`);
    }

    // 5. Migrate System Settings
    console.log('Migrating system settings...');
    const settings = await query('SELECT * FROM system_settings');
    for (const s of settings) {
      const docRef = doc(firestore, 'system_settings', s.id);
      await setDoc(docRef, {
        academicAffiliation: s.academicAffiliation,
        editorialPolicy: s.editorialPolicy,
        accentColor: s.accentColor,
        allowSelfRegistration: s.allowSelfRegistration === 1,
        featuredScholarId: s.featuredScholarId || '',
        featuredEntryId: s.featuredEntryId || '',
        featuredEssayIds: JSON.parse(s.featuredEssayIds || '[]'),
        featuredNoteIds: JSON.parse(s.featuredNoteIds || '[]'),
        editorialSelectionIds: JSON.parse(s.editorialSelectionIds || '[]'),
        announcementBanner: s.announcementBanner || '',
        enableArabicAccent: s.enableArabicAccent === 1,
        layoutDensity: s.layoutDensity || 'Standard',
        allowedSignatureFonts: JSON.parse(s.allowedSignatureFonts || '[]'),
        rolePermissions: JSON.parse(s.rolePermissions || '{}'),
        inTheNewsText: s.inTheNewsText || '',
        inTheNewsGoogleDocUrl: s.inTheNewsGoogleDocUrl || '',
        worldClockHolidaysText: s.worldClockHolidaysText || '',
        worldClockHolidaysGoogleDocUrl: s.worldClockHolidaysGoogleDocUrl || '',
        researchFindingsText: s.researchFindingsText || '',
        researchFindingsGoogleDocUrl: s.researchFindingsGoogleDocUrl || ''
      });
      console.log(`✅ System settings migrated: ${s.id}`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed with error:', err);
  } finally {
    db.close();
  }
}

migrate();
