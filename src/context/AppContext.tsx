import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Entry, WriterProfile, IdentityProfile, BiographyItem, SystemSettings, EntryType, RolePermissions, DigitalSignature, PolicyDocument } from '../types';
import { db } from '../db/mockDb';
import { AuthService, SessionService, RbacService } from '../services/authService';
import { BRAND } from '../config/brand';
import { generateUUID } from '../utils';

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
  | 'editorial' 
  | 'changelog' 
  | 'policies';

export type EditoriumTabType = 
  | 'platform' 
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
  initializing: boolean;
  
  // Navigation & Session
  currentUser: User | null;
  selectedAuthorId: string;
  activeTab: ActiveTabType;
  selectedEntry: Entry | null;
  editingEntry: Entry | null;
  editoriumActiveTab: EditoriumTabType;
  
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
  const [initializing, setInitializing] = useState(true);

  // App Navigation & Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  const refreshDbState = () => {
    setUsers(db.getUsers());
    setProfiles(db.getProfiles());
    setEntries(db.getEntries());
    setSystemSettings(db.getSystemSettings());
  };

  const updateSystemSettingsState = (settings: SystemSettings) => {
    db.updateSystemSettings(settings);
    setSystemSettings(settings);
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

  // Startup Session Restore & Verification
  useEffect(() => {
    const activeSessionUser = SessionService.validateAndRetrieveSession();
    if (activeSessionUser) {
      setCurrentUser(activeSessionUser);
      setSelectedAuthorId(activeSessionUser.id);
      setActiveTab('folio');
    } else {
      setCurrentUser(null);
      setSelectedAuthorId('');
      setActiveTab('landing');
    }
    
    setTimeout(() => {
      setInitializing(false);
    }, 1000);
  }, []);

  const toggleNote = (id: string) => {
    setExpandedNoteIds(prev =>
      prev.includes(id) ? prev.filter(noteId => noteId !== id) : [...prev, id]
    );
  };

  // Intercept Note selection to prevent dedicated page rendering, expanding inline instead
  useEffect(() => {
    if (selectedEntry && selectedEntry.contentType === 'Note') {
      const noteId = selectedEntry.id;
      setExpandedNoteIds(prev => prev.includes(noteId) ? prev : [...prev, noteId]);
      setSelectedEntry(null);
      setActiveTab('folio');
      
      setTimeout(() => {
        const element = document.getElementById(`note-card-${noteId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [selectedEntry]);

  // Scroll to top of page when tab or non-note entry changes
  useEffect(() => {
    if (selectedEntry) {
      if (selectedEntry.contentType !== 'Note') {
        window.scrollTo(0, 0);
      }
    } else {
      window.scrollTo(0, 0);
    }
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
      setActiveTab('landing');
    }

    if (activeTab === 'directory' && !hasPermission('viewDirectory')) {
      setActiveTab('landing');
    }
  }, [currentUser, activeTab, systemSettings, selectedAuthorId, initializing]);

  // DB actions
  const saveEntry = (updatedEntry: Entry) => {
    db.saveEntry(updatedEntry);
    refreshDbState();
    if (editingEntry?.id === updatedEntry.id) {
      setEditingEntry(updatedEntry);
    }
  };

  const deleteEntry = (entryId: string) => {
    db.deleteEntry(entryId);
    refreshDbState();
    setEditingEntry(null);
    setSelectedEntry(null);
  };

  const createNewEntry = (type: EntryType) => {
    if (!currentUser) return;

    const newId = generateUUID();
    const tempTitle = type === 'Note' ? '' : `Untitled ${type}`;
    const defaultContent = type === 'Article' 
      ? 'This is the first paragraph of your scholarly article.\n\nThis is the second paragraph of your article. Margin notes are displayed adjacent to their respective paragraph.'
      : type === 'Essay'
      ? 'This is the primary discourse of your essay. You may incorporate footnotes[^1] directly inside your entry text.\n\nAnother paragraph expanding on your thesis.'
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
      tags: ['Scholarship'],
      canonicalUrl: `https://${currentUser.penName.toLowerCase().replace(/\s+/g, '')}.adjung.com/${type.toLowerCase()}/${type === 'Note' ? 'note-' + slugSuffix : 'untitled'}`,
      content: defaultContent,
      footnotes: type === 'Essay' ? ['Your first footnote description citation goes here.'] : undefined,
      marginNotes: type === 'Article' ? { 0: 'A scholarly margin note aligned with paragraph 1.' } : undefined
    };

    db.saveEntry(newEntry);
    refreshDbState();
    setEditingEntry(newEntry);
  };

  const resetDatabase = () => {
    db.resetToDefaults();
    AuthService.signOut();
    refreshDbState();
    setCurrentUser(null);
    setSelectedAuthorId('');
    setActiveTab('folio');
    setEditingEntry(null);
    setSelectedEntry(null);
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
    db.updateUser(updatedUser);
    db.addLog(`${updatedUser.suspended ? 'Suspended' : 'Reactivated'} account of ${targetUser.penName} (@${targetUser.username}).`, currentUser.penName, currentUser.role);
    refreshDbState();

    showToast(`${targetUser.penName}'s account has been ${updatedUser.suspended ? 'suspended' : 'reactivated'}.`, 'success');
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
    db.updateUser(updatedUser);
    db.addLog(`Modified role of ${targetUser.penName} (@${targetUser.username}) from '${targetUser.role}' to '${newRole}'.`, currentUser.penName, currentUser.role);
    refreshDbState();

    showToast(`${targetUser.penName}'s role changed to ${newRole}.`, 'success');
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
    db.updateUser(updatedUser);

    const profile = db.getProfileByAuthorId(writer.id);
    const updatedProfile: WriterProfile = {
      ...profile,
      heroTitle,
      heroSubtitle,
    };
    db.updateProfile(updatedProfile);
    
    const identity = db.getIdentityByAccountId(writer.id);
    if (identity) {
      db.updateIdentity({
        ...identity,
        biography: bioText,
      });
    }

    refreshDbState();
    showToast('Settings updated', 'success');
  };

  return (
    <AppContext.Provider value={{
      users,
      profiles,
      entries,
      systemSettings,
      setSystemSettings: updateSystemSettingsState,
      initializing,
      
      currentUser,
      selectedAuthorId,
      activeTab,
      selectedEntry,
      editingEntry,
      editoriumActiveTab,
      
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
