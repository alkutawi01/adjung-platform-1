import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Entry, WriterProfile, IdentityProfile, BiographyItem, SystemSettings, EntryType, RolePermissions, DigitalSignature, PolicyDocument, SystemLog } from '../types';
import { AuthService, SessionService, RbacService } from '../services/supabaseAuthService';
import { BRAND } from '../config/brand';
import { generateUUID, shouldAutoFetch, resolveEntryCanonicalUrl, getSubdomainFromHostname } from '../utils';
import { supabaseService as firestoreService } from '../utils/supabaseService';
import { supabase } from '../config/supabase';

const EMPTY_SYSTEM_SETTINGS: SystemSettings = {
  academicAffiliation: '',
  editorialPolicy: '',
  accentColor: '',
  allowSelfRegistration: true,
};

export type ActiveTabType = 
  | 'landing' 
  | 'frontpage' 
  | 'folio' 
  | 'bio' 
  | 'directory'
  | 'desk'
  | 'index'
  | 'content'
  | 'editorium' 
  | 'identity' 
  | 'notices' 
  | 'notice' 
  | 'editorial' 
  | 'changelog' 
  | 'policies';

export interface PendingOAuthProfile {
  sbUserId: string;
  email: string;
  suggestedDisplayName: string;
}

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
  identities: IdentityProfile[];
  policies: PolicyDocument[];
  logs: SystemLog[];
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
  pendingOAuthProfile: PendingOAuthProfile | null;
  setPendingOAuthProfile: (profile: PendingOAuthProfile | null) => void;
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

  // Confirm dialog (replaces window.confirm)
  confirmState: { message: string; title?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null;
  requestConfirm: (message: string, onConfirm: () => void, options?: { title?: string; confirmLabel?: string; danger?: boolean }) => void;
  closeConfirm: () => void;

  // DB operations
  refreshDbState: () => void;
  resetDatabase: () => void;
  saveEntry: (updatedEntry: Entry) => void;
  deleteEntry: (entryId: string) => void;
  createNewEntry: (type: EntryType) => void;
  
  // User operations
  toggleUserSuspension: (targetUserId: string) => void;
  changeUserRole: (targetUserId: string, newRole: User['role']) => void;

  // RBAC permissions helper
  hasPermission: (permissionKey: keyof RolePermissions) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // DB States
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<WriterProfile[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [identities, setIdentities] = useState<IdentityProfile[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(EMPTY_SYSTEM_SETTINGS);
  const [inTheNewsGoogleDocText, setInTheNewsGoogleDocText] = useState('');
  const [worldClockHolidaysGoogleDocText, setWorldClockHolidaysGoogleDocText] = useState('');
  const [researchFindingsGoogleDocText, setResearchFindingsGoogleDocText] = useState('');
  const [inTheNewsGoogleDocStatus, setInTheNewsGoogleDocStatus] = useState('empty');
  const [worldClockHolidaysGoogleDocStatus, setWorldClockHolidaysGoogleDocStatus] = useState('empty');
  const [researchFindingsGoogleDocStatus, setResearchFindingsGoogleDocStatus] = useState('empty');
  const [initializing, setInitializing] = useState(true);

  // App Navigation & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingOAuthProfile, setPendingOAuthProfile] = useState<PendingOAuthProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  // Supabase's auth listener re-fires on routine events (token refresh, tab
  // visibility/focus changes) for an already-active session, not just on a
  // genuine sign-in. The listener below needs to tell those apart so it
  // doesn't reset selectedAuthorId — and bounce the navbar/URL to the
  // user's own Folio — every time the tab regains focus while they're
  // browsing Content/Directory/Index or someone else's Folio.
  const currentUserIdRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabType>('landing');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editoriumActiveTab, setEditoriumActiveTab] = useState<EditoriumTabType>('platform');

  // Inline Note expansion
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [confirmState, setConfirmState] = useState<{ message: string; title?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null>(null);

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

      setUsers(data.users || []);
      setProfiles(data.profiles || []);
      setIdentities(data.identities || []);
      setEntries(data.entries || []);
      setPolicies(data.policies || []);
      setLogs(data.logs || []);
      if (data.systemSettings) {
        setSystemSettings(data.systemSettings);
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
          // Caching the freshly-fetched Google Doc text requires Chief Editor
          // privileges under RLS. Anonymous/non-privileged visitors simply
          // skip the write — the next Chief Editor session will cache it.
          try {
            await firestoreService.saveSystemSettings(updatedSettings);
            setSystemSettings(updatedSettings);
          } catch (cacheErr) {
            console.warn('Skipped Google Doc cache write (requires Chief Editor session):', cacheErr);
          }
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
      console.error('Failed to sync state from Supabase:', err);
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

  const requestConfirm = (
    message: string,
    onConfirm: () => void,
    options?: { title?: string; confirmLabel?: string; danger?: boolean }
  ) => {
    setConfirmState({ message, onConfirm, ...options });
  };

  const closeConfirm = () => setConfirmState(null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sbUser = session?.user;
      if (sbUser) {
        const data = await firestoreService.fetchDbState();
        const resolvedUser = data.users.find(u => u.email.toLowerCase() === sbUser.email?.toLowerCase());
        if (resolvedUser && !resolvedUser.suspended) {
          const actingUserId = localStorage.getItem('Adjung_acting_user_id');
          const actingUser = actingUserId ? data.users.find(u => u.id === actingUserId) : null;
          const effectiveUser = actingUser || resolvedUser;
          const isNewIdentity = currentUserIdRef.current !== effectiveUser.id;
          if (actingUser) {
            setCurrentUser(actingUser);
            if (isNewIdentity) setSelectedAuthorId(actingUser.id);
            setOriginalUser(resolvedUser);
          } else {
            setCurrentUser(resolvedUser);
            if (isNewIdentity) setSelectedAuthorId(resolvedUser.id);
            setOriginalUser(null);
          }
          SessionService.createSession(resolvedUser, true);
          setPendingOAuthProfile(null);
        } else if (!resolvedUser && sbUser.app_metadata?.provider === 'google') {
          // First-time Google sign-in — no matching users row yet. Don't sign
          // out of Supabase (the live session is needed to complete signup);
          // just clear the local Adjung session cache and hand off to the
          // signup wizard's oauth-completion flow (see App.tsx).
          setCurrentUser(null);
          setOriginalUser(null);
          setSelectedAuthorId('');
          localStorage.removeItem('Adjung_acting_user_id');
          SessionService.destroySession();
          setPendingOAuthProfile({
            sbUserId: sbUser.id,
            email: sbUser.email || '',
            suggestedDisplayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
          });
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
          const effectiveUser = actingUser || activeSessionUser;
          const isNewIdentity = currentUserIdRef.current !== effectiveUser.id;
          if (actingUser) {
            setCurrentUser(actingUser);
            if (isNewIdentity) setSelectedAuthorId(actingUser.id);
            setOriginalUser(activeSessionUser);
          } else {
            setCurrentUser(activeSessionUser);
            if (isNewIdentity) setSelectedAuthorId(activeSessionUser.id);
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
    return () => subscription.unsubscribe();
  }, [users]);

  // Startup Session Restore & Verification
  useEffect(() => {
    refreshDbState().finally(() => {
      try {
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
      } catch (e) {
        console.error('[DEBUG-INIT] threw before setTimeout scheduled:', e);
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

    if (currentUser && activeTab === 'landing') {
      setActiveTab('frontpage');
    }

    if (!currentUser && (activeTab === 'desk' || activeTab === 'index' || activeTab === 'editorium')) {
      setActiveTab('landing');
    }

    if ((activeTab === 'folio' || activeTab === 'bio') && !selectedAuthorId) {
      if (currentUser) {
        setSelectedAuthorId(currentUser.id);
      } else if (getSubdomainFromHostname(window.location.hostname)) {
        // A logged-out visitor on username.adjung.com is a valid, intended
        // state (public Folio/Biography) — App.tsx's own subdomain-routing
        // effect resolves selectedAuthorId a beat later. Don't treat this
        // as an error and bounce them to the landing page while it does.
      } else {
        setActiveTab('landing');
      }
    }

    if (activeTab === 'directory' && !hasPermission('viewDirectory')) {
      setActiveTab('landing');
    }

    if (activeTab === 'editorium' && !hasPermission('curateFrontpage')) {
      setActiveTab('frontpage');
    }
  }, [currentUser, activeTab, systemSettings, selectedAuthorId, initializing]);

  // DB actions
  const saveEntry = (updatedEntry: Entry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === updatedEntry.id);
      if (idx === -1) return [...prev, updatedEntry];
      const next = [...prev];
      next[idx] = updatedEntry;
      return next;
    });
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
        console.error('Failed to save entry to Supabase:', err);
        showToast('Save failed — your changes may not have been recorded. Please retry.', 'error');
      });
  };

  const deleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));

    firestoreService.deleteEntry(entryId)
      .then(() => {
        refreshDbState();
        setEditingEntry(null);
        setSelectedEntry(null);
      })
      .catch(err => {
        console.error('Failed to delete entry from Supabase:', err);
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
        : 'A concise note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.';

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
        entries,
        identities.find(i => i.accountId === currentUser.id) || null,
        currentUser.createdAt,
        currentUser.subdomainApprovedEarly,
        currentUser.isAi
      ),
      content: defaultContent,
      footnotes: type === 'Essay' ? ['Your first footnote description citation goes here.'] : undefined,
      marginNotesData: type === 'Essay' ? { 'mn-1': 'A side comment on the essay.' } : undefined
    };

    setEntries(prev => [...prev, newEntry]);
    setEditingEntry(newEntry);
    setActiveTab('desk');

    firestoreService.saveEntry(newEntry)
      .then(() => {
        refreshDbState();
      })
      .catch(err => {
        console.error('Failed to create entry in Supabase:', err);
      });
  };

  // Danger Zone: destructive reset is disabled. Restoring seed data over a
  // live production database is not something this action should ever do.
  const resetDatabase = () => {
    showToast('Database reset is disabled in production.', 'error');
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
      identities,
      policies,
      logs,
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
      pendingOAuthProfile,
      setPendingOAuthProfile,
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

      confirmState,
      requestConfirm,
      closeConfirm,

      refreshDbState,
      resetDatabase,
      saveEntry,
      deleteEntry,
      createNewEntry,
      
      toggleUserSuspension,
      changeUserRole,

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
