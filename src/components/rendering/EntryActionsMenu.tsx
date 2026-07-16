import React from 'react';
import { Entry, User } from '../../types';

interface EntryActionsMenuProps {
  showActionsMenu: boolean;
  setShowActionsMenu: (val: boolean) => void;
  entry: Entry;
  getCanonicalUrl: () => string;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  authorName: string;
  title: string;
  currentUser: User | null;
  setEditingEntry: (entry: Entry | null) => void;
  setSelectedEntry: (entry: Entry | null) => void;
  setActiveTab: (tab: string) => void;
}

export function EntryActionsMenu({
  showActionsMenu,
  setShowActionsMenu,
  entry,
  getCanonicalUrl,
  showToast,
  authorName,
  title,
  currentUser,
  setEditingEntry,
  setSelectedEntry,
  setActiveTab
}: EntryActionsMenuProps) {
  return (
    <div 
      className="relative"
      onMouseLeave={() => setShowActionsMenu(false)}
    >
      <button
        type="button"
        onClick={() => setShowActionsMenu(!showActionsMenu)}
        className="text-stone-500 hover:text-[#802334] font-bold text-sm tracking-normal px-2 transition-colors cursor-pointer select-none bg-transparent border-0 font-sans"
        title="Actions Menu"
      >
        ⋯
      </button>
      {showActionsMenu && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-stone-200 rounded shadow-md py-1 z-50 text-left normal-case tracking-normal">
          <button
            type="button"
            onClick={() => {
              const url = getCanonicalUrl();
              navigator.clipboard.writeText(url);
              showToast('Canonical link copied to clipboard!', 'success');
              setShowActionsMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Copy Link
          </button>
          <button
            type="button"
            onClick={() => {
              const citeText = `${authorName}. (${new Date(entry.publishedDate || entry.createdDate).getFullYear()}). ${title || 'Untitled'}. Adjung. Retrieved from ${getCanonicalUrl()}`;
              navigator.clipboard.writeText(citeText);
              showToast('Citation copied to clipboard (APA Format)!', 'success');
              setShowActionsMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Citation
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              setShowActionsMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Print
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              setShowActionsMenu(false);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Export PDF
          </button>
          {currentUser?.id === entry.authorId && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingEntry(entry);
                  setSelectedEntry(null);
                  setActiveTab('desk');
                  setShowActionsMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer flex items-center gap-2 border-0 bg-transparent font-sans font-medium text-[#802334]"
              >
                Edit
              </button>
              <div className="h-px bg-stone-100 my-1" />
            </>
          )}
          <div className="h-px bg-stone-100 my-1" />
          <button
            type="button"
            disabled
            className="w-full text-left px-3 py-1.5 text-xs text-stone-300 cursor-not-allowed flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Revision History (KIV)
          </button>
          <button
            type="button"
            disabled
            className="w-full text-left px-3 py-1.5 text-xs text-stone-300 cursor-not-allowed flex items-center gap-2 border-0 bg-transparent font-sans"
          >
            Report Error (KIV)
          </button>
        </div>
      )}
    </div>
  );
}
