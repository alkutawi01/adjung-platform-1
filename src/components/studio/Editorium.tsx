import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  ShieldAlert, 
  User as UserIcon, 
  UserCheck, 
  FileText,
  Layers,
  Lock,
  Globe,
  Mail,
  Send,
  CheckCircle,
  Calendar,
  Plus,
  Sliders,
  TrendingUp,
  Award,
  Search,
  BookOpen,
  ListOrdered,
  Activity,
  AlertTriangle,
  EyeOff
} from 'lucide-react';
import { User, SystemSettings, Entry, BiographyItem, RolePermissions, PolicyDocument, PolicySection } from '../../types';
import { getReadingTime, isArabicText, parseInlineFormatting, getWordCount, stripMarkdown, parseInTheNews, getDeskAccentColor, parseWorldClockHolidays, parseResearchFindings } from '../../utils';
import { SignatureRenderer } from '../desk/SignatureRenderer';
import { resolveDigitalSignature } from '../../utils/signatureResolvers';
import { ArchitectureStudio } from './ArchitectureStudio';
import { ReferenceLibrary } from './ReferenceLibrary';
import { supabaseService as firestoreService } from '../../utils/supabaseService';
import { PlatformIdentityTab } from './tabs/PlatformIdentityTab';
import { FrontpageCurationTab } from './tabs/FrontpageCurationTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { RolesPoliciesTab } from './tabs/RolesPoliciesTab';
import { SystemLogsTab } from './tabs/SystemLogsTab';

const resolveEntryFromInput = (input: string, entries: Entry[]): Entry | undefined => {
  if (!input) return undefined;
  const cleanInput = input.trim();
  
  // Try matching by exact ID
  let match = entries.find(e => e.id === cleanInput);
  if (match) return match;
  
  // Try matching by slug
  match = entries.find(e => e.slug === cleanInput);
  if (match) return match;
  
  // Try parsing as URL to extract slug/id
  try {
    const url = new URL(cleanInput);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      match = entries.find(e => e.id === lastPart || e.slug === lastPart);
      if (match) return match;
    }
  } catch (err) {
    // Ignore
  }
  
  // Fuzzy match by title
  match = entries.find(e => e.title.toLowerCase().includes(cleanInput.toLowerCase()));
  if (match) return match;

  return undefined;
};

interface EditoriumProps {
  currentUser: User;
  users: User[];
  entries: Entry[];
  systemSettings: SystemSettings;
  setSystemSettings: (settings: SystemSettings) => void;
  handleResetDatabase: () => void;
  handleChangeUserRole: (targetUserId: string, newRole: User['role']) => void;
  handleToggleUserSuspension: (targetUserId: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  refreshDbState: () => void;
  setSelectedAuthorId: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setSelectedEntry: (entry: Entry | null) => void;
  setEditingEntry: (entry: Entry | null) => void;
  editoriumActiveTab: 'platform' | 'landing' | 'frontpage' | 'directory' | 'index' | 'editorial' | 'users' | 'roles' | 'moderation' | 'system' | 'dangerZone' | 'architecture' | 'reference-library';
  setEditoriumActiveTab: (tab: any) => void;
}

type EditoriumTab = 
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

import { useAppContext } from '../../context/AppContext';

export function Editorium() {
  const {
    currentUser,
    users,
    entries,
    identities,
    policies,
    logs,
    systemSettings,
    setSystemSettings,
    createNewEntry,
    resetDatabase: handleResetDatabase,
    changeUserRole: handleChangeUserRole,
    toggleUserSuspension: handleToggleUserSuspension,
    showToast,
    refreshDbState,
    setSelectedAuthorId,
    setActiveTab,
    setSelectedEntry,
    setEditingEntry,
    editoriumActiveTab,
    setEditoriumActiveTab,
    inTheNewsGoogleDocText,
    worldClockHolidaysGoogleDocText,
    researchFindingsGoogleDocText,
    inTheNewsGoogleDocStatus,
    worldClockHolidaysGoogleDocStatus,
    researchFindingsGoogleDocStatus,
    requestConfirm
  } = useAppContext();

  const hasPermission = (permissionKey: keyof RolePermissions) => {
    return systemSettings.rolePermissions?.[currentUser.role]?.[permissionKey] ?? false;
  };

  // Sub-states and Search States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [appointEditorQuery, setAppointEditorQuery] = useState('');

  const [selectedPolicyEditId, setSelectedPolicyEditId] = useState(policies[0]?.id || '');
  const [policyEditSections, setPolicyEditSections] = useState<PolicySection[]>(policies[0]?.sections || []);

  useEffect(() => {
    const current = policies.find(p => p.id === selectedPolicyEditId);
    if (current) {
      setPolicyEditSections(JSON.parse(JSON.stringify(current.sections)));
    }
  }, [selectedPolicyEditId, policies]);

  // Filtering board members and general users
  const boardMembers = React.useMemo(() => {
    const list = users.filter(u => u.role === 'Chief Editor' || u.role === 'Editor');
    list.sort((a, b) => {
      const roleOrder: Record<string, number> = {
        'Chief Editor': 1,
        'Editor': 2
      };
      const orderA = roleOrder[a.role] || 3;
      const orderB = roleOrder[b.role] || 3;
      if (orderA !== orderB) return orderA - orderB;
      return a.penName.localeCompare(b.penName);
    });
    return list;
  }, [users]);

  const [selectedBoardMemberId, setSelectedBoardMemberId] = useState<string | null>(
    boardMembers.length > 0 ? boardMembers[0].id : null
  );

  const [selectedUserAccountId, setSelectedUserAccountId] = useState<string | null>(
    users.length > 0 ? users[0].id : null
  );


  // Frontpage curation sub-states synced with systemSettings
  const [featuredScholarId, setFeaturedScholarId] = useState<string>(
    systemSettings.featuredScholarId || (users.find(u => u.role === 'Writer')?.id || (users[0]?.id || ''))
  );
  const [featuredEntryId, setFeaturedEntryId] = useState<string>(
    systemSettings.featuredEntryId || (entries.filter(e => e.status === 'Published')[0]?.id || '')
  );
  const [editorialSelectionIds, setEditorialSelectionIds] = useState<string[]>(
    systemSettings.editorialSelectionIds || []
  );
  const [featuredEssayIds, setFeaturedEssayIds] = useState<string[]>(
    systemSettings.featuredEssayIds || []
  );
  const [featuredNoteIds, setFeaturedNoteIds] = useState<string[]>(
    systemSettings.featuredNoteIds || []
  );
  const [announcementBanner, setAnnouncementBanner] = useState(
    systemSettings.announcementBanner || 'Welcome to the Adjung archive. The independent digital press.'
  );
  const [enableArabicAccent, setEnableArabicAccent] = useState(
    systemSettings.enableArabicAccent ?? true
  );
  const [layoutDensity, setLayoutDensity] = useState<'Standard' | 'Compact' | 'Classical'>(
    systemSettings.layoutDensity || 'Standard'
  );
  const [editorialAddInput, setEditorialAddInput] = useState('');
  const [inTheNewsRawText, setInTheNewsRawText] = useState(systemSettings.inTheNewsText || '');
  const [inTheNewsGoogleDocUrl, setInTheNewsGoogleDocUrl] = useState(systemSettings.inTheNewsGoogleDocUrl || '');
  const [googleDocSyncTimes, setGoogleDocSyncTimes] = useState(systemSettings.googleDocSyncTimes || '12:10, 00:10');
  const [worldClockHolidaysRawText, setWorldClockHolidaysRawText] = useState(systemSettings.worldClockHolidaysText || '');
  const [worldClockHolidaysGoogleDocUrl, setWorldClockHolidaysGoogleDocUrl] = useState(systemSettings.worldClockHolidaysGoogleDocUrl || '');
  const [researchFindingsRawText, setResearchFindingsRawText] = useState(systemSettings.researchFindingsText || '');
  const [researchFindingsGoogleDocUrl, setResearchFindingsGoogleDocUrl] = useState(systemSettings.researchFindingsGoogleDocUrl || '');

  // Sync sub-states when systemSettings changes (e.g. on reset)
  useEffect(() => {
    if (systemSettings.featuredScholarId) setFeaturedScholarId(systemSettings.featuredScholarId);
    if (systemSettings.featuredEntryId) setFeaturedEntryId(systemSettings.featuredEntryId);
    if (systemSettings.editorialSelectionIds) setEditorialSelectionIds(systemSettings.editorialSelectionIds);
    if (systemSettings.featuredEssayIds) setFeaturedEssayIds(systemSettings.featuredEssayIds);
    if (systemSettings.featuredNoteIds) setFeaturedNoteIds(systemSettings.featuredNoteIds);
    if (systemSettings.announcementBanner !== undefined) setAnnouncementBanner(systemSettings.announcementBanner);
    if (systemSettings.enableArabicAccent !== undefined) setEnableArabicAccent(systemSettings.enableArabicAccent);
    if (systemSettings.layoutDensity) setLayoutDensity(systemSettings.layoutDensity);
    if (systemSettings.inTheNewsText !== undefined) setInTheNewsRawText(systemSettings.inTheNewsText);
    if (systemSettings.inTheNewsGoogleDocUrl !== undefined) setInTheNewsGoogleDocUrl(systemSettings.inTheNewsGoogleDocUrl);
    if (systemSettings.googleDocSyncTimes !== undefined) setGoogleDocSyncTimes(systemSettings.googleDocSyncTimes);
    if (systemSettings.worldClockHolidaysText !== undefined) setWorldClockHolidaysRawText(systemSettings.worldClockHolidaysText);
    if (systemSettings.worldClockHolidaysGoogleDocUrl !== undefined) setWorldClockHolidaysGoogleDocUrl(systemSettings.worldClockHolidaysGoogleDocUrl);
    if (systemSettings.researchFindingsText !== undefined) setResearchFindingsRawText(systemSettings.researchFindingsText);
    if (systemSettings.researchFindingsGoogleDocUrl !== undefined) setResearchFindingsGoogleDocUrl(systemSettings.researchFindingsGoogleDocUrl);
  }, [systemSettings]);

  // Sync selected board member if the current selection is no longer valid or is empty
  useEffect(() => {
    if (!selectedBoardMemberId && boardMembers.length > 0) {
      setSelectedBoardMemberId(boardMembers[0].id);
    }
  }, [users, selectedBoardMemberId]);


  const renderGoogleDocConnectionStatus = (status: string, itemsCount: number) => {
    if (status === 'success') {
      return (
        <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 flex items-center gap-1.5 text-[10px] font-mono select-none">
          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
          <span className="font-semibold uppercase tracking-wider">Connection Success</span>
          <span className="text-stone-400 font-sans">•</span>
          <span className="text-stone-500 font-sans">Google Doc is accessible. Loaded {itemsCount} items.</span>
        </div>
      );
    } else if (status === 'failed') {
      return (
        <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-1.5 text-[10px] font-mono select-none">
          <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse"></span>
          <span className="font-semibold uppercase tracking-wider text-[#A02B2D]">Connection Failed</span>
          <span className="text-stone-400 font-sans">•</span>
          <span className="text-stone-500 font-sans">Private or invalid URL. Set General Access to "Anyone with the link can view" to update.</span>
        </div>
      );
    }
    return (
      <div className="mt-1.5 p-2 bg-stone-50 border border-stone-200 rounded text-stone-600 flex items-center gap-1.5 text-[10px] font-mono select-none">
        <span className="w-1.5 h-1.5 bg-stone-400 rounded-full"></span>
        <span className="font-semibold uppercase tracking-wider">No URL Provided</span>
      </div>
    );
  };

  // Handle curation save
  const handleSaveCuration = () => {
    // Validate Featured Articles (3 slots)
    for (let i = 0; i < 3; i++) {
      const val = editorialSelectionIds[i];
      if (val) {
        const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
        if (!resolved) {
          showToast(`Error: Featured Article Slot ${i + 1} ("${val}") cannot be resolved to any published entry.`, 'error');
          return;
        }
        if (resolved.contentType !== 'Essay') {
          showToast(`Error: Featured Article Slot ${i + 1} ("${resolved.title}") must be of type Essay. Found: ${resolved.contentType}.`, 'error');
          return;
        }
      }
    }

    // Validate Featured Entry (1 slot)
    if (featuredEntryId) {
      const resolved = publishedEntries.find(e => e.id === featuredEntryId || e.slug === featuredEntryId);
      if (!resolved) {
        showToast(`Error: Featured Entry ("${featuredEntryId}") cannot be resolved to any published entry.`, 'error');
        return;
      }
      if (resolved.contentType !== 'Essay') {
        showToast(`Error: Featured Entry ("${resolved.title}") must be of type Essay. Found: ${resolved.contentType}.`, 'error');
        return;
      }
    }

    // Validate Featured Essays (3 slots)
    for (let i = 0; i < 3; i++) {
      const val = featuredEssayIds[i];
      if (val) {
        const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
        if (!resolved) {
          showToast(`Error: Featured Essay Slot ${i + 1} ("${val}") cannot be resolved to any published entry.`, 'error');
          return;
        }
        if (resolved.contentType !== 'Essay') {
          showToast(`Error: Featured Essay Slot ${i + 1} ("${resolved.title}") must be of type Essay. Found: ${resolved.contentType}.`, 'error');
          return;
        }
      }
    }

    // Validate Featured Notes (3 slots)
    for (let i = 0; i < 3; i++) {
      const val = featuredNoteIds[i];
      if (val) {
        const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
        if (!resolved) {
          showToast(`Error: Featured Note Slot ${i + 1} ("${val}") cannot be resolved to any published entry.`, 'error');
          return;
        }
        if (resolved.contentType !== 'Note' && resolved.contentType !== 'Essay') {
          showToast(`Error: Featured Note Slot ${i + 1} ("${resolved.title}") must be of type Note or Essay. Found: ${resolved.contentType}.`, 'error');
          return;
        }
      }
    }

    const updatedSettings: SystemSettings = {
      ...systemSettings,
      featuredScholarId,
      featuredEntryId,
      editorialSelectionIds,
      featuredEssayIds,
      featuredNoteIds,
      announcementBanner,
      enableArabicAccent,
      layoutDensity
    };
    setSystemSettings(updatedSettings);

    firestoreService.logAction(`Modified Frontpage Curation: Scholar='${featuredScholarId}', Entry='${featuredEntryId}', Accent=${enableArabicAccent}, Density='${layoutDensity}'.`, currentUser);
    showToast('Frontpage curation settings saved and synchronized.', 'success');
  };

  const handleSaveNewsDigest = () => {
    const updatedSettings = {
      ...systemSettings,
      inTheNewsText: inTheNewsRawText,
      inTheNewsGoogleDocUrl: inTheNewsGoogleDocUrl,
      googleDocSyncTimes: googleDocSyncTimes,
      inTheNewsLastFetched: ''
    };
    setSystemSettings(updatedSettings);
    firestoreService.logAction(`Updated In The News digest and Google Doc URL.`, currentUser);
    showToast('In The News digest saved and synchronized.', 'success');
  };

  const handleDownloadTemplate = () => {
    const templateText = `desk: Astronomy
title: NASA Reviews Long-Term Options for the Hubble Space Telescope
brief: NASA is evaluating whether the Hubble Space Telescope should continue operating into the 2030s, preserving one of astronomy's most influential observatories.
source: Nature
url: https://www.nature.com/articles/d41586-026-02000-x

---

desk: Libraries
title: Library of Congress Announces 2026 National Book Festival
brief: More than eighty authors will participate in the annual festival, highlighting the enduring role of libraries in public scholarship and reading culture.
source: Library of Congress
url: https://newsroom.loc.gov/news/2026-library-of-congress-national-book-festival-features-more-than-80-authors-and-new-programming-to/s/7237e3a3-6b60-437a-bd1b-f15dfc680119
`;

    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(templateText);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'adjung_news_template.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveWorldClockHolidays = () => {
    const updatedSettings = {
      ...systemSettings,
      worldClockHolidaysText: worldClockHolidaysRawText,
      worldClockHolidaysGoogleDocUrl: worldClockHolidaysGoogleDocUrl,
      googleDocSyncTimes: googleDocSyncTimes,
      worldClockLastFetched: ''
    };
    setSystemSettings(updatedSettings);
    firestoreService.logAction(`Updated World Clock Calendars & Holidays digest and Google Doc URL.`, currentUser);
    showToast('World Clock Calendars & Holidays digest saved and synchronized.', 'success');
  };

  const handleDownloadHolidaysTemplate = () => {
    const templateText = `City: New York
Date: 01/01/26
Status: Holiday
Holiday Name: New Year's Day

---

City: Kuala Lumpur
Date: 31/08/26
Status: Holiday
Holiday Name: National Day

---

City: Mecca
Date: 25/01/48
Status: Holiday
Holiday Name: Prophet's Birthday

---

City: Tokyo
Date: 10/07/26
Status: Working
`;
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(templateText);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'adjung_holidays_template.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveResearchFindings = () => {
    const updatedSettings = {
      ...systemSettings,
      researchFindingsText: researchFindingsRawText,
      researchFindingsGoogleDocUrl: researchFindingsGoogleDocUrl,
      googleDocSyncTimes: googleDocSyncTimes,
      researchFindingsLastFetched: ''
    };
    setSystemSettings(updatedSettings);
    firestoreService.logAction(`Updated Research Findings digest and Google Doc URL.`, currentUser);
    showToast('Research Findings digest saved and synchronized.', 'success');
  };

  const handleDownloadFindingsTemplate = () => {
    const templateText = `Finding: [Summarize a real, verifiable finding here — one sentence.]
Source: [Author or Publication, Year]

---

Finding: [A second finding.]
Source: [Author or Publication, Year]

---

Finding: [A third finding.]
Source: [Author or Publication, Year]
`;
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(templateText);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'adjung_findings_template.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper helper to check if text contains Arabic characters
  const isArabicText = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  };

  // Analytics Helpers
  const totalEntries = entries.length;
  const publishedEntries = entries.filter(e => e.status === 'Published');
  const draftEntries = entries.filter(e => e.status === 'Draft');
  const archivedEntries = entries.filter(e => e.status === 'Archived');

  const notesCount = entries.filter(e => e.contentType === 'Note').length;
  const essaysCount = entries.filter(e => e.contentType === 'Essay').length;

  const totalMembers = users.length;

  // Render Sub-navigation tab button
  const renderTabButton = (tab: EditoriumTab, label: string, icon: React.ReactNode) => {
    const isActive = editoriumActiveTab === tab;
    return (
      <button
        type="button"
        onClick={() => setEditoriumActiveTab(tab)}
        className={`w-full text-left px-3 py-2 rounded font-mono text-[10px] uppercase tracking-wider transition flex items-center gap-2 cursor-pointer select-none ${
          isActive
            ? 'bg-adjung-maroon text-white font-semibold shadow-sm'
            : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in text-left px-4">
      
      {/* Header section */}
      <div className="space-y-1 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-2xl font-light text-stone-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-adjung-maroon font-light" />
          Editorium
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
          The administrative workspace and control center of the Adjung Editorial Board
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Sub-navigation */}
        <aside className="md:col-span-3 bg-stone-50 border border-stone-200 rounded p-4 space-y-1 select-none">
          <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 font-bold block mb-2 px-1">Studio Modules</span>
          {renderTabButton('platform', 'Platform', <Database className="w-3.5 h-3.5" />)}
          {renderTabButton('landing', 'Landing', <Globe className="w-3.5 h-3.5" />)}
          {renderTabButton('frontpage', 'Frontpage', <Layers className="w-3.5 h-3.5" />)}
          {renderTabButton('index', 'Publications', <ListOrdered className="w-3.5 h-3.5" />)}
          {renderTabButton('editorial', 'Editorial', <Award className="w-3.5 h-3.5" />)}
          {renderTabButton('users', 'Users', <UserCheck className="w-3.5 h-3.5" />)}
          {renderTabButton('roles', 'Roles', <Lock className="w-3.5 h-3.5" />)}
          {renderTabButton('moderation', 'Moderation', <EyeOff className="w-3.5 h-3.5" />)}
          {renderTabButton('system', 'System', <FileText className="w-3.5 h-3.5" />)}
          {renderTabButton('architecture', 'Architecture', <Sliders className="w-3.5 h-3.5" />)}
          {renderTabButton('reference-library', 'Reference Library', <BookOpen className="w-3.5 h-3.5" />)}
          {renderTabButton('dangerZone', 'Danger Zone', <ShieldAlert className="w-3.5 h-3.5 text-red-700" />)}
        </aside>

        {/* Right Main Content Area */}
        <main className="md:col-span-9 space-y-6">

      {/* ========================================================= */}
      {/* 1. PLATFORM                                               */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'platform' && (
        <PlatformIdentityTab
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          enableArabicAccent={enableArabicAccent}
          setEnableArabicAccent={setEnableArabicAccent}
          announcementBanner={announcementBanner}
          setAnnouncementBanner={setAnnouncementBanner}
          layoutDensity={layoutDensity}
          setLayoutDensity={setLayoutDensity}
          hasPermission={hasPermission}
        />
      )}

      {/* ========================================================= */}
      {/* 2. FRONTPAGE                                              */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'frontpage' && (
        <FrontpageCurationTab
          featuredScholarId={featuredScholarId}
          setFeaturedScholarId={setFeaturedScholarId}
          featuredEntryId={featuredEntryId}
          setFeaturedEntryId={setFeaturedEntryId}
          editorialSelectionIds={editorialSelectionIds}
          setEditorialSelectionIds={setEditorialSelectionIds}
          featuredEssayIds={featuredEssayIds}
          setFeaturedEssayIds={setFeaturedEssayIds}
          featuredNoteIds={featuredNoteIds}
          setFeaturedNoteIds={setFeaturedNoteIds}
          announcementBanner={announcementBanner}
          setAnnouncementBanner={setAnnouncementBanner}
          enableArabicAccent={enableArabicAccent}
          setEnableArabicAccent={setEnableArabicAccent}
          layoutDensity={layoutDensity}
          setLayoutDensity={setLayoutDensity}
          inTheNewsGoogleDocUrl={inTheNewsGoogleDocUrl}
          setInTheNewsGoogleDocUrl={setInTheNewsGoogleDocUrl}
          googleDocSyncTimes={googleDocSyncTimes}
          setGoogleDocSyncTimes={setGoogleDocSyncTimes}
          inTheNewsRawText={inTheNewsRawText}
          setInTheNewsRawText={setInTheNewsRawText}
          inTheNewsGoogleDocText={inTheNewsGoogleDocText}
          inTheNewsGoogleDocStatus={inTheNewsGoogleDocStatus}
          worldClockHolidaysGoogleDocUrl={worldClockHolidaysGoogleDocUrl}
          setWorldClockHolidaysGoogleDocUrl={setWorldClockHolidaysGoogleDocUrl}
          worldClockHolidaysRawText={worldClockHolidaysRawText}
          setWorldClockHolidaysRawText={setWorldClockHolidaysRawText}
          worldClockHolidaysGoogleDocText={worldClockHolidaysGoogleDocText}
          worldClockHolidaysGoogleDocStatus={worldClockHolidaysGoogleDocStatus}
          publishedEntries={publishedEntries}
          users={users}
          handleSaveCuration={handleSaveCuration}
          handleSaveNewsDigest={handleSaveNewsDigest}
          handleSaveWorldClockHolidays={handleSaveWorldClockHolidays}
          handleDownloadTemplate={handleDownloadTemplate}
          handleDownloadHolidaysTemplate={handleDownloadHolidaysTemplate}
          renderGoogleDocConnectionStatus={renderGoogleDocConnectionStatus}
        />
      )}

      {/* ========================================================= */}
      {/* 3. LANDING                                                */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'landing' && (
        <div className="space-y-6">
          {(() => {
            const { items: docItems, errors: docErrors } = parseResearchFindings(researchFindingsGoogleDocText);
            const { items: localItems, errors: localErrors } = parseResearchFindings(researchFindingsRawText);
            const findingsParsedItems = [...docItems, ...localItems];
            const findingsParseErrors = [...docErrors, ...localErrors];
            return (
              <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#1F1F1F]">Landing Page - Research Findings & Deep Reading Digest</h3>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Curate research insights and their academic citations for the portal welcome screen carousel (separated by ---)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadFindingsTemplate}
                      className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded transition cursor-pointer font-semibold"
                    >
                      Download Template (.txt)
                    </button>
                    <span className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-100 text-stone-600 rounded w-fit select-none">Version 1.0 Spec</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Google Doc URL (Source A)</label>
                      <input
                        type="text"
                        value={researchFindingsGoogleDocUrl}
                        onChange={(e) => setResearchFindingsGoogleDocUrl(e.target.value)}
                        className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800 mb-3"
                        placeholder="https://docs.google.com/document/d/.../edit"
                      />
                      {renderGoogleDocConnectionStatus(researchFindingsGoogleDocStatus, docItems.length)}
                    </div>
                    
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Raw Digest Text (Source B)</label>
                      <textarea
                        value={researchFindingsRawText}
                        onChange={(e) => setResearchFindingsRawText(e.target.value)}
                        className="w-full border border-stone-200 p-3 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon min-h-[300px] resize-y bg-[#FAFAF9]"
                        placeholder="Finding: [Summarize a real, verifiable finding here.]&#10;Source: [Author or Publication, Year]&#10;&#10;---&#10;&#10;Finding: [A second finding.]&#10;Source: [Author or Publication, Year]"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleSaveResearchFindings}
                      className="w-full bg-adjung-maroon text-white py-2.5 rounded text-xs font-mono uppercase tracking-wider hover:opacity-95 transition shadow-sm cursor-pointer"
                    >
                      Update Research Findings
                    </button>
                  </div>
                  
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 block font-semibold text-left">Parsed Preview & Status</span>
                      {findingsParseErrors.length > 0 ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 space-y-1.5 text-left">
                          <p className="font-semibold uppercase tracking-wider text-[9px] font-mono text-red-600">● Parser Warnings / Errors</p>
                          <ul className="list-disc list-inside space-y-1 font-mono text-[10px] max-h-[120px] overflow-y-auto">
                            {findingsParseErrors.map((err, i) => (
                              <li key={i}>
                                Item {err.index}: {err.error}
                              </li>
                            ))}
                          </ul>
                          <p className="text-[9px] text-red-400 mt-1">Note: Items with errors are skipped. Landing page will fall back to default findings.</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800 flex items-center gap-2 text-left">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                          <span className="font-mono text-[9px] uppercase font-bold tracking-wider">Digest Status: All Items Valid</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border border-stone-200 rounded p-4 bg-stone-50/60 space-y-3 max-h-[300px] overflow-y-auto text-left">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-semibold block">Valid Items ({findingsParsedItems.length})</span>
                      {findingsParsedItems.length === 0 ? (
                        <p className="font-sans italic text-stone-400 text-xs">No valid items parsed. Add items above.</p>
                      ) : (
                        <div className="space-y-3">
                          {findingsParsedItems.map((item, i) => (
                            <div key={i} className="text-xs border-b border-stone-200 pb-2.5 last:border-b-0 space-y-1.5 text-left">
                              <p className="font-sans text-stone-800 leading-relaxed font-medium">"{item.finding}"</p>
                              <p className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">— {item.source}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DIRECTORY                                              */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'directory' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
            <div className="border-b border-stone-100 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">Directory Configuration & Writer Visibility</h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Configure public listing indices and check writer visibility states</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search writers..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="border border-stone-200 p-2 pl-7 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white w-48"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-3" />
              </div>
            </div>

            {/* Public directory info block */}
            <div className="p-4 bg-adjung-maroon/5 border border-adjung-maroon/20 rounded flex gap-3 text-xs text-stone-700 leading-relaxed font-sans mb-6 select-none text-left">
              <Lock className="w-4 h-4 text-adjung-maroon flex-shrink-0 mt-0.5" />
              <div>
                <strong>Global Writer Visibility:</strong> Standard writers and editorial board members are automatically listed in the public Directory unless suspended. Visitors are never listed in the Directory.
              </div>
            </div>

            {/* List of directory members */}
            <div className="overflow-x-auto border border-stone-200 rounded">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    <th className="p-3.5 pl-4">Writer Name</th>
                    <th className="p-3.5">Subdomain / Domain</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Listing Status</th>
                    <th className="p-3.5 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {users
                    .filter(u => u.role !== 'Visitor')
                    .filter(u => {
                      const q = userSearchQuery.trim().toLowerCase();
                      return !q || u.penName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-stone-50/40 transition text-stone-700">
                        <td className="p-3.5 pl-4 font-sans font-bold text-stone-800 text-sm">
                          {u.penName}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-stone-500">
                          @{u.username}
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            u.role === 'Chief Editor'
                              ? 'bg-adjung-maroon text-[#FDFDFD] font-semibold'
                              : u.role === 'Editor'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200/60'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {u.suspended ? (
                            <span className="text-red-700 font-mono text-[10px] uppercase font-bold bg-red-50 px-2 py-0.5 rounded">Hidden (Suspended)</span>
                          ) : (
                            <span className="text-emerald-700 font-mono text-[10px] uppercase font-bold bg-emerald-50 px-2 py-0.5 rounded">Active & Listed</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuthorId(u.id);
                              setActiveTab('folio');
                              setSelectedEntry(null);
                              setEditingEntry(null);
                            }}
                            className="text-adjung-maroon hover:underline font-mono text-[10px] uppercase tracking-wider"
                          >
                            Open Folio
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. INDEX                                                  */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'index' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Composition breakdown */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h4 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                  <TrendingUp className="w-4 h-4 text-adjung-maroon" /> Format Distribution
                </h4>
                <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">Proportion of entry types in the public indexed archive</p>
              </div>

              <div className="space-y-4 pt-2 text-xs font-sans text-left">
                {/* Notes Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-600 font-semibold">Notes</span>
                    <span className="text-stone-700">{notesCount} ({totalEntries > 0 ? Math.round((notesCount/totalEntries)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-adjung-maroon h-full rounded-full" style={{ width: `${totalEntries > 0 ? (notesCount/totalEntries)*100 : 0}%` }} />
                  </div>
                </div>

                {/* Essays Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-600 font-semibold">Essays</span>
                    <span className="text-stone-700">{essaysCount} ({totalEntries > 0 ? Math.round((essaysCount/totalEntries)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalEntries > 0 ? (essaysCount/totalEntries)*100 : 0}%` }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Index visibility controls */}
            <div className="lg:col-span-6 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h4 className="font-serif text-base font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                  <ListOrdered className="w-4 h-4 text-adjung-maroon" /> Central Index Core Metrics
                </h4>
                <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">Summary metrics and permissions of the central indexed library</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left font-sans text-xs">
                <div className="bg-stone-50 p-4 border border-stone-200 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Total Publications</span>
                  <span className="font-mono text-2xl font-bold text-stone-900 block">{totalEntries}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">All database records</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-200 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Published Feed Items</span>
                  <span className="font-mono text-2xl font-bold text-adjung-maroon block">{publishedEntries.length}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">Live indexed publications</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-200 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Private Drafts</span>
                  <span className="font-mono text-2xl font-bold text-amber-700 block">{draftEntries.length}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">In progress locally</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-200 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Archived Publications</span>
                  <span className="font-mono text-2xl font-bold text-stone-500 block">{archivedEntries.length}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">Stored safely on file</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. EDITORIAL                                              */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'editorial' && (
        <div className="space-y-6">
          {/* Institutional Publishing Control Panel */}
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm text-left">
            <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                  <FileText className="w-4 h-4 text-adjung-maroon" /> Institutional Publishing
                </h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">
                  Publish official platform announcements and reflections from the Editorial Board
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => createNewEntry('Notice')}
                  className="px-4 py-2 bg-[#4a1521] text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-95 transition cursor-pointer border border-adjung-maroon rounded flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Notice
                </button>
                <button
                  type="button"
                  onClick={() => createNewEntry("Editor's Note")}
                  className="px-4 py-2 bg-[#4a1521] text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-95 transition cursor-pointer border border-adjung-maroon rounded flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> + New Editor's Note
                </button>
              </div>
            </div>
          </div>

          {/* Editorial Board Directory - Now at the top, full-width with list and details side-by-side */}
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                  <UserCheck className="w-4 h-4 text-adjung-maroon" /> Editorial Board of Editors
                </h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">Manage administrative roles and access criteria for editors</p>
              </div>

              {/* Appoint Editor Form (Chief Editor only or manageRbac permission) */}
              {hasPermission('manageRbac') && (
                <div className="flex gap-2 items-center text-xs w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Enter Pen Name or Username to appoint..."
                    value={appointEditorQuery}
                    onChange={(e) => setAppointEditorQuery(e.target.value)}
                    className="border border-stone-200 p-1.5 rounded text-[10px] focus:outline-none focus:border-adjung-maroon font-sans bg-white w-full md:w-48"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!appointEditorQuery.trim()) return;
                      const cleanQuery = appointEditorQuery.trim().toLowerCase().replace(/^@/, '');
                      const target = users.find(u => 
                        u.username.toLowerCase() === cleanQuery ||
                        u.penName.toLowerCase() === cleanQuery
                      );
                      if (!target) {
                        showToast('Writer not found in database.', 'error');
                        return;
                      }
                      if (target.role === 'Editor' || target.role === 'Chief Editor') {
                        showToast(`${target.penName} is already on the Editorial Board.`, 'info');
                        return;
                      }
                      handleChangeUserRole(target.id, 'Editor');
                      showToast(`Successfully appointed ${target.penName} as Editor.`, 'success');
                      setAppointEditorQuery('');
                      refreshDbState();
                    }}
                    className="px-3 py-1.5 bg-adjung-maroon text-white font-mono uppercase tracking-wider text-[9px] hover:opacity-95 transition cursor-pointer rounded shrink-0"
                  >
                    + Appoint Editor
                  </button>
                </div>
              )}

              <div className="relative shrink-0">
                <input
                  type="text"
                  placeholder="Search editors..."
                  value={boardSearchQuery}
                  onChange={(e) => setBoardSearchQuery(e.target.value)}
                  className="border border-stone-200 p-1.5 pl-6 rounded text-[10px] focus:outline-none focus:border-adjung-maroon font-sans bg-white w-32"
                />
                <Search className="w-3 h-3 text-stone-400 absolute left-2 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left panel: Board list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {boardMembers
                  .filter(u => {
                    const q = boardSearchQuery.trim().toLowerCase();
                    return !q || u.penName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                  })
                  .map(u => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedBoardMemberId(u.id)}
                      className={`p-3 border rounded transition cursor-pointer flex items-center justify-between hover:bg-stone-50 hover:border-adjung-maroon ${
                        selectedBoardMemberId === u.id
                          ? 'bg-adjung-maroon/[0.03] border-adjung-maroon shadow-sm ring-1 ring-adjung-maroon/20'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="font-sans font-semibold text-stone-800 text-xs block">{u.penName}</span>
                        <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400">{u.role}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Right panel: Editor Details */}
              <div className="bg-stone-50 p-4 rounded border border-stone-200 space-y-4 text-left text-xs">
                {selectedBoardMemberId && users.find(u => u.id === selectedBoardMemberId) ? (
                  (() => {
                    const editor = users.find(u => u.id === selectedBoardMemberId)!;
                    const editorSig = resolveDigitalSignature(editor.id, identities);
                    return (
                      <div className="space-y-3 font-sans">
                        <h4 className="font-serif font-bold text-sm text-stone-800 flex items-center justify-between">
                          <span>{editor.penName}</span>
                          <span className="w-20 h-8 inline-block">
                            <SignatureRenderer
                              representation={editorSig?.representation}
                              strokes={editorSig?.strokes || []}
                              type={editorSig?.type || 'typed'}
                              typedText={editorSig?.typedText || editor.signature}
                              fontFamily={editorSig?.fontFamily}
                              typographyStyle={editorSig?.typographyStyle}
                              penStyle={editorSig?.penStyle}
                              color="#802334"
                            />
                          </span>
                        </h4>
                        <div className="space-y-1 text-stone-600 font-mono text-[10px]">
                          <div>Username: @{editor.username}</div>
                          <div>Email: {editor.email || 'N/A'}</div>
                          <div>Role: <span className="text-adjung-maroon font-bold">{editor.role}</span></div>
                        </div>

                        {/* Actions block */}
                        <div className="pt-2 border-t border-stone-200 flex flex-col gap-1.5">
                          {hasPermission('manageRbac') && editor.id !== currentUser.id && editor.role === 'Editor' && (
                            <button
                              type="button"
                              onClick={() => {
                                requestConfirm(
                                  `Are you sure you want to revoke ${editor.penName}'s editorial status?`,
                                  () => {
                                    handleChangeUserRole(editor.id, 'Writer');
                                    showToast(`Revoked ${editor.penName}'s editorial status. Demoted to Writer.`, 'info');
                                    refreshDbState();
                                  },
                                  { confirmLabel: 'Revoke' }
                                );
                              }}
                              className="bg-white hover:bg-red-50 border border-red-200 text-red-700 py-1.5 px-3 rounded text-[10px] font-mono uppercase tracking-wider transition text-center cursor-pointer mb-1"
                            >
                              Revoke Editor Status
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuthorId(editor.id);
                              setActiveTab('folio');
                              setSelectedEntry(null);
                              setEditingEntry(null);
                            }}
                            className="bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 py-1.5 px-3 rounded text-[10px] font-mono uppercase tracking-wider transition text-center"
                          >
                            View Folio
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAuthorId(editor.id);
                              setActiveTab('bio');
                              setSelectedEntry(null);
                              setEditingEntry(null);
                            }}
                            className="bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 py-1.5 px-3 rounded text-[10px] font-mono uppercase tracking-wider transition text-center"
                          >
                            View Biography
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="italic text-stone-400 py-12 text-center font-sans">No editor selected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Central Editorial Policy & Platform Policies Editor - Now at the bottom */}
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-2">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                <Sliders className="w-4 h-4 text-adjung-maroon" /> Central Editorial Policy
              </h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">Define governance criteria and guidelines of the digital scriptorium</p>
            </div>

            <div className="space-y-6 text-xs font-sans text-left">
              <div className="border-b border-stone-100 pb-4">
                <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Editorial Policy and Press Charter</label>
                <textarea
                  value={systemSettings.editorialPolicy}
                  disabled={!hasPermission('manageSettings')}
                  onChange={(e) => {
                    const updated = { ...systemSettings, editorialPolicy: e.target.value };
                    setSystemSettings(updated);
                  }}
                  className={`w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon text-xs leading-relaxed min-h-[100px] ${
                    !hasPermission('manageSettings') ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : 'bg-white text-stone-900'
                  }`}
                  placeholder="Enter policy text..."
                />
                <span className="text-stone-400 text-[9px] font-mono mt-1 block">Renders a verified policy overview displayed in writer registration steps and guidelines.</span>
              </div>

              {/* Platform Policies Editor */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-stone-100 pb-1.5">
                  <h4 className="font-serif text-sm font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                    <Settings className="w-3.5 h-3.5 text-adjung-maroon" /> Platform Policies Manager
                  </h4>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-stone-400 mt-0.5">Edit sections of the platform constitution and policies</p>
                </div>

                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-1">Select Policy Document</label>
                  <select
                    value={selectedPolicyEditId}
                    onChange={(e) => setSelectedPolicyEditId(e.target.value)}
                    className="w-full border border-stone-200 p-1.5 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white"
                  >
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {policyEditSections.map((section, sIdx) => (
                    <div key={section.id} className="p-2.5 border border-stone-100 bg-stone-50/60 rounded space-y-2 text-left">
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400">Section {sIdx + 1} Title</span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = [...policyEditSections];
                          updated[sIdx].title = e.target.value;
                          setPolicyEditSections(updated);
                        }}
                        placeholder="Section Title"
                        className="w-full border border-stone-200 p-1.5 rounded focus:outline-none focus:border-adjung-maroon text-xs font-semibold bg-white"
                      />
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400">Section {sIdx + 1} Content</span>
                      <textarea
                        value={section.content}
                        onChange={(e) => {
                          const updated = [...policyEditSections];
                          updated[sIdx].content = e.target.value;
                          setPolicyEditSections(updated);
                        }}
                        placeholder="Section Content"
                        rows={3}
                        className="w-full border border-stone-200 p-1.5 rounded focus:outline-none focus:border-adjung-maroon text-xs leading-relaxed bg-white"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const p = policies.find(x => x.id === selectedPolicyEditId);
                    if (p) {
                      const updatedPolicy = {
                        ...p,
                        sections: policyEditSections,
                        lastUpdated: new Date().toISOString()
                      };
                      firestoreService.savePolicy(updatedPolicy)
                        .then(() => {
                          showToast(`Policy '${p.title}' successfully updated.`, 'success');
                          refreshDbState();
                        })
                        .catch(() => showToast('Failed to save policy.', 'error'));
                    }
                  }}
                  className="w-full py-2 bg-adjung-maroon text-white font-mono uppercase tracking-wider text-[9px] hover:opacity-95 transition cursor-pointer"
                >
                  Save Policy Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. USERS                                                  */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'users' && (
        <UserManagementTab
          currentUser={currentUser}
          users={users}
          handleToggleUserSuspension={handleToggleUserSuspension}
          showToast={showToast}
          refreshDbState={refreshDbState}
          hasPermission={hasPermission}
        />
      )}

      {/* ========================================================= */}
      {/* 7. ROLES (RBAC MATRIX)                                    */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'roles' && (
        <RolesPoliciesTab
          currentUser={currentUser}
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          showToast={showToast}
          refreshDbState={refreshDbState}
          hasPermission={hasPermission}
        />
      )}

      {/* ========================================================= */}
      {/* 8. MODERATION                                             */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
            <div className="border-b border-stone-100 pb-4 mb-5 text-left space-y-1">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-adjung-maroon" />
                Content Moderation Board
              </h3>
              <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Review reported entries and enforce community policy guidelines
              </p>
            </div>

            {entries.filter(e => e.underReview).length === 0 ? (
              <div className="py-12 text-center select-none">
                <EyeOff className="w-12 h-12 text-adjung-maroon mx-auto mb-3" />
                <span className="font-sans italic text-stone-700 block text-base font-semibold">Clean Compliance / Safe</span>
                <p className="text-stone-500 text-xs font-sans max-w-lg mx-auto leading-relaxed mt-2">
                  There are currently no active content infractions, reports, or entries under review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.filter(e => e.underReview).map(entry => {
                  const author = users.find(u => u.id === entry.authorId);
                  return (
                    <div key={entry.id} className="p-4 border border-amber-200 bg-amber-50/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded">
                            {entry.contentType}
                          </span>
                          <span className="text-xs font-mono text-stone-400">
                            ID: {entry.id}
                          </span>
                        </div>
                        <h4 className="font-sans font-bold text-stone-900 text-sm">
                          {entry.title || '(Untitled Note)'}
                        </h4>
                        <div className="text-xs text-stone-500 font-sans">
                          By: <strong className="text-stone-700 font-sans">{author?.penName || entry.publisher || 'Unknown'}</strong> (@{author?.username || 'anonymous'})
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            requestConfirm("Are you sure you want to restore this article?", () => {
                              const updatedEntry = {
                                ...entry,
                                underReview: false
                              };

                              firestoreService.saveEntry(updatedEntry)
                                .then(() => {
                                  firestoreService.logAction(
                                    `Dismissed report and restored entry "${entry.title}" (ID: ${entry.id}).`,
                                    currentUser
                                  ).then(() => refreshDbState());
                                  showToast('Report dismissed. Article returned to normal status.', 'success');
                                });
                            }, { confirmLabel: 'Restore', danger: false });
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono uppercase rounded transition cursor-pointer border border-stone-200"
                        >
                          Restore Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            requestConfirm("Are you sure you want to unlist this article from public display?", () => {
                              const updatedEntry = {
                                ...entry,
                                visibility: 'Private' as const,
                                underReview: false
                              };

                              firestoreService.saveEntry(updatedEntry)
                                .then(() => {
                                  firestoreService.logAction(
                                    `Unlisted entry "${entry.title}" (ID: ${entry.id}) due to report violation.`,
                                    currentUser
                                  ).then(() => refreshDbState());
                                  showToast('Entry has been unlisted (visibility changed to Private).', 'info');
                                });
                            }, { confirmLabel: 'Unlist' });
                          }}
                          className="px-3 py-1.5 bg-adjung-maroon hover:bg-[#962e41] text-white text-xs font-mono uppercase rounded transition cursor-pointer"
                        >
                          Unlist & Hide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. SYSTEM (LOGS)                                          */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'system' && (
        <SystemLogsTab
          currentUser={currentUser}
          logs={logs}
          showToast={showToast}
          refreshDbState={refreshDbState}
          hasPermission={hasPermission}
        />
      )}

      {/* ========================================================= */}
      {/* 9.5. ARCHITECTURE STUDIO WORKSPACE                        */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-[#FDFDFD] border border-stone-200 rounded p-6 shadow-sm">
            <div className="border-b border-stone-100 pb-3 mb-6">
              <h3 className="font-serif text-lg font-semibold text-stone-950">Architecture Studio</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Platform topology blueprint and digital twin workspace</p>
            </div>
            <div className="w-full">
              <ArchitectureStudio />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9.6. REFERENCE LIBRARY                                    */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'reference-library' && (
        <div className="space-y-6">
          <div className="bg-[#FDFDFD] border border-stone-200 rounded p-6 shadow-sm">
            <div className="border-b border-stone-100 pb-3 mb-6">
              <h3 className="font-serif text-lg font-semibold text-stone-950">Reference Library</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Canonical publications standards and layout specifications</p>
            </div>
            <ReferenceLibrary entries={entries} users={users} />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. DANGER ZONE                                           */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'dangerZone' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-red-50/40 border border-red-200 rounded p-6 text-left space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-red-800 flex items-center gap-2 select-none">
              <ShieldAlert className="w-5 h-5 text-red-700" /> Danger Zone & Platform Resets
            </h3>
            <p className="font-sans text-xs text-stone-600 leading-relaxed">
              This command deletes all local database entries, profiles, timeline milestones, and user settings, resetting the environment back to the clean pre-seeded academic template. This action cannot be undone.
            </p>

            <div className="p-3.5 bg-white border border-red-200 rounded space-y-2 text-[11px] text-stone-600 leading-normal font-sans">
              <strong className="text-red-700 uppercase block font-mono text-[9px] tracking-wider">Warning of Destructive Operation:</strong>
              <div>• Clears all draft entries and publications.</div>
              <div>• Demotes or removes added custom users and guest authors.</div>
              <div>• Re-seeds default system accounts.</div>
            </div>

            <button
              type="button"
              disabled={!hasPermission('manageSettings')}
              onClick={() => {
                requestConfirm(
                  'WARNING: Are you absolutely sure you want to reset the entire database? This deletes all custom entries and profiles.',
                  () => {
                    handleResetDatabase();
                    showToast('Database reset to pre-seeded academic templates.', 'info');
                  },
                  { title: 'Danger Zone', confirmLabel: 'Reset Everything' }
                );
              }}
              className={`px-4 py-2.5 rounded text-xs font-mono uppercase tracking-wider transition shadow-sm ${
                !hasPermission('manageSettings')
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-red-700 text-[#FDFDFD] hover:bg-red-800 cursor-pointer font-bold'
              }`}
            >
              Reset Database
            </button>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  );
}
