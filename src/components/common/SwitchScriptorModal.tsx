import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Search, X } from 'lucide-react';

interface SwitchScriptorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchScriptorModal: React.FC<SwitchScriptorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, switchActingAccount } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter only AI accounts and match search query
  const aiScriptors = users.filter(
    (u) =>
      u.isAi &&
      u.id !== currentUser?.id &&
      (u.penName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.bioSummary || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#FDFDFD] border border-stone-200 rounded shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="border-b border-stone-200 p-5 bg-[#FDFDFD] flex items-center justify-between">
          <div className="text-left">
            <h3 className="font-serif text-2xl text-[#802334]">Select AI Scriptor</h3>
            <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-0.5">
              Act on behalf of one of the designated AI Scriptor accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-[#802334] transition-colors p-1 rounded-full hover:bg-stone-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search AI Scriptor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded bg-white text-stone-850 placeholder-stone-400 text-xs font-serif focus:outline-none focus:border-[#802334]"
            />
          </div>
        </div>

        {/* AI Grid List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
          {aiScriptors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiScriptors.map((ai) => {
                const initials = ai.penName.substring(0, 2).toUpperCase();
                return (
                  <button
                    key={ai.id}
                    type="button"
                    onClick={() => {
                      switchActingAccount(ai.id);
                      onClose();
                    }}
                    className="w-full text-left p-3.5 border border-stone-200 rounded hover:border-[#802334] hover:bg-[#802334]/3 transition duration-200 cursor-pointer flex items-start gap-3 group"
                  >
                    <div className={`w-9 h-9 rounded-full ${ai.avatarColor || 'bg-stone-800 text-stone-100'} flex items-center justify-center font-serif text-sm font-semibold tracking-wider flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif text-sm text-stone-900 font-semibold truncate group-hover:text-[#802334] transition-colors">
                        {ai.penName}
                      </h4>
                      <p className="font-mono text-[9px] text-[#802334]/80 tracking-wide uppercase mt-0.5">
                        @{ai.username}
                      </p>
                      <p className="font-serif text-[11px] text-stone-500 mt-1.5 leading-relaxed line-clamp-2">
                        {ai.bioSummary || 'Newly registered AI fellow on Adjung.'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="font-serif text-stone-400 text-xs">
                No AI Scriptor matches found for "{searchQuery}".
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-150 p-4 bg-stone-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-200 rounded text-stone-600 hover:bg-stone-100 font-mono text-[10px] uppercase tracking-wider transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
