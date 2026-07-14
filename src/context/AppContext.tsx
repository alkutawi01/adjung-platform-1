import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Entry, WriterProfile, IdentityProfile, BiographyItem, SystemSettings, EntryType, RolePermissions, DigitalSignature, PolicyDocument } from '../types';
import { db } from '../db/mockDb';
import { AuthService, SessionService, RbacService } from '../services/authService';
import { BRAND } from '../config/brand';
import { generateUUID, shouldAutoFetch, resolveEntryCanonicalUrl } from '../utils';
import { firestoreService } from '../utils/firestoreService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

export type ActiveTabType = 
  | 'landing' 
  | 'frontpage' 
  | 'folio' 
  | 'bio' 
  | 'directory' 
  | 'desk' 
  | 'index' 
  | 'editorium' 
  | 'identity' 
  | 'notices' 
  | 'notice' 
  | 'editorial' 
  | 'changelog' 
  | 'policies';

export type EditoriumTabType = 
  | 'platform' 
  | 'landing'
  | 'frontpage' 
  | 'directory' 
  | 'index' 
  | 'editorial' 
  | 'users' 
  | 'roles' 
  | 'moderation' 
  | 'system' 
  | 'dangerZone' 
  | 'architecture' 
  | 'reference-library';

interface AppContextType {
  // DB States
  users: User[];
  profiles: WriterProfile[];
  entries: Entry[];
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  inTheNewsGoogleDocText: string;
  worldClockHolidaysGoogleDocText: string;
  researchFindingsGoogleDocText: string;
  inTheNewsGoogleDocStatus: string;
  worldClockHolidaysGoogleDocStatus: string;
  researchFindingsGoogleDocStatus: string;
  initializing: boolean;
  
  // Navigation & Session
  currentUser: User | null;
  originalUser: User | null;
  selectedAuthorId: string;
  activeTab: ActiveTabType;
  selectedEntry: Entry | null;
  editingEntry: Entry | null;
  editoriumActiveTab: EditoriumTabType;
  switchActingAccount: (targetUserId: string) => void;
  revertToOriginalAccount: () => void;
  
  // Setter actions
  setCurrentUser: (user: User | null) => void;
  setSelectedAuthorId: (id: string) => void;
  setActiveTab: (tab: ActiveTabType) => void;
  setSelectedEntry: (entry: Entry | null) => void;
  setEditingEntry: (entry: Entry | null) => void;
  setEditoriumActiveTab: (tab: EditoriumTabType) => void;
  
  // Note inline expansion
  expandedNoteIds: string[];
  setExpandedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleNote: (id: string) => void;
  
  // Toast notifications
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  toastVisible: boolean;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  setToastVisible: (visible: boolean) => void;
  
  // DB operations
  refreshDbState: () => void;
  resetDatabase: () => void;
  saveEntry: (updatedEntry: Entry) => void;
  deleteEntry: (entryId: string) => void;
  createNewEntry: (type: EntryType) => void;
  
  // User operations
  toggleUserSuspension: (targetUserId: string) => void;
  changeUserRole: (targetUserId: string, newRole: User['role']) => void;
  saveWriterFromEditorium: (writerData: {
    id: string;
    username: string;
    penName: string;
    signature: string;
    bioSummary: string;
    heroTitle: string;
    heroSubtitle: string;
    bioText: string;
  }) => void;
  
  // RBAC permissions helper
  hasPermission: (permissionKey: keyof RolePermissions) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // DB States
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [profiles, setProfiles] = useState<WriterProfile[]>(db.getProfiles());
  const [entries, setEntries] = useState<Entry[]>(db.getEntries());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(db.getSystemSettings());
  const [inTheNewsGoogleDocText, setInTheNewsGoogleDocText] = useState('');
  const [worldClockHolidaysGoogleDocText, setWorldClockHolidaysGoogleDocText] = useState('');
  const [researchFindingsGoogleDocText, setResearchFindingsGoogleDocText] = useState('');
  const [inTheNewsGoogleDocStatus, setInTheNewsGoogleDocStatus] = useState('empty');
  const [worldClockHolidaysGoogleDocStatus, setWorldClockHolidaysGoogleDocStatus] = useState('empty');
  const [researchFindingsGoogleDocStatus, setResearchFindingsGoogleDocStatus] = useState('empty');
  const [initializing, setInitializing] = useState(true);

  // App Navigation & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTabType>('landing');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editoriumActiveTab, setEditoriumActiveTab] = useState<EditoriumTabType>('platform');

  // Inline Note expansion
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const fetchGoogleDocContent = async (url: string | undefined): Promise<{ text: string; status: 'success' | 'failed' | 'empty' }> => {
    if (!url) return { text: '', status: 'empty' };
    try {
      const res = await fetch(`/api/fetch-doc?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const lowerText = data.text ? data.text.toLowerCase() : '';
      if (!data.text || lowerText.includes('<!doctype html>') || lowerText.includes('sorry, the file you have requested does not exist.')) {
        return { text: '', status: 'failed' };
      }
      return { text: data.text, status: 'success' };
    } catch (e) {
      return { text: '', status: 'failed' };
    }
  };

  const refreshDbState = async () => {
    try {
      const data = await firestoreService.fetchDbState();
      
      if (data.users) db.setUsers(data.users);
      if (data.profiles) db.setProfiles(data.profiles);
      if (data.identities) db.setIdentities(data.identities);
      if (data.logs) db.setLogs(data.logs);
      if (data.systemSettings) {
        db.setSystemSettings(data.systemSettings);
        setSystemSettings(data.systemSettings);
      }
      setUsers(data.users || []);
      setProfiles(data.profiles || []);
      if (data.entries) {
        const localEntries = db.getEntries();
        const mergedEntries = [...data.entries];
        
        localEntries.forEach(localEntry => {
          const remoteIdx = mergedEntries.findIndex(e => e.id === localEntry.id);
          if (remoteIdx === -1) {
            mergedEntries.push(localEntry);
          } else {
            const remoteEntry = mergedEntries[remoteIdx];
            const localTime = new Date(localEntry.updatedDate || 0).getTime();
            const remoteTime = new Date(remoteEntry.updatedDate || 0).getTime();
            if (localTime > remoteTime) {
              mergedEntries[remoteIdx] = localEntry;
            }
          }
        });
        
        db.setEntries(mergedEntries);
        setEntries(mergedEntries);
      }

      if (data.systemSettings) {
        const settings = data.systemSettings;
        const syncTimes = settings.googleDocSyncTimes || '12:10, 00:10';
        let needsSave = false;
        const updatedSettings = { ...settings };

        // 1. In The News Doc Caching
        let newsText = settings.inTheNewsCachedText || '';
        let newsStatus = (settings.inTheNewsLastFetched ? 'success' : 'empty') as 'success' | 'failed' | 'empty';
        if (settings.inTheNewsGoogleDocUrl) {
          if (shouldAutoFetch(settings.inTheNewsLastFetched, syncTimes)) {
            const res = await fetchGoogleDocContent(settings.inTheNewsGoogleDocUrl);
            newsText = res.text;
            newsStatus = res.status;
            updatedSettings.inTheNewsCachedText = res.text;
            updatedSettings.inTheNewsLastFetched = new Date().toISOString();
            needsSave = true;
          }
        }
        setInTheNewsGoogleDocText(newsText);
        setInTheNewsGoogleDocStatus(newsStatus);

        // 2. World Clock Holidays Doc Caching
        let holidaysText = settings.worldClockCachedText || '';
        let holidaysStatus = (settings.worldClockLastFetched ? 'success' : 'empty') as 'success' | 'failed' | 'empty';
        if (settings.worldClockHolidaysGoogleDocUrl) {
          if (shouldAutoFetch(settings.worldClockLastFetched, syncTimes)) {
            const res = await fetchGoogleDocContent(settings.worldClockHolidaysGoogleDocUrl);
            holidaysText = res.text;
            holidaysStatus = res.status;
            updatedSettings.worldClockCachedText = res.text;
            updatedSettings.worldClockLastFetched = new Date().toISOString();
            needsSave = true;
          }
        }
        setWorldClockHolidaysGoogleDocText(holidaysText);
        setWorldClockHolidaysGoogleDocStatus(holidaysStatus);

        // 3. Research Findings Doc Caching
        let findingsText = settings.researchFindingsCachedText || '';
        let findingsStatus = (settings.researchFindingsLastFetched ? 'success' : 'empty') as 'success' | 'failed' | 'empty';
        if (settings.researchFindingsGoogleDocUrl) {
          if (shouldAutoFetch(settings.researchFindingsLastFetched, syncTimes)) {
            const res = await fetchGoogleDocContent(settings.researchFindingsGoogleDocUrl);
            findingsText = res.text;
            findingsStatus = res.status;
            updatedSettings.researchFindingsCachedText = res.text;
            updatedSettings.researchFindingsLastFetched = new Date().toISOString();
            needsSave = true;
          }
        }
        setResearchFindingsGoogleDocText(findingsText);
        setResearchFindingsGoogleDocStatus(findingsStatus);

        if (needsSave) {
          await firestoreService.saveSystemSettings(updatedSettings);
          setSystemSettings(updatedSettings);
          db.setSystemSettings(updatedSettings);
        }
      }

      const activeSessionUser = SessionService.validateAndRetrieveSession();
      if (activeSessionUser) {
        const found = data.users.find(u => u.id === activeSessionUser.id);
        if (found) {
          if (found.suspended) {
            setCurrentUser(null);
            setOriginalUser(null);
            setSelectedAuthorId('');
            setActiveTab('landing');
            localStorage.removeItem('Adjung_acting_user_id');
            SessionService.destroySession();
          } else {
            const actingUserId = localStorage.getItem('Adjung_acting_user_id');
            const actingUser = actingUserId ? data.users.find(u => u.id === actingUserId) : null;
            if (actingUser) {
              setCurrentUser(actingUser);
              setSelectedAuthorId(actingUser.id);
              setOriginalUser(found);
            } else {
              setCurrentUser(found);
              setSelectedAuthorId(found.id);
              setOriginalUser(null);
            }
            SessionService.createSession(found, true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync state from Firestore:', err);
    }
  };

  const updateSystemSettingsState = (settings: SystemSettings) => {
    firestoreService.saveSystemSettings(settings)
      .then(() => {
        refreshDbState();
        showToast('System settings saved', 'success');
      })
      .catch(err => console.error('Failed to save system settings:', err));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setToastVisible(true);
  };

  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  // Reactive Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const data = await firestoreService.fetchDbState();
        const resolvedUser = data.users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        if (resolvedUser && !resolvedUser.suspended) {
          const actingUserId = localStorage.getItem('Adjung_acting_user_id');
          const actingUser = actingUserId ? data.users.find(u => u.id === actingUserId) : null;
          if (actingUser) {
            setCurrentUser(actingUser);
            setSelectedAuthorId(actingUser.id);
            setOriginalUser(resolvedUser);
          } else {
            setCurrentUser(resolvedUser);
            setSelectedAuthorId(resolvedUser.id);
            setOriginalUser(null);
          }
          SessionService.createSession(resolvedUser, true);
        } else {
          setCurrentUser(null);
          setOriginalUser(null);
          setSelectedAuthorId('');
          localStorage.removeItem('Adjung_acting_user_id');
          SessionService.destroySession();
        }
      } else {
        // Fallback to local session check if not logged in to Firebase yet (lazy session validation)
        const activeSessionUser = SessionService.validateAndRetrieveSession();
        if (activeSessionUser) {
          const actingUserId = localStorage.getItem('Adjung_acting_user_id');
          const actingUser = actingUserId ? users.find(u => u.id === actingUserId) : null;
          if (actingUser) {
            setCurrentUser(actingUser);
            setSelectedAuthorId(actingUser.id);
            setOriginalUser(activeSessionUser);
          } else {
            setCurrentUser(activeSessionUser);
            setSelectedAuthorId(activeSessionUser.id);
            setOriginalUser(null);
          }
        } else {
          setCurrentUser(null);
          setOriginalUser(null);
          setSelectedAuthorId('');
          localStorage.removeItem('Adjung_acting_user_id');
          SessionService.destroySession();
        }
      }
    });
    return () => unsubscribe();
  }, [users]);

  // Startup Session Restore & Verification
  useEffect(() => {
    refreshDbState().finally(() => {
      // Determine initial tab from current pathname
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      const route = parts[0];
      const PUBLIC_ROUTES = ['frontpage', 'directory', 'index', 'notices', 'notice', 'editorial', 'changelog', 'policies'];
      
      const activeSessionUser = SessionService.validateAndRetrieveSession();
      if (activeSessionUser) {
        setActiveTab('folio');
      } else if (route && PUBLIC_ROUTES.includes(route)) {
        setActiveTab(route as ActiveTabType);
      } else {
        setActiveTab('landing');
      }
      
      setTimeout(() => {
        setInitializing(false);
      }, 1000);
    });
  }, []);

  const toggleNote = (id: string) => {
    setExpandedNoteIds(prev =>
      prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]
    );
  };

  // Scroll to top of page when tab or entry changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, selectedEntry]);

  const hasPermission = (permissionKey: keyof RolePermissions) => {
    return RbacService.hasPermission(currentUser, permissionKey, systemSettings);
  };

  // Enforce private environment & Access Control guards
  useEffect(() => {
    if (initializing) return;
    console.log('[GUARD] running. currentUser:', currentUser?.id, 'activeTab:', activeTab, 'selectedAuthorId:', selectedAuthorId);

    if (currentUser && activeTab === 'landing') {
      console.log('[GUARD] Redirecting because currentUser exists and activeTab is landing -> frontpage');
      setActiveTab('frontpage');
    }

    if (!currentUser && (activeTab === 'desk' || activeTab === 'index' || activeTab === 'editorium')) {
      console.log('[GUARD] Redirecting because no currentUser and tab requires auth -> landing');
      setActiveTab('landing');
    }
    
    if ((activeTab === 'folio' || activeTab === 'bio') && !selectedAuthorId) {
      if (currentUser) {
        console.log('[GUARD] Restoring selectedAuthorId to currentUser.id:', currentUser.id);
        setSelectedAuthorId(currentUser.id);
      } else {
        console.log('[GUARD] Redirecting because activeTab is folio/bio but selectedAuthorId is empty -> landing');
        setActiveTab('landing');
      }
    }

    if (activeTab === 'directory' && !hasPermission('viewDirectory')) {
      console.log('[GUARD] Redirecting because no viewDirectory permission -> landing');
      setActiveTab('landing');
    }

    if (activeTab === 'editorium' && !hasPermission('curateFrontpage')) {
      console.log('[GUARD] Redirecting because no curateFrontpage permission -> frontpage');
      setActiveTab('frontpage');
    }
  }, [currentUser, activeTab, systemSettings, selectedAuthorId, initializing]);

  // DB actions
  const saveEntry = (updatedEntry: Entry) => {
    db.saveEntry(updatedEntry);
    setEntries(db.getEntries());
    if (editingEntry?.id === updatedEntry.id) {
      setEditingEntry(updatedEntry);
    }
    if (selectedEntry?.id === updatedEntry.id) {
      setSelectedEntry(updatedEntry);
    }

    firestoreService.saveEntry(updatedEntry)
      .then(() => {
        refreshDbState();
      })
      .catch(err => {
        console.error('Failed to save entry to Firestore:', err);
        setEntries(db.getEntries());
      });
  };

  const deleteEntry = (entryId: string) => {
    db.deleteEntry(entryId);
    setEntries(db.getEntries());

    firestoreService.deleteEntry(entryId)
      .then(() => {
        refreshDbState();
        setEditingEntry(null);
        setSelectedEntry(null);
      })
      .catch(err => {
        console.error('Failed to delete entry from Firestore:', err);
        setEntries(db.getEntries());
      });
  };

  const createNewEntry = (type: EntryType) => {
    if (!currentUser) return;

    const newId = generateUUID();
    const tempTitle = type === 'Note' ? '' : `Untitled ${type}`;
    const defaultContent = type === 'Essay'
      ? 'This is the primary discourse of your essay. You may incorporate footnotes[^1] directly inside your entry text. Margin notes can also be placed[^mn-1] along the side margins.\n\nAnother paragraph expanding on your thesis.'
      : type === 'Notice' ? 'Official notice regarding platform operations or schedule updates.'
        : type === "Editor's Note" ? 'Official reflections from the Editorial Board regarding the structural direction of the platform.'
        : 'A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.';

    const slugSuffix = Date.now().toString().slice(-4);
    const entrySlug = type === 'Note' ? `note-${slugSuffix}` : `untitled-${type.toLowerCase()}-${slugSuffix}`;

    const newEntry: Entry = {
      id: newId,
      authorId: currentUser.id,
      contentType: type,
      status: 'Draft',
      visibility: 'Private',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      publishedDate: null,
      title: tempTitle,
      slug: entrySlug,
      tags: [],
      canonicalUrl: resolveEntryCanonicalUrl(
        { id: newId, authorId: currentUser.id, contentType: type, slug: entrySlug, status: 'Draft', visibility: 'Private', createdDate: new Date().toISOString(), updatedDate: new Date().toISOString(), publishedDate: null, title: tempTitle, tags: [], content: defaultContent } as Entry,
        currentUser.username,
        db.getEntries(),
        db.getIdentityByAccountId(currentUser.id),
        currentUser.createdAt,
        currentUser.subdomainApprovedEarly
      ),
      content: defaultContent,
      footnotes: type === 'Essay' ? ['Your first footnote description citation goes here.'] : undefined,
      marginNotesData: type === 'Essay' ? { 'mn-1': 'A scholarly side comment on the essay.' } : undefined
    };

    db.saveEntry(newEntry);
    setEntries(db.getEntries());
    setEditingEntry(newEntry);
    setActiveTab('desk');

    firestoreService.saveEntry(newEntry)
      .then(() => {
        refreshDbState();
      })
      .catch(err => {
        console.error('Failed to create entry in Firestore:', err);
        setEntries(db.getEntries());
      });
  };

  const resetDatabase = () => {
    if (window.confirm('WARNING: This will restore the database to the initial academic seed data, erasing all custom cloud modifications. Proceed?')) {
      const seedData = {
        users: db.getUsers(),
        profiles: db.getProfiles(),
        entries: db.getEntries(),
        identities: db.getIdentities(),
        systemSettings: db.getSystemSettings()
      };
      firestoreService.resetDatabase(seedData)
        .then(() => {
          AuthService.signOut();
          refreshDbState();
          setCurrentUser(null);
          setSelectedAuthorId('');
          setActiveTab('folio');
          setEditingEntry(null);
          setSelectedEntry(null);
        })
        .catch(err => console.error('Failed to reset database:', err));
    }
  };

  const toggleUserSuspension = (targetUserId: string) => {
    if (!currentUser || !hasPermission('manageRbac')) {
      showToast('Permission Denied: Only users with RBAC management privileges can suspend accounts.', 'error');
      return;
    }

    if (currentUser.id === targetUserId) {
      showToast('Self-Administration Safety: You cannot suspend your own account.', 'error');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.role === 'Chief Editor' && !targetUser.suspended) {
      const activeChiefEditors = users.filter(u => u.role === 'Chief Editor' && !u.suspended);
      if (activeChiefEditors.length <= 1) {
        showToast('Self-Administration Safety: The platform must always maintain at least one active Chief Editor.', 'error');
        return;
      }
    }

    const updatedUser: User = {
      ...targetUser,
      suspended: !targetUser.suspended
    };

    firestoreService.saveUser(updatedUser)
      .then(() => {
        refreshDbState();
        showToast(`${targetUser.penName}'s account has been ${updatedUser.suspended ? 'suspended' : 'reactivated'}.`, 'success');
      })
      .catch(err => console.error('Failed to suspend user:', err));
  };

  const changeUserRole = (targetUserId: string, newRole: User['role']) => {
    if (!currentUser || !hasPermission('manageRbac')) {
      showToast('Permission Denied: Only users with RBAC management privileges can modify user roles.', 'error');
      return;
    }

    if (currentUser.id === targetUserId) {
      showToast('Self-Administration Safety: You cannot demote yourself or modify your own role.', 'error');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.role === 'Chief Editor' && newRole !== 'Chief Editor') {
      const activeChiefEditors = users.filter(u => u.role === 'Chief Editor' && !u.suspended);
      if (activeChiefEditors.length <= 1) {
        showToast('Self-Administration Safety: The platform must always maintain at least one active Chief Editor.', 'error');
        return;
      }
    }

    const updatedUser: User = {
      ...targetUser,
      role: newRole
    };

    firestoreService.saveUser(updatedUser)
      .then(() => {
        refreshDbState();
        showToast(`${targetUser.penName}'s role changed to ${newRole}.`, 'success');
      })
      .catch(err => console.error('Failed to change role:', err));
  };

  const saveWriterFromEditorium = (writerData: {
    id: string;
    username: string;
    penName: string;
    signature: string;
    bioSummary: string;
    heroTitle: string;
    heroSubtitle: string;
    bioText: string;
  }) => {
    const { id, username, penName, signature, bioSummary, heroTitle, heroSubtitle, bioText } = writerData;
    const writer = users.find(u => u.id === id);
    if (!writer) return;

    const updatedUser: User = {
      ...writer,
      username,
      penName,
      signature,
      bioSummary,
    };

    const profile = profiles.find(p => p.authorId === id) || { authorId: id, heroTitle: '', heroSubtitle: '' };
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle,
      heroSubtitle,
    };

    firestoreService.fetchDbState().then(data => {
      const identitiesList: IdentityProfile[] = data.identities;
      const identity = identitiesList.find(i => i.accountId === id);
      const updatedIdentity = identity ? {
        ...identity,
        biography: bioText,
      } : {
        identityId: `id-${id}`,
        accountId: id,
        username,
        displayName: penName,
        penName,
        biography: bioText,
        publicVisibility: 'Public' as const,
        lifeTimeline: [],
        signatures: []
      };

      Promise.all([
        firestoreService.saveUser(updatedUser),
        firestoreService.saveProfile(updatedProfile),
        firestoreService.saveIdentity(updatedIdentity)
      ]).then(() => {
        refreshDbState();
        showToast('Settings updated', 'success');
      });
    }).catch(err => console.error('Failed to update writer settings:', err));
  };
  
  const switchActingAccount = (targetUserId: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;
    
    if (!originalUser) {
      setOriginalUser(currentUser);
    }
    setCurrentUser(target);
    setSelectedAuthorId(target.id);
    localStorage.setItem('Adjung_acting_user_id', target.id);
    
    setActiveTab('frontpage');
    setSelectedEntry(null);
    setEditingEntry(null);
    showToast(`Switched account: acting as ${target.penName}`, 'success');
  };

  const revertToOriginalAccount = () => {
    if (!originalUser) return;
    
    setCurrentUser(originalUser);
    setSelectedAuthorId(originalUser.id);
    setOriginalUser(null);
    localStorage.removeItem('Adjung_acting_user_id');
    
    setActiveTab('frontpage');
    setSelectedEntry(null);
    setEditingEntry(null);
    showToast(`Returned to original account: ${originalUser.penName}`, 'success');
  };

  return (
    <AppContext.Provider value={{
      users,
      profiles,
      entries,
      systemSettings,
      setSystemSettings: updateSystemSettingsState,
      inTheNewsGoogleDocText,
      worldClockHolidaysGoogleDocText,
      researchFindingsGoogleDocText,
      inTheNewsGoogleDocStatus,
      worldClockHolidaysGoogleDocStatus,
      researchFindingsGoogleDocStatus,
      initializing,
      
      currentUser,
      originalUser,
      selectedAuthorId,
      activeTab,
      selectedEntry,
      editingEntry,
      editoriumActiveTab,
      switchActingAccount,
      revertToOriginalAccount,
      
      setCurrentUser,
      setSelectedAuthorId,
      setActiveTab,
      setSelectedEntry,
      setEditingEntry,
      setEditoriumActiveTab,
      
      expandedNoteIds,
      setExpandedNoteIds,
      toggleNote,
      
      toast,
      toastVisible,
      showToast,
      setToastVisible,
      
      refreshDbState,
      resetDatabase,
      saveEntry,
      deleteEntry,
      createNewEntry,
      
      toggleUserSuspension,
      changeUserRole,
      saveWriterFromEditorium,
      
      hasPermission
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
