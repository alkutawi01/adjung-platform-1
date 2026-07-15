import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User, WriterProfile, IdentityProfile, Entry, SystemSettings } from '../types';

export const firestoreService = {
  // Sync state from all collections
  async fetchDbState() {
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const profilesSnap = await getDocs(collection(firestore, 'profiles'));
      const entriesSnap = await getDocs(collection(firestore, 'entries'));
      const identitiesSnap = await getDocs(collection(firestore, 'identities'));
      const settingsSnap = await getDocs(collection(firestore, 'system_settings'));

      const users: User[] = [];
      usersSnap.forEach(d => {
        const data = d.data();
        users.push({
          id: d.id,
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'Writer',
          penName: data.penName || '',
          signature: data.signature || '',
          avatarColor: data.avatarColor || '',
          bioSummary: data.bioSummary || '',
          suspended: !!data.suspended,
          affiliation: data.affiliation || '',
          createdAt: data.createdAt || '',
          isAi: !!data.isAi
        });
      });

      const profiles: WriterProfile[] = [];
      profilesSnap.forEach(d => {
        const data = d.data();
        profiles.push({
          authorId: d.id,
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || ''
        });
      });

      const entries: Entry[] = [];
      entriesSnap.forEach(d => {
        const data = d.data();
        entries.push({
          id: d.id,
          publicationClass: data.publicationClass,
          authorId: data.authorId,
          publisher: data.publisher,
          contentType: data.contentType || 'Essay',
          status: data.status || 'Draft',
          visibility: data.visibility || 'Public',
          createdDate: data.createdDate || new Date().toISOString(),
          updatedDate: data.updatedDate || new Date().toISOString(),
          publishedDate: data.publishedDate || null,
          title: data.title || '',
          slug: data.slug || '',
          tags: data.tags || [],
          canonicalUrl: data.canonicalUrl || '',
          content: data.content || '',
          footnotes: data.footnotes || [],
          footnotesData: data.footnotesData || [],
          marginNotes: data.marginNotes || {},
          marginNotesData: data.marginNotesData || {},
          excerpt: data.excerpt || '',
          subtitle: data.subtitle || '',
          featuredImage: data.featuredImage || '',
          revisions: data.revisions || [],
          citations: data.citations || [],
          citationIds: data.citationIds || [],
          referenceSortOrder: data.referenceSortOrder || 'appearance',
          referenceStyle: data.referenceStyle || '',
          signatureVersionId: data.signatureVersionId || '',
          priority: data.priority || 'Normal',
          effectiveFrom: data.effectiveFrom,
          effectiveUntil: data.effectiveUntil,
          isPinned: !!data.isPinned,
          editorialCategory: data.editorialCategory,
          isInstitutional: !!data.isInstitutional,
          discipline: data.discipline,
          underReview: !!data.underReview
        });
      });

      const identities: IdentityProfile[] = [];
      identitiesSnap.forEach(d => {
        const data = d.data();
        identities.push({
          identityId: d.id,
          accountId: data.accountId || '',
          username: data.username || '',
          displayName: data.displayName || '',
          penName: data.penName || '',
          biography: data.biography || '',
          lifeTimeline: data.lifeTimeline || [],
          signatures: data.signatures || [],
          publicVisibility: data.publicVisibility || 'Public',
          affiliation: data.affiliation || ''
        });
      });

      const logsSnap = await getDocs(collection(firestore, 'logs'));
      const logs: any[] = [];
      logsSnap.forEach(d => {
        logs.push({ id: d.id, ...d.data() });
      });

      let systemSettings: SystemSettings | null = null;
      settingsSnap.forEach(d => {
        if (d.id === 'main') {
          systemSettings = d.data() as SystemSettings;
        }
      });

      return {
        users,
        profiles,
        entries,
        identities,
        systemSettings,
        logs
      };
    } catch (err) {
      console.error('Error fetching database state from Firestore:', err);
      throw err;
    }
  },

  async saveLog(log: any) {
    await setDoc(doc(firestore, 'logs', log.id || `log-${Date.now()}`), log);
  },

  async saveUser(user: User) {
    await setDoc(doc(firestore, 'users', user.id), {
      username: user.username,
      email: user.email,
      role: user.role,
      penName: user.penName,
      signature: user.signature,
      avatarColor: user.avatarColor || '',
      bioSummary: user.bioSummary || '',
      suspended: !!user.suspended,
      affiliation: user.affiliation || '',
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
      isAi: !!user.isAi
    }, { merge: true });
  },

  async saveProfile(profile: WriterProfile) {
    await setDoc(doc(firestore, 'profiles', profile.authorId), {
      heroTitle: profile.heroTitle,
      heroSubtitle: profile.heroSubtitle
    }, { merge: true });
  },

  async saveIdentity(identity: IdentityProfile) {
    await setDoc(doc(firestore, 'identities', identity.identityId), {
      accountId: identity.accountId,
      username: identity.username,
      displayName: identity.displayName,
      penName: identity.penName,
      biography: identity.biography,
      lifeTimeline: identity.lifeTimeline,
      signatures: identity.signatures,
      publicVisibility: identity.publicVisibility,
      affiliation: identity.affiliation || ''
    }, { merge: true });
  },

  async saveEntry(entry: Entry) {
    await setDoc(doc(firestore, 'entries', entry.id), {
      publicationClass: entry.publicationClass || 'Scholarly',
      authorId: entry.authorId,
      publisher: entry.publisher || '',
      contentType: entry.contentType,
      status: entry.status,
      visibility: entry.visibility,
      createdDate: entry.createdDate,
      updatedDate: entry.updatedDate,
      publishedDate: entry.publishedDate,
      title: entry.title,
      slug: entry.slug,
      tags: entry.tags,
      canonicalUrl: entry.canonicalUrl,
      content: entry.content,
      footnotes: entry.footnotes || [],
      footnotesData: entry.footnotesData || [],
      marginNotes: entry.marginNotes || {},
      marginNotesData: entry.marginNotesData || {},
      excerpt: entry.excerpt || '',
      subtitle: entry.subtitle || '',
      featuredImage: entry.featuredImage || '',
      revisions: entry.revisions || [],
      citations: entry.citations || [],
      citationIds: entry.citationIds || [],
      referenceSortOrder: entry.referenceSortOrder || 'appearance',
      referenceStyle: entry.referenceStyle || '',
      signatureVersionId: entry.signatureVersionId || '',
      priority: entry.priority || 'Normal',
      effectiveFrom: entry.effectiveFrom || null,
      effectiveUntil: entry.effectiveUntil || null,
      isPinned: !!entry.isPinned,
      editorialCategory: entry.editorialCategory || '',
      isInstitutional: !!entry.isInstitutional,
      discipline: entry.discipline || '',
      underReview: !!entry.underReview
    }, { merge: true });
  },

  async deleteEntry(entryId: string) {
    await deleteDoc(doc(firestore, 'entries', entryId));
  },

  async saveSystemSettings(settings: SystemSettings) {
    await setDoc(doc(firestore, 'system_settings', 'main'), settings, { merge: true });
  },

  async resetDatabase(seedData: {
    users: User[];
    profiles: WriterProfile[];
    entries: Entry[];
    identities: IdentityProfile[];
    systemSettings: SystemSettings;
  }) {
    // Delete existing collections using a batch write or individual deletes (for simplicity, setDoc/overwrite main config and seeds)
    const batch = writeBatch(firestore);
    
    // Set seed settings
    batch.set(doc(firestore, 'system_settings', 'main'), seedData.systemSettings);
    
    // Seed users
    seedData.users.forEach(u => {
      batch.set(doc(firestore, 'users', u.id), u);
    });

    // Seed profiles
    seedData.profiles.forEach(p => {
      batch.set(doc(firestore, 'profiles', p.authorId), p);
    });

    // Seed entries
    seedData.entries.forEach(e => {
      batch.set(doc(firestore, 'entries', e.id), e);
    });

    // Seed identities
    seedData.identities.forEach(i => {
      batch.set(doc(firestore, 'identities', i.identityId), i);
    });

    await batch.commit();
  }
};
