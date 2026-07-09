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
  Sparkles,
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
import { db } from '../../db/mockDb';
import { getReadingTime, isArabicText, parseInlineFormatting, getWordCount, stripMarkdown } from '../../utils';
import { SignatureRenderer } from '../desk/SignatureRenderer';
import { ArchitectureStudio } from './ArchitectureStudio';
import { ReferenceLibrary } from './ReferenceLibrary';

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
  editoriumActiveTab: 'platform' | 'frontpage' | 'directory' | 'index' | 'editorial' | 'users' | 'roles' | 'moderation' | 'system' | 'dangerZone' | 'architecture' | 'reference-library';
  setEditoriumActiveTab: (tab: any) => void;
}

type EditoriumTab = 
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

import { useAppContext } from '../../context/AppContext';

export function Editorium() {
  const {
    currentUser,
    users,
    entries,
    systemSettings,
    setSystemSettings,
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
    setEditoriumActiveTab
  } = useAppContext();

  const hasPermission = (permissionKey: keyof RolePermissions) => {
    return systemSettings.rolePermissions?.[currentUser.role]?.[permissionKey] ?? false;
  };

  // Sub-states and Search States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [boardSearchQuery, setBoardSearchQuery] = useState('');

  const [selectedPolicyEditId, setSelectedPolicyEditId] = useState(db.getPolicies()[0]?.id || '');
  const [policyEditSections, setPolicyEditSections] = useState<PolicySection[]>(db.getPolicies()[0]?.sections || []);

  useEffect(() => {
    const policies = db.getPolicies();
    const current = policies.find(p => p.id === selectedPolicyEditId);
    if (current) {
      setPolicyEditSections(JSON.parse(JSON.stringify(current.sections)));
    }
  }, [selectedPolicyEditId, users]);

  // Filtering board members and general users
  const boardMembers = users.filter(u => u.role === 'Chief Editor' || u.role === 'Editor');
  const [selectedBoardMemberId, setSelectedBoardMemberId] = useState<string | null>(
    boardMembers.length > 0 ? boardMembers[0].id : null
  );

  const [selectedUserAccountId, setSelectedUserAccountId] = useState<string | null>(
    users.length > 0 ? users[0].id : null
  );

  // Invitation form states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    signupUrl: string;
    emailBody: string;
  } | null>(null);

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
  const [announcementBanner, setAnnouncementBanner] = useState(
    systemSettings.announcementBanner || 'Welcome to the Adjung scholarly archive. The independent digital press.'
  );
  const [enableArabicAccent, setEnableArabicAccent] = useState(
    systemSettings.enableArabicAccent ?? true
  );
  const [layoutDensity, setLayoutDensity] = useState<'Standard' | 'Compact' | 'Classical'>(
    systemSettings.layoutDensity || 'Standard'
  );
  const [editorialAddInput, setEditorialAddInput] = useState('');

  // Sync sub-states when systemSettings changes (e.g. on reset)
  useEffect(() => {
    if (systemSettings.featuredScholarId) setFeaturedScholarId(systemSettings.featuredScholarId);
    if (systemSettings.featuredEntryId) setFeaturedEntryId(systemSettings.featuredEntryId);
    if (systemSettings.editorialSelectionIds) setEditorialSelectionIds(systemSettings.editorialSelectionIds);
    if (systemSettings.announcementBanner !== undefined) setAnnouncementBanner(systemSettings.announcementBanner);
    if (systemSettings.enableArabicAccent !== undefined) setEnableArabicAccent(systemSettings.enableArabicAccent);
    if (systemSettings.layoutDensity) setLayoutDensity(systemSettings.layoutDensity);
  }, [systemSettings]);

  // Sync selected board member if the current selection is no longer valid or is empty
  useEffect(() => {
    if (!selectedBoardMemberId && boardMembers.length > 0) {
      setSelectedBoardMemberId(boardMembers[0].id);
    }
  }, [users, selectedBoardMemberId]);

  // Handle invitation form submission
  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const signupUrl = `https://adjung.com/invite/register?name=${encodeURIComponent(inviteName.trim())}&email=${encodeURIComponent(inviteEmail.trim())}`;
    const emailBody = `Salutations ${inviteName.trim()},\n\nYou are cordially invited by the Chief Editor of Adjung to join our publishing platform as an independent Writer.\n\nName: ${inviteName.trim()}\nEmail: ${inviteEmail.trim()}\n${inviteMessage.trim() ? `\nMessage from the Chief Editor:\n"${inviteMessage.trim()}"\n` : ''}\nTo accept this invitation and initialize your personal scholarly Folio, please click the link below to choose your Username and signature:\n${signupUrl}\n\nRespectfully,\nEditorial Board of Adjung`;

    setGeneratedInvitation({
      signupUrl,
      emailBody
    });

    // Log the invitation
    db.addLog(`Generated scholarly invitation for '${inviteName.trim()}' (${inviteEmail.trim()}).`, currentUser.penName, currentUser.role);
    refreshDbState();

    setInviteName('');
    setInviteEmail('');
    setInviteMessage('');
    showToast(`Invitation created for ${inviteName.trim()}`, 'success');
  };

  // Handle curation save
  const handleSaveCuration = () => {
    const updatedSettings: SystemSettings = {
      ...systemSettings,
      featuredScholarId,
      featuredEntryId,
        editorialSelectionIds,
      announcementBanner,
      enableArabicAccent,
      layoutDensity
    };
    setSystemSettings(updatedSettings);
    db.updateSystemSettings(updatedSettings);

    db.addLog(`Modified Frontpage Curation: Scholar='${featuredScholarId}', Entry='${featuredEntryId}', Accent=${enableArabicAccent}, Density='${layoutDensity}'.`, currentUser.penName, currentUser.role);
    refreshDbState();
    showToast('Frontpage curation settings saved and synchronized.', 'success');
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
  const articlesCount = entries.filter(e => e.contentType === 'Article').length;

  const totalMembers = users.length;

  // Render Sub-navigation tab button
  const renderTabButton = (tab: EditoriumTab, label: string, icon: React.ReactNode) => {
    const isActive = editoriumActiveTab === tab;
    return (
      <button
        type="button"
        onClick={() => setEditoriumActiveTab(tab)}
        className={`px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider transition border-b-2 -mb-px flex items-center gap-1.5 select-none cursor-pointer flex-shrink-0 ${
          isActive
            ? 'border-adjung-maroon text-adjung-maroon font-semibold'
            : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-200'
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-left">
      
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

      {/* Editorium 10-tab Sub-navigation Bar */}
      <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-none gap-1 bg-stone-50/50 p-1 rounded-sm">
        {renderTabButton('platform', 'Platform', <Database className="w-3.5 h-3.5" />)}
        {renderTabButton('frontpage', 'Frontpage', <Layers className="w-3.5 h-3.5" />)}
        {renderTabButton('directory', 'Directory', <Search className="w-3.5 h-3.5" />)}
        {renderTabButton('index', 'Index', <ListOrdered className="w-3.5 h-3.5" />)}
        {renderTabButton('editorial', 'Editorial', <Award className="w-3.5 h-3.5" />)}
        {renderTabButton('users', 'Users', <UserCheck className="w-3.5 h-3.5" />)}
        {renderTabButton('roles', 'Roles', <Lock className="w-3.5 h-3.5" />)}
        {renderTabButton('moderation', 'Moderation', <EyeOff className="w-3.5 h-3.5" />)}
        {renderTabButton('system', 'System', <FileText className="w-3.5 h-3.5" />)}
        {renderTabButton('architecture', 'Architecture', <Sliders className="w-3.5 h-3.5" />)}
        {renderTabButton('reference-library', 'Reference Library', <BookOpen className="w-3.5 h-3.5" />)}
        {renderTabButton('dangerZone', 'Danger Zone', <ShieldAlert className="w-3.5 h-3.5 text-red-700" />)}
      </div>

      {/* ========================================================= */}
      {/* 1. PLATFORM                                               */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'platform' && (
        <div className="space-y-6">
          <div className="bg-[#FDFDFD] border border-stone-200 rounded p-6 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-stone-950">Platform Identity & Configuration</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Configure global press branding, frontpage styling, and metadata settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              {/* Academic Affiliation */}
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Academic Affiliation</label>
                  <input
                    type="text"
                    value={systemSettings.academicAffiliation}
                    disabled={!hasPermission('manageSettings')}
                    onChange={(e) => {
                      const updated = { ...systemSettings, academicAffiliation: e.target.value };
                      setSystemSettings(updated);
                      db.updateSystemSettings(updated);
                    }}
                    className={`w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon text-xs ${
                      !hasPermission('manageSettings') ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : 'bg-white text-stone-900'
                    }`}
                  />
                  <span className="text-stone-400 text-[9px] font-mono mt-1 block">Establishes the host educational institution displayed in footnotes and headers.</span>
                </div>

                {/* Accent Color Selection */}
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">System-Wide Accent Theme</label>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-adjung-maroon border border-adjung-maroon/20 inline-block" />
                    <span className="font-mono text-stone-700 uppercase">Adjung Maroon (#802334)</span>
                    <span className="text-stone-400 font-mono text-[9px] bg-stone-100 px-1.5 py-0.5 rounded ml-auto">ESTABLISHED BRAND</span>
                  </div>
                </div>

                {/* Calligraphic tag checkbox */}
                <div className="pt-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="arabic-accent-cb"
                      checked={enableArabicAccent}
                      onChange={(e) => setEnableArabicAccent(e.target.checked)}
                      className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer mt-0.5"
                    />
                    <div>
                      <label htmlFor="arabic-accent-cb" className="font-mono text-[10px] uppercase tracking-wider text-stone-600 font-semibold cursor-pointer">
                        Enable Calligraphic Script Tag Seals
                      </label>
                      <span className="text-stone-400 text-[9px] font-mono block mt-0.5 leading-normal">
                        Highlights Arabic, Ottoman Turkish, or Jawi script publications with beautiful calligraphic tag stamps on the Frontpage.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Frontpage settings */}
              <div className="space-y-4">
                {/* Banner text */}
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Header Announcement Banner Text</label>
                  <textarea
                    value={announcementBanner}
                    onChange={(e) => setAnnouncementBanner(e.target.value)}
                    className="w-full border border-stone-200 p-2.5 rounded bg-white text-xs leading-relaxed focus:outline-none focus:border-adjung-maroon min-h-[70px]"
                    placeholder="Enter welcome or alert text displayed on the Frontpage..."
                  />
                  <span className="text-stone-400 text-[9px] font-mono mt-1 block">Renders a high-density banner at the top of the Frontpage for general announcements.</span>
                </div>

                {/* Layout density slider/buttons */}
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Frontpage Grid Layout Density</span>
                  <div className="flex items-center gap-2">
                    {(['Standard', 'Compact', 'Classical'] as const).map(density => (
                      <button
                        key={density}
                        type="button"
                        onClick={() => setLayoutDensity(density)}
                        className={`px-3 py-1.5 font-mono text-[10px] rounded transition ${
                          layoutDensity === density
                            ? 'bg-adjung-maroon text-white font-bold shadow-sm'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        {density} Grid
                      </button>
                    ))}
                  </div>
                  <span className="text-stone-400 text-[9px] font-mono mt-1.5 block">Alters card spacing, margin parameters, and typographic scaling of the home scriptorium feed.</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Block */}
            <div className="w-full bg-stone-50 border border-stone-200 p-4 rounded text-xs text-stone-600 leading-normal font-serif flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Brand Status: Active & Operational.</strong> Changes to the academic affiliation or tag seals are immediately written to the local storage mock database and synchronized across all open browser context views.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FRONTPAGE                                              */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'frontpage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Curation Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-serif text-lg font-semibold text-stone-950">Frontpage Curation & Pinning</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Promote featured research or scholars to the main public landing feed</p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Highlight Scholar */}
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Curated Scholar of the Month</label>
                <select
                  value={featuredScholarId}
                  onChange={(e) => setFeaturedScholarId(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 rounded bg-white font-serif text-sm focus:outline-none focus:border-adjung-maroon cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.penName} (@{u.username} — {u.role})
                    </option>
                  ))}
                </select>
                <span className="text-stone-400 text-[9px] font-mono mt-1 block">Places an editorial focus box and calligraphic seal of this scholar on the public greeting catalog.</span>
              </div>

                <div className="pt-4 border-t border-stone-200">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-2">Editorial Selections (Max 10)</label>
                  
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Paste entry UUID (e.g. entry-zayd-1)..."
                      value={editorialAddInput}
                      onChange={(e) => setEditorialAddInput(e.target.value)}
                      className="flex-1 border border-stone-200 p-2 rounded bg-white font-mono text-xs focus:outline-none focus:border-adjung-maroon"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = editorialAddInput.trim();
                        if (!val) return;
                        if (editorialSelectionIds.includes(val)) {
                          showToast('Entry is already in the list.', 'info');
                          return;
                        }
                        const exists = publishedEntries.some(e => e.id === val);
                        if (exists) {
                          if (editorialSelectionIds.length < 10) {
                            setEditorialSelectionIds([...editorialSelectionIds, val]);
                            setEditorialAddInput('');
                          } else {
                            showToast('Maximum of 10 selections reached.', 'error');
                          }
                        } else {
                          showToast('Invalid UUID: Entry not found or is in draft.', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-stone-100 border border-stone-300 rounded text-xs font-mono uppercase hover:bg-stone-200 transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {editorialSelectionIds.map((id, idx) => {
                      const ent = publishedEntries.find(e => e.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between bg-stone-50 p-2 rounded border border-stone-200/50">
                          <div className="text-left font-serif text-xs">
                            <span className="font-mono text-[9px] bg-stone-200/60 px-1.5 py-0.5 rounded mr-2 font-bold text-stone-500">{id}</span>
                            <span className="text-stone-800 font-semibold">{ent ? ent.title : 'Untitled / Deleted'}</span>
                            {ent && <span className="text-stone-400 font-sans text-[10px] ml-2">({ent.contentType})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditorialSelectionIds(editorialSelectionIds.filter(x => x !== id))}
                            className="text-red-500 text-xs font-mono uppercase hover:underline ml-2 flex-shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <span className="text-stone-400 text-[9px] font-mono mt-2 block">
                    Curated entries displayed on the Frontpage under "Editorial Selection". Order is preserved. 
                    Tip: Copy UUIDs from the <a href="#/index" target="_blank" rel="noopener noreferrer" className="text-adjung-maroon hover:underline font-semibold">Publication Index (#/index)</a>.
                  </span>
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Apex Pinned Publication of the Week (Featured Entry UUID)</label>
                  <input
                    type="text"
                    value={featuredEntryId}
                    placeholder="Enter entry UUID (e.g. entry-zayd-1)..."
                    onChange={(e) => setFeaturedEntryId(e.target.value.trim())}
                    className="w-full border border-stone-200 p-2.5 rounded bg-white font-mono text-xs focus:outline-none focus:border-adjung-maroon"
                  />
                  {(() => {
                    const match = publishedEntries.find(e => e.id === featuredEntryId);
                    if (!featuredEntryId) return null;
                    if (match) {
                      return (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded flex items-center gap-2 text-left">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                          <span className="font-sans text-[10px] text-emerald-800">
                            <strong>Found {match.contentType}:</strong> "{match.title || 'Untitled'}" by {users.find(u => u.id === match.authorId)?.penName || 'Unknown'}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded flex items-center gap-2 text-left">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping"></span>
                          <span className="font-sans text-[10px] text-amber-800">
                            No published entry found with ID/UUID "{featuredEntryId}". Please paste a valid published entry ID.
                          </span>
                        </div>
                      );
                    }
                  })()}
                  <span className="text-stone-400 text-[9px] font-mono mt-1 block">Pins this publication at the absolute pinnacle of the public landing archive timeline.</span>
                </div>

              <button
                type="button"
                onClick={handleSaveCuration}
                className="w-full bg-adjung-maroon text-white py-2.5 rounded text-xs font-mono uppercase tracking-wider hover:opacity-90 transition shadow-sm mt-4 cursor-pointer"
              >
                Apply Curation Settings
              </button>
            </div>
          </div>

          {/* Live Mockup */}
          <div className="lg:col-span-5 space-y-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 block font-semibold text-left">Frontpage Curation Mockup</span>
            <div className="bg-[#FDFDFD] border border-stone-300 p-5 rounded scholarly-border shadow-inner text-left space-y-4 select-none relative overflow-hidden">
              <div className="border-b pb-2 flex justify-between items-center text-[8px] font-mono text-stone-400">
                <span>ADJUNG SCHOLARLY PRESS</span>
                <span>LAYOUT: {layoutDensity.toUpperCase()}</span>
              </div>

              {announcementBanner && (
                <div className="bg-adjung-maroon/5 border-l-2 border-adjung-maroon p-2 text-[9px] text-stone-600 italic">
                  "{announcementBanner}"
                </div>
              )}

              {/* Scholar Preview */}
              <div className="bg-stone-50 border border-stone-200 p-3 rounded space-y-1.5 relative">
                <span className="font-mono text-[7px] uppercase tracking-wider bg-adjung-maroon text-white px-1 py-0.2 rounded font-bold">Scholar Highlight</span>
                <div className="absolute top-2 right-2 font-signature text-xl text-adjung-maroon/20">
                  {users.find(u => u.id === featuredScholarId)?.signature || 'Seal'}
                </div>
                <h5 className="font-serif font-bold text-[#111111] text-xs">
                  {users.find(u => u.id === featuredScholarId)?.penName || 'Scholar Name'}
                </h5>
                <p className="font-serif italic text-[10px] text-stone-500 leading-normal">
                  {users.find(u => u.id === featuredScholarId)?.bioSummary || 'No bio on file for this scholar.'}
                </p>
              </div>

              {/* Article Preview */}
              <div className="border-t pt-3 space-y-1">
                <span className="font-mono text-[7px] uppercase tracking-wider text-stone-400 font-semibold block">Apex Pinned Publication</span>
                <h5 className="font-serif font-bold text-stone-800 text-xs line-clamp-1">
                  {(() => {
                    const ent = publishedEntries.find(e => e.id === featuredEntryId);
                    if (!ent) return 'None Selected';
                    return ent.title ? parseInlineFormatting(ent.title) : ent.content.slice(0, 30) + '...';
                  })()}
                </h5>
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-stone-400">
                  <span>{publishedEntries.find(e => e.id === featuredEntryId)?.contentType || 'Article'}</span>
                  <span>•</span>
                  <span>By {users.find(u => u.id === (publishedEntries.find(e => e.id === featuredEntryId)?.authorId || ''))?.penName || 'Scholar'}</span>
                  {enableArabicAccent && <span className="text-[#802334] font-semibold">AR-TAG</span>}
                </div>
              </div>
            </div>
          </div>
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
                <h3 className="font-serif text-lg font-semibold text-stone-900">Directory Configuration & Scholar Visibility</h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Configure public listing indices and check scholar visibility states</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search scholars..."
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
                <strong>Global Scholar Visibility:</strong> Standard writers and editorial board members are automatically listed in the public Directory unless suspended. Visitors are never listed in the Directory.
              </div>
            </div>

            {/* List of directory members */}
            <div className="overflow-x-auto border border-stone-200 rounded">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                    <th className="p-3.5 pl-4">Scholar Name</th>
                    <th className="p-3.5">System Username</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Listing Status</th>
                    <th className="p-3.5 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {users
                    .filter(u => u.role !== 'Visitor')
                    .filter(u => {
                      const q = userSearchQuery.trim().toLowerCase();
                      return !q || u.penName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                    })
                    .map(u => (
                      <tr key={u.id} className="hover:bg-stone-50/40 transition text-stone-700">
                        <td className="p-3.5 pl-4 font-serif font-bold text-stone-850 text-sm">
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
                              ? 'bg-amber-100 text-amber-900 border border-amber-200/50'
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
                  <TrendingUp className="w-4 h-4 text-adjung-maroon" /> Scholarly Format Distribution
                </h4>
                <p className="text-stone-500 text-[10px] font-mono uppercase tracking-wider mt-0.5">Proportion of entry types in the public indexed archive</p>
              </div>

              <div className="space-y-4 pt-2 text-xs font-sans text-left">
                {/* Notes Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-600 font-semibold">Philosophical Notes</span>
                    <span className="text-stone-700">{notesCount} ({totalEntries > 0 ? Math.round((notesCount/totalEntries)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-adjung-maroon h-full rounded-full" style={{ width: `${totalEntries > 0 ? (notesCount/totalEntries)*100 : 0}%` }} />
                  </div>
                </div>

                {/* Essays Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-600 font-semibold">Discursive Essays</span>
                    <span className="text-stone-700">{essaysCount} ({totalEntries > 0 ? Math.round((essaysCount/totalEntries)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalEntries > 0 ? (essaysCount/totalEntries)*100 : 0}%` }} />
                  </div>
                </div>

                {/* Articles Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-stone-600 font-semibold">Marginalia Articles</span>
                    <span className="text-stone-700">{articlesCount} ({totalEntries > 0 ? Math.round((articlesCount/totalEntries)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-stone-800 h-full rounded-full" style={{ width: `${totalEntries > 0 ? (articlesCount/totalEntries)*100 : 0}%` }} />
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
                <div className="bg-stone-50 p-4 border border-stone-150 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Total Publications</span>
                  <span className="font-serif text-2xl font-bold text-stone-900 block">{totalEntries}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">All database records</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-150 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Published Feed Items</span>
                  <span className="font-serif text-2xl font-bold text-adjung-maroon block">{publishedEntries.length}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">Live indexed publications</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-150 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Private Drafts</span>
                  <span className="font-serif text-2xl font-bold text-amber-700 block">{draftEntries.length}</span>
                  <span className="text-stone-500 text-[10px] block mt-1">In progress locally</span>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-150 rounded space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block">Archived Publications</span>
                  <span className="font-serif text-2xl font-bold text-stone-500 block">{archivedEntries.length}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Editorial policy input */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
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
                    db.updateSystemSettings(updated);
                  }}
                  className={`w-full border border-stone-200 p-2.5 rounded focus:outline-none focus:border-adjung-maroon text-xs leading-relaxed min-h-[100px] ${
                    !hasPermission('manageSettings') ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : 'bg-white text-stone-900'
                  }`}
                  placeholder="Enter policy text..."
                />
                <span className="text-stone-400 text-[9px] font-mono mt-1 block">Renders a verified policy overview displayed in scholar registration steps and guidelines.</span>
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
                    {db.getPolicies().map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {policyEditSections.map((section, sIdx) => (
                    <div key={section.id} className="p-2.5 border border-stone-100 bg-stone-50/50 rounded space-y-2 text-left">
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
                    const p = db.getPolicies().find(x => x.id === selectedPolicyEditId);
                    if (p) {
                      const updatedPolicy = {
                        ...p,
                        sections: policyEditSections,
                        lastUpdated: new Date().toISOString()
                      };
                      db.savePolicy(updatedPolicy);
                      showToast(`Policy '${p.title}' successfully updated.`, 'success');
                      refreshDbState();
                    }
                  }}
                  className="w-full py-2 bg-[#802334] text-white font-mono uppercase tracking-wider text-[9px] hover:opacity-95 transition cursor-pointer"
                >
                  Save Policy Changes
                </button>
              </div>
            </div>
          </div>

          {/* Editorial Board Directory */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
                  <UserCheck className="w-4 h-4 text-adjung-maroon" /> Editorial Board of Editors
                </h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">Manage administrative roles and access criteria for editors</p>
              </div>
              <div className="relative">
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
                          : 'bg-white border-stone-150'
                      }`}
                    >
                      <div className="space-y-0.5 text-left">
                        <span className="font-serif font-semibold text-stone-800 text-xs block">{u.penName}</span>
                        <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400">{u.role}</span>
                      </div>
                      <div className="h-10 w-28 flex items-center justify-end mix-blend-multiply select-none pointer-events-none shrink-0">
                        {(() => {
                          const sig = db.getIdentityByAccountId(u.id)?.signatures.find(s => s.status === 'Default');
                          if (sig) {
                            return (
                              <SignatureRenderer 
                                strokes={sig.strokes || []} 
                                type={sig.type}
                                typedText={sig.typedText}
                                fontFamily={sig.fontFamily}
                                typographyStyle={sig.typographyStyle}
                                className="w-full h-full overflow-visible" 
                                color="#802334" 
                                strokeWidth={2.5} 
                                enableBleed={true}
                              />
                            );
                          }
                          return <span className="font-signature text-sm text-adjung-maroon">{u.signature}</span>;
                        })()}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Right panel: Editor Details */}
              <div className="bg-stone-50 p-4 rounded border border-stone-150 space-y-4 text-left text-xs">
                {selectedBoardMemberId && users.find(u => u.id === selectedBoardMemberId) ? (
                  (() => {
                    const editor = users.find(u => u.id === selectedBoardMemberId)!;
                    return (
                      <div className="space-y-3 font-sans">
                        <h4 className="font-serif font-bold text-sm text-stone-850 flex items-center justify-between">
                          <span>{editor.penName}</span>
                          <span className="font-signature text-xl text-adjung-maroon">{editor.signature}</span>
                        </h4>
                        <div className="space-y-1 text-stone-600 font-mono text-[10px]">
                          <div>Username: @{editor.username}</div>
                          <div>Email: {editor.email || 'N/A'}</div>
                          <div>Role: <span className="text-adjung-maroon font-bold">{editor.role}</span></div>
                        </div>

                        {/* Actions block */}
                        <div className="pt-2 border-t border-stone-200 flex flex-col gap-1.5">
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
                  <p className="italic text-stone-400 py-12 text-center font-serif">No editor selected.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. USERS                                                  */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* User management directory search */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-semibold text-stone-900">Scholar Account Management</h3>
                <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Suspend/Reactivate users, review, or adjust credential categories</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search user accounts..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="border border-stone-200 p-1.5 pl-6 rounded text-[11px] focus:outline-none focus:border-adjung-maroon font-sans bg-white w-40"
                />
                <Search className="w-3 h-3 text-stone-400 absolute left-2 top-2.5" />
              </div>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {users
                .filter(u => {
                  const q = userSearchQuery.trim().toLowerCase();
                  return !q || u.penName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
                })
                .map(u => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <div key={u.id} className="p-3 border border-stone-150 rounded bg-[#FDFDFD] flex items-center justify-between gap-4">
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-serif font-bold text-[#111111] text-sm">{u.penName}</span>
                          <span className={`text-[8px] font-mono uppercase px-1 rounded ${
                            u.role === 'Chief Editor' 
                              ? 'bg-adjung-maroon text-[#FDFDFD]' 
                              : u.role === 'Editor'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {u.role}
                          </span>
                          {u.suspended && (
                            <span className="text-red-700 font-mono text-[8px] uppercase bg-red-50 px-1 rounded border border-red-200/50">SUSPENDED</span>
                          )}
                        </div>
                        <div className="font-mono text-[9px] text-stone-400 lowercase">@{u.username} • {u.email || 'No email'}</div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Change Role selection */}
                        {hasPermission('manageRbac') && !isSelf ? (
                          <select
                            value={u.role}
                            onChange={(e) => {
                              handleChangeUserRole(u.id, e.target.value as any);
                              refreshDbState();
                            }}
                            className="border border-stone-200 p-1 rounded text-[10px] bg-white focus:outline-none focus:border-adjung-maroon font-mono shadow-inner cursor-pointer"
                          >
                            <option value="Visitor">Visitor</option>
                            <option value="Writer">Writer</option>
                            <option value="Editor">Editor</option>
                            <option value="Chief Editor">Chief Editor</option>
                          </select>
                        ) : null}

                        {/* Suspend Toggle */}
                        {hasPermission('manageRbac') && !isSelf ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleUserSuspension(u.id);
                              refreshDbState();
                            }}
                            className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider rounded border cursor-pointer ${
                              u.suspended
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {u.suspended ? 'Reactivate' : 'Suspend'}
                          </button>
                        ) : null}

                        {isSelf && (
                          <span className="font-mono text-[9px] text-stone-400 italic">Self Account</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Send scholars invitation form */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-2">
              <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-700 flex items-center gap-1.5 select-none">
                <Mail className="w-4 h-4 text-adjung-maroon" /> Invite Scholar to Platfom
              </h3>
              <p className="text-stone-500 text-[10px] mt-0.5 leading-normal">Generate invitation letters and signup link criteria for external scholars</p>
            </div>

            {!hasPermission('inviteWriters') ? (
              <div className="p-4 bg-amber-50 border border-amber-150 text-amber-900 rounded text-xs leading-relaxed text-left flex gap-2">
                <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Invitation Privileges Locked</span>
                  <span>Your administrative role does not possess the 'Invite Writers' privilege. Please request Chief Editor clearance.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvitation} className="space-y-3.5 text-xs font-sans text-left">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Scholar Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Professor Al-Qurtubi"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Scholar Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. qurtubi@adjung.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Custom Message / Citation</label>
                  <textarea
                    placeholder="Provide context or a citation to include with the invitation card..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white min-h-[60px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-adjung-maroon text-[#FDFDFD] py-2 rounded text-xs font-mono uppercase tracking-wider hover:opacity-90 transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Generate Invitation
                </button>
              </form>
            )}

            {generatedInvitation && (
              <div className="mt-5 p-4 bg-stone-50 border border-stone-200 rounded text-left space-y-3 text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Invitation Generated</span>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block font-bold">Acceptance URL (Simulated Sign-up Link)</span>
                  <input
                    type="text"
                    readOnly
                    value={generatedInvitation.signupUrl}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none font-mono text-[9.5px] bg-white text-stone-700 select-all"
                    onClick={(e) => (e.target as any).select()}
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400 block font-bold">Formal Invitation Body</span>
                  <textarea
                    readOnly
                    value={generatedInvitation.emailBody}
                    rows={8}
                    className="w-full border border-stone-200 p-2 rounded font-sans text-[10px] bg-white leading-relaxed text-stone-600 select-all"
                    onClick={(e) => (e.target as any).select()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. ROLES (RBAC MATRIX)                                    */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'roles' && (
        !hasPermission('manageRbac') ? (
          <div className="bg-white border border-stone-200 rounded p-12 text-center shadow-sm select-none">
            <Lock className="w-12 h-12 text-[#802334] mx-auto mb-2 animate-pulse" />
            <span className="font-serif italic text-stone-500 block text-lg font-semibold">RBAC Management Locked</span>
            <p className="text-stone-500 text-xs font-sans leading-relaxed">
              Your administrative account (Role: <strong className="text-adjung-maroon">{currentUser.role}</strong>) does not have the necessary <strong>Manage RBAC</strong> privileges. Please contact the Chief Editor to adjust your role assignments.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
              <div className="border-b border-stone-100 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5">
                    <Lock className="w-5 h-5 text-[#802334]" />
                    Role-Based Access Control (RBAC) Matrix
                  </h3>
                  <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                    Configure administrative permissions assigned to each core system role
                  </p>
                </div>
                <div className="bg-stone-50 border border-stone-200 px-3 py-1.5 rounded text-[11px] font-mono text-stone-600 max-w-xs text-left">
                  <strong>Safety Note:</strong> Foundation roles are permanent. They can neither be renamed nor deleted.
                </div>
              </div>

              {/* Configurable Permissions Grid */}
              <div className="overflow-x-auto border border-stone-200 rounded">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                      <th className="p-3.5 pl-4">Administrative Permission</th>
                      <th className="p-3.5 text-center">Visitor</th>
                      <th className="p-3.5 text-center">Writer</th>
                      <th className="p-3.5 text-center">Editor</th>
                      <th className="p-3.5 text-center">Chief Editor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {/* Row 1: View Directory */}
                    <tr className="hover:bg-stone-50/40 transition">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">View Directory</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing the global searchable list of platform scholars and authors.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.viewDirectory ?? false;
                        const isCE = hasPermission('manageRbac');
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              disabled={!isCE}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    viewDirectory: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'View Directory' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 2: Curate Frontpage */}
                    <tr className="hover:bg-stone-50/40 transition">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Curate Frontpage</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows pinning featured scholars, articles, and editing main announcements.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.curateFrontpage ?? false;
                        const isCE = hasPermission('manageRbac');
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              disabled={!isCE}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    curateFrontpage: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Curate Frontpage' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 3: Invite Writers */}
                    <tr className="hover:bg-stone-50/40 transition">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Invite Writers</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows generating formal scholar invitation letters and secure sign-up URLs.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.inviteWriters ?? false;
                        const isCE = hasPermission('manageRbac');
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              disabled={!isCE}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    inviteWriters: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Invite Writers' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 4: Moderate Reports */}
                    <tr className="hover:bg-stone-50/40 transition">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Moderate Reports</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing reported content logs, hiding posts, or flag management.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.moderateReports ?? false;
                        const isCE = hasPermission('manageRbac');
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              disabled={!isCE}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    moderateReports: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Moderate Reports' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 5: Manage Settings */}
                    <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Manage Settings</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows modifying platform details, academic affiliation, custom styling, and editorial policies.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.manageSettings ?? false;
                        const isCE = hasPermission('manageRbac');
                        const isLockedForRole = role === 'Chief Editor';
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isLockedForRole ? true : hasPerm}
                              disabled={!isCE || isLockedForRole}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    manageSettings: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Manage Settings' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 6: Manage RBAC */}
                    <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Manage RBAC</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows modifying role assignments, inviting scholars, and editing system-wide permissions.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.manageRbac ?? false;
                        const isCE = hasPermission('manageRbac');
                        const isLockedForRole = role === 'Chief Editor';
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isLockedForRole ? true : hasPerm}
                              disabled={!isCE || isLockedForRole}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    manageRbac: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Manage RBAC' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 7: Manage Logs */}
                    <tr className="hover:bg-stone-50/40 transition border-t border-stone-100">
                      <td className="p-3.5 pl-4 text-left">
                        <span className="font-bold text-stone-800 block text-sm">Manage Logs</span>
                        <span className="text-stone-500 text-[11px] block mt-0.5">Allows accessing, auditing, and managing chronological system audit log reports.</span>
                      </td>
                      {(['Visitor', 'Writer', 'Editor', 'Chief Editor'] as const).map(role => {
                        const hasPerm = systemSettings.rolePermissions?.[role]?.manageLogs ?? false;
                        const isCE = hasPermission('manageRbac');
                        const isLockedForRole = role === 'Chief Editor';
                        return (
                          <td key={role} className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isLockedForRole ? true : hasPerm}
                              disabled={!isCE || isLockedForRole}
                              onChange={(e) => {
                                const updatedPermissions = {
                                  ...systemSettings.rolePermissions,
                                  [role]: {
                                    ...(systemSettings.rolePermissions?.[role] || {}),
                                    manageLogs: e.target.checked
                                  }
                                };
                                const updatedSettings = {
                                  ...systemSettings,
                                  rolePermissions: updatedPermissions as any
                                };
                                setSystemSettings(updatedSettings);
                                db.updateSystemSettings(updatedSettings);
                                db.addLog(`Modified 'Manage Logs' permission for '${role}' role to ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, currentUser.penName, currentUser.role);
                                refreshDbState();
                                showToast(`Permission updated for ${role}`, 'success');
                              }}
                              className="w-4 h-4 text-adjung-maroon border-stone-300 rounded focus:ring-adjung-maroon cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Locked Core Permissions */}
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-4 text-left">
              <h4 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-700 border-b pb-2 flex items-center gap-1.5 select-none">
                <Lock className="w-4 h-4 text-stone-400" /> Locked Core Permissions (Architectural Safety)
              </h4>
              <p className="font-sans text-xs text-stone-500 leading-relaxed">
                Certain permissions are hardcoded into Adjung's system architecture and cannot be modified by any platform administrator. This enforces platform safety and ensures absolute authorship integrity:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
                  <h5 className="font-bold text-stone-800">Intellectual Property Integrity</h5>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    Writers, Editors, and Chief Editors are strictly forbidden from modifying or editing another scholar's original intellectual work (Essays, Articles, Biographies, or Folios).
                  </p>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
                  <h5 className="font-bold text-stone-800">At Least One Chief Editor</h5>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    The platform requires at least one active, non-suspended Chief Editor to always exist in order to avoid administrative deadlocks or lockout states.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 border border-stone-200/60 rounded space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded font-bold inline-block">PERMANENT LOCK</span>
                  <h5 className="font-bold text-stone-800">Self-Administration Safeguards</h5>
                  <p className="text-stone-500 text-[11px] leading-relaxed">
                    An administrator is structurally prevented from demoting, deauthorizing, or suspending their own account to guarantee self-administration safety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ========================================================= */}
      {/* 8. MODERATION                                             */}
      {/* ========================================================= */}
      {editoriumActiveTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
            <div className="border-b border-stone-100 pb-4 mb-5 text-left space-y-1">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-adjung-maroon" />
                Content Moderation Board
              </h3>
              <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                Review reported entries and enforce academic and community policy guidelines
              </p>
            </div>

            {entries.filter(e => e.underReview).length === 0 ? (
              <div className="py-12 text-center select-none">
                <EyeOff className="w-12 h-12 text-adjung-maroon mx-auto mb-3" />
                <span className="font-serif italic text-stone-700 block text-base font-semibold">Clean Compliance / Safe</span>
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
                        <h4 className="font-serif font-bold text-stone-900 text-sm">
                          {entry.title || '(Untitled Note)'}
                        </h4>
                        <div className="text-xs text-stone-500 font-serif">
                          By: <strong className="text-stone-700 font-sans">{author?.penName || entry.publisher || 'Unknown'}</strong> (@{author?.username || 'anonymous'})
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const confirmRestore = window.confirm("Are you sure you want to restore this article?");
                            if (!confirmRestore) return;
                            fetch(`/api/entries/${entry.id}/dismiss-report`, { method: 'POST' })
                              .then(res => {
                                if (res.ok) {
                                  fetch('/api/logs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: `log-${Date.now()}`,
                                      timestamp: new Date().toISOString(),
                                      operator: currentUser.penName,
                                      role: currentUser.role,
                                      action: `Dismissed report and restored entry "${entry.title}" (ID: ${entry.id}).`
                                    })
                                  }).then(() => refreshDbState());
                                  showToast('Report dismissed. Article returned to normal status.', 'success');
                                }
                              });
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono uppercase rounded transition cursor-pointer border border-stone-200"
                        >
                          Restore Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const confirmUnlist = window.confirm("Are you sure you want to unlist this article from public display?");
                            if (!confirmUnlist) return;
                            fetch(`/api/entries/${entry.id}/unlist`, { method: 'POST' })
                              .then(res => {
                                if (res.ok) {
                                  fetch('/api/logs', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: `log-${Date.now()}`,
                                      timestamp: new Date().toISOString(),
                                      operator: currentUser.penName,
                                      role: currentUser.role,
                                      action: `Unlisted entry "${entry.title}" (ID: ${entry.id}) due to report violation.`
                                    })
                                  }).then(() => refreshDbState());
                                  showToast('Artikel telah di-unlist (keterlihatan diubah kepada Private).', 'info');
                                }
                              });
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
        !hasPermission('manageLogs') ? (
          <div className="bg-white border border-stone-200 rounded p-12 text-center shadow-sm select-none">
            <Lock className="w-12 h-12 text-[#802334] mx-auto mb-2 animate-pulse" />
            <span className="font-serif italic text-stone-500 block text-lg font-semibold">Audit Logs Locked</span>
            <p className="text-stone-500 text-xs font-sans leading-relaxed">
              Your administrative account (Role: <strong className="text-adjung-maroon">{currentUser.role}</strong>) does not have the necessary <strong>Manage Logs</strong> privileges. Please contact the Chief Editor to adjust your permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
              <div className="border-b border-stone-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5">
                    <FileText className="w-5 h-5 text-adjung-maroon" />
                    System Audit Logs
                  </h3>
                  <p className="font-mono text-[10px] text-stone-400 uppercase tracking-wider">
                    Chronological journal of administrative actions, safety events, and curator logs
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={logsSearchQuery}
                      onChange={(e) => setLogsSearchQuery(e.target.value)}
                      className="border border-stone-200 p-1.5 pl-7 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white"
                    />
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      refreshDbState();
                      showToast('Audit trail synchronized.', 'info');
                    }}
                    className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-mono text-[10px] uppercase tracking-wider py-1.5 px-3 rounded shadow-sm cursor-pointer"
                  >
                    Sync Trail
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="overflow-x-auto border border-stone-200 rounded">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                      <th className="p-3.5 pl-4">Timestamp</th>
                      <th className="p-3.5">Operator</th>
                      <th className="p-3.5">Administrative Role</th>
                      <th className="p-3.5">Action Executed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 font-sans text-xs text-stone-700">
                    {db.getLogs()
                      .filter(log => {
                        const query = logsSearchQuery.trim().toLowerCase();
                        return !query || 
                          log.operator.toLowerCase().includes(query) ||
                          log.role.toLowerCase().includes(query) ||
                          log.action.toLowerCase().includes(query);
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50/40 transition">
                          <td className="p-3.5 pl-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3.5 font-bold text-stone-800">
                            {log.operator}
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              log.role === 'Chief Editor'
                                ? 'bg-adjung-maroon text-[#FDFDFD] font-semibold'
                                : log.role === 'Editor'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200/50'
                                : 'bg-stone-100 text-stone-600'
                            }`}>
                              {log.role}
                            </span>
                          </td>
                          <td className="p-3.5 font-serif text-sm text-stone-800 text-left">
                            {log.action}
                          </td>
                        </tr>
                      ))}
                    {db.getLogs().length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center italic text-stone-400">
                          No system audit records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
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
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-red-800 flex items-center gap-1.5 select-none">
              <ShieldAlert className="w-5 h-5 text-red-700" /> Danger Zone & Platform Resets
            </h3>
            <p className="font-sans text-xs text-stone-600 leading-relaxed">
              This command deletes all local database entries, profiles, timeline milestones, and user settings, resetting the environment back to the clean pre-seeded academic template. This action cannot be undone.
            </p>

            <div className="p-3.5 bg-white border border-red-150 rounded space-y-2 text-[11px] text-stone-600 leading-normal font-sans">
              <strong className="text-red-700 uppercase block font-mono text-[9px] tracking-wider">Warning of Destructive Operation:</strong>
              <div>• Clears all draft entries and publications.</div>
              <div>• Demotes or removes added custom users and guest authors.</div>
              <div>• Re-seeds default system accounts.</div>
            </div>

            <button
              type="button"
              disabled={!hasPermission('manageSettings')}
              onClick={() => {
                if (window.confirm('WARNING: Are you absolutely sure you want to reset the entire database? This deletes all custom entries and profiles.')) {
                  handleResetDatabase();
                  showToast('Database reset to pre-seeded academic templates.', 'info');
                }
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

    </div>
  );
}
