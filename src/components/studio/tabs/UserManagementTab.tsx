import React, { useState } from 'react';
import { ShieldAlert, Search, Mail, Lock, Send } from 'lucide-react';
import { User } from '../../../types';
import { supabaseService as firestoreService } from '../../../utils/supabaseService';

interface UserManagementTabProps {
  currentUser: User;
  users: User[];
  handleToggleUserSuspension: (targetUserId: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  refreshDbState: () => void;
  hasPermission: (perm: string) => boolean;
}

export function UserManagementTab({
  currentUser,
  users,
  handleToggleUserSuspension,
  showToast,
  refreshDbState,
  hasPermission
}: UserManagementTabProps) {
  const [suspensionSearchVal, setSuspensionSearchVal] = useState('');
  const [foundSuspendUser, setFoundSuspendUser] = useState<User | null>(null);

  // Invitation form states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    signupUrl: string;
    emailBody: string;
  } | null>(null);

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const signupUrl = `https://adjung.com/invite/register?name=${encodeURIComponent(inviteName.trim())}&email=${encodeURIComponent(inviteEmail.trim())}`;
    const emailBody = `Salutations ${inviteName.trim()},\n\nYou are cordially invited by the Chief Editor of Adjung to join our publishing platform as an independent Writer.\n\nName: ${inviteName.trim()}\nEmail: ${inviteEmail.trim()}\n${inviteMessage.trim() ? `\nMessage from the Chief Editor:\n"${inviteMessage.trim()}"\n` : ''}\nTo accept this invitation and initialize your personal scholarly Folio, please click the link below to choose your Username and signature:\n${signupUrl}\n\nRespectfully,\nEditorial Board of Adjung`;

    setGeneratedInvitation({
      signupUrl,
      emailBody
    });

    firestoreService.logAction(`Generated scholarly invitation for '${inviteName.trim()}' (${inviteEmail.trim()}).`, currentUser).then(() => refreshDbState());
    setInviteName('');
    setInviteEmail('');
    setInviteMessage('');
    showToast(`Invitation created for ${inviteName.trim()}`, 'success');
    refreshDbState();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* User management: Scholar Suspension Manager */}
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-2 text-left">
          <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-1.5 select-none">
            <ShieldAlert className="w-4.5 h-4.5 text-adjung-maroon" /> Scholar Suspension Manager
          </h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mt-0.5">Search and suspend scholar accounts, or manage suspended users</p>
        </div>

        {/* Part 1: Search and Suspend Input */}
        <div className="space-y-4 text-left text-xs font-sans">
          <div className="space-y-1.5">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold">Search Scholar to Suspend</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Enter Pen Name or Username (e.g. @zayd.ghazali)"
                  value={suspensionSearchVal}
                  onChange={(e) => {
                    setSuspensionSearchVal(e.target.value);
                    if (!e.target.value.trim()) {
                      setFoundSuspendUser(null);
                    }
                  }}
                  className="w-full border border-stone-200 p-2 pl-8 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white text-stone-800"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!suspensionSearchVal.trim()) return;
                  const cleanQuery = suspensionSearchVal.trim().toLowerCase().replace(/^@/, '');
                  const found = users.find(u => 
                    u.username.toLowerCase() === cleanQuery ||
                    u.penName.toLowerCase() === cleanQuery
                  );
                  if (!found) {
                    showToast('Scholar not found in database.', 'error');
                    setFoundSuspendUser(null);
                  } else {
                    setFoundSuspendUser(found);
                  }
                }}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-mono uppercase tracking-wider text-[10px] rounded transition cursor-pointer font-semibold"
              >
                Find
              </button>
            </div>
          </div>

          {/* Display Found Scholar Details & Action */}
          {foundSuspendUser && (
            <div className="p-4 border border-stone-200 rounded bg-[#FDFDFD] space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-sans font-bold text-[#111111] text-sm block">{foundSuspendUser.penName}</span>
                  <span className="font-mono text-[9px] text-stone-400 block">@{foundSuspendUser.username} • {foundSuspendUser.email || 'No email'}</span>
                  <span className={`inline-block text-[8px] font-mono uppercase px-1 rounded ${
                    foundSuspendUser.role === 'Chief Editor' 
                      ? 'bg-adjung-maroon text-[#FDFDFD]' 
                      : foundSuspendUser.role === 'Editor'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {foundSuspendUser.role}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400">Listing Status</span>
                  <span className={`text-[10px] font-semibold font-mono ${foundSuspendUser.suspended ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}`}>
                    {foundSuspendUser.suspended ? 'SUSPENDED' : 'ACTIVE & LISTED'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end">
                {foundSuspendUser.id === currentUser.id ? (
                  <span className="font-mono text-[9px] text-stone-400 italic">Self Account</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleUserSuspension(foundSuspendUser.id);
                      setFoundSuspendUser(prev => prev ? { ...prev, suspended: !prev.suspended } : null);
                      showToast(`Suspension status updated for ${foundSuspendUser.penName}.`, 'success');
                      refreshDbState();
                    }}
                    className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded border cursor-pointer ${
                      foundSuspendUser.suspended
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {foundSuspendUser.suspended ? 'Reactivate Scholar' : 'Suspend Scholar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Part 2: Suspended Scholars List */}
        <div className="space-y-3 pt-4 border-t border-stone-200 text-left">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Suspended Scholars ({users.filter(u => u.suspended).length})</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {users.filter(u => u.suspended).length > 0 ? (
              users.filter(u => u.suspended).map(u => (
                <div key={u.id} className="p-3 border border-red-100 bg-red-50/20 rounded flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-sans font-bold text-stone-800 block">{u.penName}</span>
                    <span className="font-mono text-[9px] text-stone-400">@{u.username} • {u.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleUserSuspension(u.id);
                      if (foundSuspendUser && foundSuspendUser.id === u.id) {
                        setFoundSuspendUser(prev => prev ? { ...prev, suspended: false } : null);
                      }
                      showToast(`Reactivated ${u.penName}.`, 'success');
                      refreshDbState();
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-mono text-[9px] uppercase tracking-wider cursor-pointer"
                  >
                    Reactivate
                  </button>
                </div>
              ))
            ) : (
              <p className="italic text-stone-400 py-6 text-center font-sans">No scholars are currently suspended.</p>
            )}
          </div>
        </div>
      </div>

      {/* Send scholars invitation form */}
      <div className="lg:col-span-5 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-5">
        <div className="border-b border-stone-100 pb-2 text-left">
          <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-700 flex items-center gap-1.5 select-none">
            <Mail className="w-4 h-4 text-adjung-maroon" /> Invite Scholar to Platform
          </h3>
          <p className="text-stone-500 text-[10px] mt-0.5 leading-normal">Generate invitation letters and signup link criteria for external scholars</p>
        </div>

        {!hasPermission('inviteWriters') ? (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs leading-relaxed text-left flex gap-2">
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
                className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white text-stone-800"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Scholar Username (Email)</label>
              <input
                type="email"
                placeholder="e.g. qurtubi@adjung.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white text-stone-800"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1">Custom Message / Citation</label>
              <textarea
                placeholder="Provide context or a citation to include with the invitation card..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full border border-stone-200 p-2 rounded focus:outline-none focus:border-adjung-maroon text-xs bg-white min-h-[60px] text-stone-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-adjung-maroon text-[#FDFDFD] py-2 rounded text-xs font-mono uppercase tracking-wider hover:opacity-95 transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-1.5 font-semibold"
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
  );
}
