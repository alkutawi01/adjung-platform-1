import React from 'react';
import { BiographyItem, IdentityProfile, User } from '../types';

interface BiographyViewProps {
  authorProfile: IdentityProfile;
  currentAuthor: User;
  currentUser: User | null;
  selectedAuthorId: string;
  setEditingBioItem: (item: BiographyItem | null) => void;
  setShowAddBioModal: (show: boolean) => void;
  handleRemoveBioItem: (itemId: string) => void;
}

export function BiographyView({
  authorProfile,
  currentAuthor,
  currentUser,
  selectedAuthorId,
  setEditingBioItem,
  setShowAddBioModal,
  handleRemoveBioItem,
}: BiographyViewProps) {
  return (
    <div className="space-y-16">
      {/* Intro Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-stone-200/60 pb-12">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#802334] rounded-full" />
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40">Biography</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-[#111111] text-left">
            Biography
          </h2>
          
          <div className="font-serif text-base text-[#111111]/80 leading-relaxed space-y-4 whitespace-pre-line text-justify pr-2">
            {authorProfile.biography}
          </div>
        </div>

        {/* Signature stamp card representation */}
        <div className="lg:col-span-4 bg-[#FDFDFD] border border-stone-200/65 rounded p-6 text-center shadow-sm select-none">
          <span className="font-sans text-[9px] uppercase tracking-widest text-[#111111]/40 block mb-2">Signature</span>
          <div 
            className="text-5xl text-[#802334]/80 py-4 rotate-[-3deg]" 
            style={{ fontFamily: "'Pinyon Script', 'Georgia', cursive" }}
          >
            {currentAuthor.signature}
          </div>
          <div className="border-t border-stone-200/55 pt-4 mt-2">
            <span className="block text-[10px] font-sans uppercase tracking-wider text-[#111111]/40">Pen Name</span>
            <span className="font-serif font-semibold text-[#111111] text-sm">{currentAuthor.penName}</span>
            <span className="block font-mono text-[9px] text-[#111111]/40 mt-1">{currentAuthor.email}</span>
          </div>
        </div>
      </div>

      {/* Chronological Life Timeline */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <h3 className="font-serif text-xl font-semibold tracking-tight text-[#111111]">
            Timeline
          </h3>
          {currentUser && currentUser.id === selectedAuthorId && (
            <button
              type="button"
              onClick={() => {
                setEditingBioItem(null);
                setShowAddBioModal(true);
              }}
              className="bg-[#802334] text-white px-3 py-1.5 uppercase tracking-wider text-[10px] font-sans font-medium hover:opacity-90 transition shadow-sm"
            >
              Add Milestone
            </button>
          )}
        </div>

        {authorProfile.lifeTimeline.length === 0 ? (
          <p className="text-xs text-[#111111]/40 italic">No timeline milestones cataloged yet.</p>
        ) : (
          <div className="relative border-l border-stone-200/60 ml-4 md:ml-32 pl-6 space-y-10 py-2">
            {authorProfile.lifeTimeline.map(item => (
              <div key={item.id} className="relative group">
                
                {/* Left float year for desktop layout */}
                <span className="absolute -left-[145px] top-0.5 hidden md:block w-24 text-right font-serif font-bold text-lg text-[#802334]">
                  {item.year}
                </span>

                {/* Bullet on timeline */}
                <span className="absolute -left-[31px] top-2 w-3 h-3 rounded-full bg-[#FDFDFD] border-2 border-[#802334]" />

                {/* Content block */}
                <div className="space-y-1.5 max-w-2xl bg-[#FDFDFD]/80 p-5 rounded border border-stone-200/40 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="md:hidden font-serif font-bold text-base text-[#802334]">{item.year}</span>
                      <span className="md:hidden text-stone-300">|</span>
                      <h4 className="font-serif font-semibold text-[#111111] text-base">{item.title}</h4>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 bg-[#111111]/5 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="font-serif text-[#111111]/70 text-sm leading-relaxed text-justify">
                    {item.description}
                  </p>
                  
                  {/* Remove milestone for owner */}
                  {currentUser && currentUser.id === selectedAuthorId && (
                    <div className="pt-2 text-right border-t border-stone-200/30 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this milestone permanently?')) {
                            handleRemoveBioItem(item.id);
                          }
                        }}
                        className="text-[10px] font-mono uppercase text-red-700 hover:underline"
                      >
                        Delete Milestone
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
