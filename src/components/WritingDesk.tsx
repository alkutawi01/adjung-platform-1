import React from 'react';
import { PenTool, ChevronLeft, FileEdit, Lock, Globe, Settings } from 'lucide-react';
import { Entry, User } from '../types';
import { EntryRenderer } from './EntryRenderer';

interface WritingDeskProps {
  currentUser: User;
  entries: Entry[];
  editingEntry: Entry | null;
  setEditingEntry: (entry: Entry | null) => void;
  refreshDbState: () => void;
  handleCreateNewEntry: (type: 'Note' | 'Essay' | 'Article') => void;
  handleSaveEntry: (entry: Entry) => void;
  handleDeleteEntry: (id: string) => void;
  handleSaveFolioSettings: (e: React.FormEvent) => void;
  deskUsername: string;
  setDeskUsername: (val: string) => void;
  deskPenName: string;
  setDeskPenName: (val: string) => void;
  deskSignature: string;
  setDeskSignature: (val: string) => void;
  deskHeroTitle: string;
  setDeskHeroTitle: (val: string) => void;
  deskHeroSubtitle: string;
  setDeskHeroSubtitle: (val: string) => void;
  deskBioText: string;
  setDeskBioText: (val: string) => void;
}

export function WritingDesk({
  currentUser,
  entries,
  editingEntry,
  setEditingEntry,
  refreshDbState,
  handleCreateNewEntry,
  handleSaveEntry,
  handleDeleteEntry,
  handleSaveFolioSettings,
  deskUsername,
  setDeskUsername,
  deskPenName,
  setDeskPenName,
  deskSignature,
  setDeskSignature,
  deskHeroTitle,
  setDeskHeroTitle,
  deskHeroSubtitle,
  setDeskHeroSubtitle,
  deskBioText,
  setDeskBioText,
}: WritingDeskProps) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#111111]/10 pb-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#802334]" />
            Writing Desk
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40">
            Write, edit and manage your publications.
          </p>
        </div>

        {!editingEntry && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCreateNewEntry('Note')}
              className="px-3 py-1.5 bg-[#802334] text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-95 transition cursor-pointer"
            >
              + Note
            </button>
            <button
              type="button"
              onClick={() => handleCreateNewEntry('Essay')}
              className="px-3 py-1.5 bg-[#802334] text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-95 transition cursor-pointer"
            >
              + Essay
            </button>
            <button
              type="button"
              onClick={() => handleCreateNewEntry('Article')}
              className="px-3 py-1.5 bg-[#802334] text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-95 transition cursor-pointer"
            >
              + Article
            </button>
          </div>
        )}
      </div>

      {editingEntry ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#111111]/5 p-2 border border-[#111111]/10 rounded">
            <button
              type="button"
              onClick={() => {
                setEditingEntry(null);
                refreshDbState();
              }}
              className="inline-flex items-center gap-1 text-[#111111]/60 hover:text-[#802334] font-mono text-xs uppercase cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Close Composer
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#802334] animate-pulse" />
              <span className="font-mono text-[10px] text-[#111111]/60 uppercase">Editor</span>
            </div>
          </div>

          <EntryRenderer
            entry={editingEntry}
            mode="edit"
            onSave={handleSaveEntry}
            onDelete={handleDeleteEntry}
            authorName={currentUser.penName}
            authorSignature={currentUser.signature}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left column: drafts & published */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Drafts list */}
            <div className="space-y-4">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/50 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Drafts</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').length}
                </span>
              </h3>

              {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').length === 0 ? (
                <p className="text-xs text-[#111111]/40 italic py-3">No pending drafts. Your mind is quiet.</p>
              ) : (
                <div className="space-y-3">
                  {entries.filter(e => e.authorId === currentUser.id && e.status === 'Draft').map(draft => (
                    <div 
                      key={draft.id} 
                      onClick={() => setEditingEntry(draft)}
                      className="bg-white hover:bg-[#FDFDFD] border border-[#111111]/10 p-4 rounded flex items-center justify-between cursor-pointer group transition-colors shadow-sm"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#111111]/40">
                          <span className="text-[#802334] font-semibold">{draft.contentType}</span>
                          <span>•</span>
                          <span>Updated {new Date(draft.updatedDate).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-[#111111] text-base group-hover:text-[#802334] transition-colors text-left">
                          {draft.title}
                        </h4>
                      </div>
                      <FileEdit className="w-4 h-4 text-[#111111]/40 group-hover:text-[#802334] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published list */}
            <div className="space-y-4">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/50 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Published</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').length}
                </span>
              </h3>

              {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').length === 0 ? (
                <p className="text-xs text-[#111111]/40 italic py-3">No published records on file.</p>
              ) : (
                <div className="space-y-3">
                  {entries.filter(e => e.authorId === currentUser.id && e.status === 'Published').map(pub => (
                    <div 
                      key={pub.id} 
                      onClick={() => setEditingEntry(pub)}
                      className="bg-white hover:bg-[#FDFDFD] border border-[#111111]/10 p-4 rounded flex items-center justify-between cursor-pointer group transition-colors shadow-sm"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#111111]/40">
                          <span className="text-[#802334] font-semibold">{pub.contentType}</span>
                          <span>•</span>
                          <span>Published {pub.publishedDate ? new Date(pub.publishedDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-[#111111] text-base group-hover:text-[#802334] transition-colors text-left">
                          {pub.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-stone-400 flex-shrink-0">
                        {pub.visibility === 'Private' ? (
                          <Lock className="w-3.5 h-3.5 text-red-600" title="Private" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-stone-400" title="Public" />
                        )}
                        <FileEdit className="w-4 h-4 group-hover:text-[#802334]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right column: personal settings */}
          <div className="lg:col-span-4 bg-white border border-[#111111]/10 rounded p-6 shadow-sm font-sans text-xs">
            <h3 className="font-sans text-[11px] uppercase tracking-widest font-bold text-[#802334] border-b border-[#111111]/10 pb-3 mb-4 flex items-center gap-1.5 select-none">
              <Settings className="w-4 h-4" /> Folio Settings
            </h3>
            
            <form onSubmit={handleSaveFolioSettings} className="space-y-4">
              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Account Username</label>
                <input
                  type="text"
                  value={deskUsername}
                  onChange={(e) => setDeskUsername(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#802334]"
                  required
                />
              </div>

              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Pen Name</label>
                <input
                  type="text"
                  value={deskPenName}
                  onChange={(e) => setDeskPenName(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#802334]"
                  required
                />
              </div>

              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Signature Text Stamp</label>
                <input
                  type="text"
                  value={deskSignature}
                  onChange={(e) => setDeskSignature(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 bg-white text-[#802334] focus:outline-none focus:border-[#802334] font-signature text-xl"
                  required
                />
                <span className="text-[10px] text-[#111111]/40 block mt-1 leading-normal">Replaces the profile photograph. Scribed live.</span>
              </div>

              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Folio Hero Title</label>
                <input
                  type="text"
                  value={deskHeroTitle}
                  onChange={(e) => setDeskHeroTitle(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#802334]"
                />
              </div>

              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Folio Hero Subtitle</label>
                <textarea
                  value={deskHeroSubtitle}
                  onChange={(e) => setDeskHeroSubtitle(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#802334] min-h-[50px]"
                />
              </div>

              <div>
                <label className="block font-sans uppercase text-[9px] text-[#111111]/50 tracking-wider mb-1 font-medium">Biography</label>
                <textarea
                  value={deskBioText}
                  onChange={(e) => setDeskBioText(e.target.value)}
                  className="w-full border border-[#111111]/10 p-2 text-xs bg-white text-[#111111] focus:outline-none focus:border-[#802334] min-h-[120px] font-serif leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#802334] text-white py-2 uppercase text-[10px] tracking-wider font-sans font-medium hover:opacity-90 transition shadow-sm mt-2 cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
