import React, { useState, useEffect } from 'react';
import { User, IdentityProfile } from '../../types';
import { SignatureManager } from '../desk/SignatureManager';
import { ShieldCheck, User as UserIcon, BookOpen, Key, Fingerprint, Globe, Check, X } from 'lucide-react';
import { isSubdomainUnlocked } from '../../utils';

import { useAppContext } from '../../context/AppContext';
import { supabaseService as firestoreService } from '../../utils/supabaseService';

interface IdentityStudioProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function IdentityStudio({ isModal = false, onClose }: IdentityStudioProps) {
  const { currentUser, identities, entries, setActiveTab, refreshDbState: refreshGlobalState } = useAppContext();
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveTab('desk');
    }
  };

  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [penName, setPenName] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');
  const [affiliation, setAffiliation] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let ident = identities.find(i => i.accountId === currentUser.id) || null;

    // Robust fallback: if no identity is found, construct a default one so the studio never hangs
    if (!ident) {
      ident = {
        identityId: `id-${currentUser.id}`,
        accountId: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.penName || currentUser.username,
        penName: currentUser.penName || currentUser.username,
        biography: currentUser.bioSummary || '',
        publicVisibility: 'Public',
        lifeTimeline: [],
        signatures: currentUser.signature ? [{
          id: `sig-${Date.now()}`,
          label: currentUser.signature,
          type: 'typed',
          typedText: currentUser.signature,
          fontFamily: 'Outfit',
          status: 'Default',
          strokes: [],
          createdAt: new Date().toISOString()
        }] : []
      };
      firestoreService.saveIdentity(ident).then(() => refreshGlobalState()).catch(e => {
        console.error("Could not save fallback identity", e);
      });
    }

    setIdentity(ident);
    setUsername(ident.username);
    setDisplayName(ident.displayName || '');
    setPenName(ident.penName);
    setVisibility(ident.publicVisibility || 'Public');
    setAffiliation(ident.affiliation || '');
  }, [currentUser, identities]);

  if (!identity) return <div className="p-8 text-center text-stone-500 font-mono text-sm">Loading Identity...</div>;

  // "Unsaved Changes" previously showed unconditionally (it was just
  // !saveSuccess, true by default before any edit at all) — compare
  // against the loaded baseline instead so it only appears when something
  // has actually changed.
  const isDirty =
    username !== identity.username ||
    displayName !== (identity.displayName || '') ||
    penName !== identity.penName ||
    visibility !== (identity.publicVisibility || 'Public') ||
    affiliation !== (identity.affiliation || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedIdentity: IdentityProfile = {
      ...identity,
      username,
      displayName,
      penName,
      publicVisibility: visibility,
      signatures: identity.signatures,
      affiliation
    };

    // Also update the User object penName & username & signature to keep in sync
    const defaultSig = updatedIdentity.signatures.find(s => s.status === 'Default');
    const updatedUser: User = {
      ...currentUser,
      username,
      penName,
      affiliation,
      signature: defaultSig ? (defaultSig.type === 'typed' ? defaultSig.typedText || '' : defaultSig.label) : currentUser.signature
    };

    // Make POST requests to Supabase
    Promise.all([
      firestoreService.saveUser(updatedUser),
      firestoreService.saveIdentity(updatedIdentity)
    ]).then(() => {
      // Update active storage session
      const rememberMe = !!localStorage.getItem('Adjung_session_user_id');
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('Adjung_session_user_data', JSON.stringify(updatedUser));

      setIdentity(updatedIdentity);

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        refreshGlobalState();
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 400);
    }).catch(err => {
      console.error('Failed to save identity to server:', err);
      setIsSaving(false);
    });
  };

  const handleIdentityUpdateFromSignature = (updatedIdentity: IdentityProfile) => {
    // If default signature is typed, sync its text back to penName and displayName
    const defaultSig = updatedIdentity.signatures.find(s => s.status === 'Default');
    let finalIdentity = { ...updatedIdentity };
    let newPenName = penName;
    let newDisplayName = displayName;

    // Keep penName and displayName as configured in the form without overwriting them with signature text

    setIdentity(finalIdentity);

    // Sync to User object
    const updatedUser: User = {
      ...currentUser,
      penName: newPenName,
      signature: defaultSig ? (defaultSig.type === 'typed' ? defaultSig.typedText || '' : defaultSig.label) : currentUser.signature
    };

    // Make POST requests to Supabase
    Promise.all([
      firestoreService.saveUser(updatedUser),
      firestoreService.saveIdentity(finalIdentity)
    ]).then(() => {
      // Update active storage session
      const rememberMe = !!localStorage.getItem('Adjung_session_user_id');
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('Adjung_session_user_data', JSON.stringify(updatedUser));

      refreshGlobalState();
    }).catch(err => console.error('Failed to save signature updates to server:', err));
  };

  const renderContent = () => (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light text-stone-900 flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-adjung-maroon" />
            Identity
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
            Decoupled authorship, signature, and verification management.
          </p>
        </div>
        {!isModal && (
          <button
            onClick={handleClose}
            className="px-4 py-1.5 border border-stone-200 text-stone-600 rounded hover:bg-stone-50 font-mono text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Return to Desk
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-8">
          
          <form onSubmit={handleSaveProfile} className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-stone-700 flex items-center gap-2 border-b pb-3">
              <UserIcon className="w-4 h-4 text-adjung-maroon" /> Public Identity
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Subdomain (ID Unik)</label>
                  <input
                    type="text"
                    value={username}
                    className="w-full border border-stone-200 p-2 rounded bg-stone-50 text-stone-400 font-mono text-xs cursor-not-allowed select-none"
                    disabled
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'Public' | 'Private')}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs"
                  >
                    <option value="Public">Public (Directory Visible)</option>
                    <option value="Private">Private (Unlisted)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Pen & Short Name</label>
                  <input
                    type="text"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-sans font-semibold text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Affiliation</label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="e.g. your organization or city"
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              {saveSuccess && !isDirty ? (
                <span className="text-emerald-600 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Identity Saved
                </span>
              ) : isDirty ? (
                <span className="text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                  Unsaved Changes
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="bg-stone-900 text-white px-6 py-2 rounded text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Placeholder for Future Verification & Privacy */}
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm opacity-50">
             <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-stone-600 flex items-center gap-2 border-b pb-3 mb-4">
              <Key className="w-4 h-4" /> Verification & Credentials
            </h3>
            <p className="font-sans text-xs text-stone-500">
              Cryptographic verification architecture is prepared but currently disabled.
            </p>
          </div>

        </div>

        {/* Right Column: Signature System */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Subdomain Activation Progress */}
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-stone-700 flex items-center gap-2 border-b pb-3 mb-2">
              <Globe className="w-4 h-4 text-adjung-maroon" /> Subdomain Status
            </h3>
            
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-stone-50 border border-stone-100">
              <span className="text-xs font-sans font-bold text-stone-900">
                {username}.adjung.com
              </span>
              {isSubdomainUnlocked(currentUser.id, entries, identity, currentUser.createdAt, currentUser.subdomainApprovedEarly, currentUser.isAi) ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[9px] uppercase tracking-wider rounded font-bold border border-emerald-200">
                  Unlocked
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-mono text-[9px] uppercase tracking-wider rounded font-bold border border-amber-200">
                  Reserved
                </span>
              )}
            </div>
            
            {!isSubdomainUnlocked(currentUser.id, entries, identity, currentUser.createdAt, currentUser.subdomainApprovedEarly, currentUser.isAi) && (
              <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                Your custom subdomain is reserved. Complete the conditions below to unlock and publish using your custom address.
              </p>
            )}

            <div className="space-y-3 pt-2">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                Unlock Requirements
              </span>
              
              <div className="space-y-2 text-left">
                {(() => {
                  const allEntries = entries;
                  const hasNote = allEntries.some(e => e.authorId === currentUser.id && e.status === 'Published' && e.contentType === 'Note');
                  const hasEssay = allEntries.some(e => e.authorId === currentUser.id && e.status === 'Published' && e.contentType === 'Essay');
                  const hasBioText = identity && identity.biography && identity.biography.trim().length > 0 && 
                    !identity.biography.includes('Biography of') && !identity.biography.includes('Biography for');
                  const hasTimeline = identity && identity.lifeTimeline && identity.lifeTimeline.length > 0;

                  const userCreated = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date();
                  const daysActive = Math.floor((new Date().getTime() - userCreated.getTime()) / (1000 * 60 * 60 * 24));
                  const is30DaysActive = daysActive >= 30;

                  const items = [
                    { label: "Publish a Note", done: hasNote },
                    { label: "Publish an Essay", done: hasEssay },
                    { label: "Fill Biography Text", done: hasBioText },
                    { label: "Add Biography Milestone", done: hasTimeline },
                    { label: `Account active for 30 days (Currently ${daysActive} days)`, done: is30DaysActive }
                  ];

                  return items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-sans">
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        item.done ? 'bg-emerald-50 border-emerald-400 text-emerald-600 font-bold' : 'bg-stone-50 border-stone-200 text-stone-300'
                      }`}>
                        {item.done && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span className={item.done ? 'text-stone-400 line-through' : 'text-stone-700'}>
                        {item.label}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
            <SignatureManager identity={identity} onIdentityUpdate={handleIdentityUpdateFromSignature} />
          </div>
        </div>

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-5xl w-full p-8 relative max-h-[90vh] overflow-y-auto scholarly-border animate-fade-in">
          <button onClick={handleClose} className="absolute top-4 right-4 inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 font-mono text-xs uppercase tracking-wider cursor-pointer">
            <X className="w-3 h-3" /> Close
          </button>
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {renderContent()}
    </div>
  );
}
