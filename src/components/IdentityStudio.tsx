import React, { useState, useEffect } from 'react';
import { User, IdentityProfile } from '../types';
import { db } from '../db/mockDb';
import { SignatureManager } from './SignatureManager';
import { ShieldCheck, User as UserIcon, BookOpen, Key, Layout } from 'lucide-react';

interface IdentityStudioProps {
  currentUser: User;
  onClose: () => void;
  refreshGlobalState: () => void;
}

export function IdentityStudio({ currentUser, onClose, refreshGlobalState }: IdentityStudioProps) {
  const [identity, setIdentity] = useState<IdentityProfile | null>(null);
  
  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [penName, setPenName] = useState('');
  const [biography, setBiography] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const ident = db.getIdentityByAccountId(currentUser.id);
    if (ident) {
      setIdentity(ident);
      setUsername(ident.username);
      setDisplayName(ident.displayName || '');
      setPenName(ident.penName);
      setBiography(ident.biography || '');
      setVisibility(ident.publicVisibility || 'Public');
    }
  }, [currentUser]);

  if (!identity) return <div className="p-8 text-center text-stone-500 font-mono text-sm">Loading Identity Studio...</div>;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updatedIdentity: IdentityProfile = {
      ...identity,
      username,
      displayName,
      penName,
      biography,
      publicVisibility: visibility,
    };

    db.updateIdentity(updatedIdentity);
    setIdentity(updatedIdentity);

    // Also update the User object penName & username to keep in sync for this prototype
    const users = db.getUsers();
    const updatedUser = users.find(u => u.id === currentUser.id);
    if (updatedUser) {
      updatedUser.penName = penName;
      updatedUser.username = username;
      db.saveUsersToStorage();
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      refreshGlobalState();
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const handleIdentityUpdateFromSignature = (updatedIdentity: IdentityProfile) => {
    setIdentity(updatedIdentity);
    // Sync the string representation to user for legacy fallback if needed
    const defaultSig = updatedIdentity.signatures.find(s => s.status === 'Default');
    if (defaultSig) {
      const users = db.getUsers();
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        updatedUser.signature = defaultSig.label; // text fallback or placeholder
        db.saveUsersToStorage();
        refreshGlobalState();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light text-stone-900 flex items-center gap-2">
            <Layout className="w-6 h-6 text-adjung-maroon" />
            Identity Studio
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
            Decoupled authorship, signature, and verification management.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 border border-stone-200 text-stone-600 rounded hover:bg-stone-50 font-mono text-xs uppercase tracking-wider transition"
        >
          Return to Workspace
        </button>
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
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Username (URL)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-mono text-xs"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Display Name (Legal)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-sans text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Pen Name (Published)</label>
                  <input
                    type="text"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon font-serif font-semibold text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1">Author Biography</label>
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full border border-stone-200 p-3 rounded focus:outline-none focus:border-adjung-maroon min-h-[160px] font-serif leading-relaxed text-sm resize-y"
                  placeholder="Enter scholarly biography..."
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              {saveSuccess ? (
                <span className="text-emerald-600 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Identity Saved
                </span>
              ) : (
                <span className="text-stone-400 font-mono text-[10px] uppercase tracking-wider">
                  Unsaved Changes
                </span>
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
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm opacity-60">
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
          <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
            <SignatureManager identity={identity} onIdentityUpdate={handleIdentityUpdateFromSignature} />
          </div>
        </div>

      </div>
    </div>
  );
}
