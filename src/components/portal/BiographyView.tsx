import React, { useState, useEffect } from 'react';
import { BiographyItem, IdentityProfile, User } from '../../types';
import { stripMarkdown, parseInlineFormatting } from '../../utils';
import { SignatureRenderer } from '../desk/SignatureRenderer';
import { PresentationSpec, getPresentationSpec } from '../../presentation';
import { Fingerprint, Edit3, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { IdentityStudio } from './IdentityStudio';
import { db } from '../../db/mockDb';
import { firestoreService } from '../../utils/firestoreService';

interface BiographyViewProps {
  authorProfile: IdentityProfile;
  currentAuthor: User;
  currentUser: User | null;
  selectedAuthorId: string;
  setEditingBioItem: (item: BiographyItem | null) => void;
  setShowAddBioModal: (show: boolean) => void;
  handleRemoveBioItem: (itemId: string) => void;
  presentationSpec?: PresentationSpec;
}

export function BiographyView({
  authorProfile,
  currentAuthor,
  currentUser,
  selectedAuthorId,
  setEditingBioItem,
  setShowAddBioModal,
  handleRemoveBioItem,
  presentationSpec,
}: BiographyViewProps) {
  const activeSpec = presentationSpec || getPresentationSpec('Essay');
  const { refreshDbState } = useAppContext();

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(authorProfile.biography || '');
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  useEffect(() => {
    setEditedBio(authorProfile.biography || '');
  }, [authorProfile.biography]);

  const handleSaveBio = async () => {
    const updatedIdentity: IdentityProfile = {
      ...authorProfile,
      biography: editedBio
    };

    await firestoreService.saveIdentity(updatedIdentity);

    db.updateIdentity(updatedIdentity);
    setIsEditingBio(false);
    refreshDbState();
  };
  return (
    <div className="space-y-16">
      {/* Intro Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-stone-300 pb-12">
        <div className="lg:col-span-8 space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-[#111111] text-left">
            Biography
          </h2>
          
          <div className="relative group/bio">
            {isEditingBio ? (
              <div className="space-y-2 py-2 text-left">
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="w-full border border-stone-200 p-3 rounded text-sm font-serif leading-relaxed text-[#111111]/90 focus:outline-none focus:border-[#802334] min-h-[200px] resize-y"
                  placeholder="Enter a description of yourself, your intellectual background, or interests..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBio(false)}
                    className="px-2.5 py-1 border border-stone-200 text-stone-600 rounded text-[10px] uppercase font-mono tracking-wider hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBio}
                    className="px-2.5 py-1 bg-[#802334] text-white rounded text-[10px] uppercase font-mono tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    Save Biography
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="font-serif text-stone-900 leading-relaxed text-justify text-sm md:text-base font-normal space-y-4 pr-2">
                  {authorProfile.biography ? (
                    authorProfile.biography.split(/\n+/).map((para, index) => (
                      <p key={index}>
                        {parseInlineFormatting(para.trim())}
                      </p>
                    ))
                  ) : (
                    <p className="text-stone-400">
                      No biography written yet. Click edit to write one!
                    </p>
                  )}
                </div>
                {currentUser?.id === selectedAuthorId && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="absolute -top-6 right-0 opacity-0 group-hover/bio:opacity-100 transition-opacity p-1 text-stone-400 hover:text-[#802334] flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider cursor-pointer"
                    title="Edit Biography"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Biography
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Signature stamp card representation */}
        <div style={{ fontSize: '14px' }} className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-stone-300 pt-8 lg:pt-0 lg:pl-8 text-center select-none">
          <span className="font-sans text-[9px] uppercase tracking-widest text-[#111111]/40 block mb-2">Signature</span>
          
          {/* Signature Graphic Area with Baseline */}
          <div className="relative w-[22em] h-[6.47em] mx-auto overflow-visible mix-blend-multiply flex items-center justify-center shrink-0">
            {(() => {
              const sig = authorProfile.signatures.find(s => s.status === 'Default');
              const type = sig?.type || 'drawn';
              const strokes = sig?.strokes || [];
              const typedText = sig?.typedText || currentAuthor.signature || '';

              if (type === 'typed' || strokes.length === 0) {
                const cw = sig?.penStyle?.canvasWidth || 680;
                const ch = sig?.penStyle?.canvasHeight || 200;
                const yOff = sig?.typographyStyle?.yOffset ?? 30;
                
                // Calculate the actual font size to determine a safe bounding box height
                const baseSize = !typedText ? 48 : (typedText.length > 25 ? 24 : (typedText.length > 18 ? 32 : (typedText.length > 12 ? 40 : 48)));
                const scale = sig?.typographyStyle?.scale || 1;
                const actualFontSize = baseSize * scale;
                
                // Dynamically adjust the viewBox height to perfectly wrap the text without chopping
                const viewBoxHeight = Math.max(120, actualFontSize * 2.8);
                const cropY = (ch / 2) + yOff - (viewBoxHeight / 2);

                return (
                  <div className="w-full h-full flex items-center justify-center z-10 relative">
                    <svg 
                      viewBox={`0 ${cropY} ${cw} ${viewBoxHeight}`}
                      className="w-full h-full drop-shadow-sm origin-center"
                    >
                      <foreignObject width={cw} height={ch} y={0}>
                        <div className="flex items-center justify-center w-full h-full">
                          <span 
                            style={{ 
                              fontFamily: sig?.fontFamily || 'cursive', 
                              fontSize: `${actualFontSize}px`, 
                              color: "#802334", 
                              letterSpacing: `${(sig?.typographyStyle?.letterSpacing || 0) * scale}px`, 
                              fontWeight: sig?.typographyStyle?.fontWeight || 500, 
                              transform: `translateY(${yOff}px) rotate(${sig?.typographyStyle?.slantAngle || 0}deg)`,
                              transformOrigin: 'center center',
                              whiteSpace: 'nowrap',
                              lineHeight: 1
                            }}
                            className="text-center block"
                          >
                            {typedText || 'Sign Here'}
                          </span>
                        </div>
                      </foreignObject>
                    </svg>
                  </div>
                );
              } else {
                return (
                  <SignatureRenderer 
                    representation={sig?.representation}
                    strokes={strokes}
                    type="drawn"
                    typedText=""
                    fontFamily={sig?.fontFamily}
                    typographyStyle={sig?.typographyStyle}
                    penStyle={sig?.penStyle}
                    renderBaselineLayout={false}
                    className="w-full h-full overflow-visible"
                    color="#802334"
                    strokeWidth={2.5}
                    enableBleed={true}
                  />
                );
              }
            })()}
          </div>
          
          <div className="border-t border-stone-300/80 pt-4 mt-[0.5em] space-y-2">
            <div>
              <span className="block text-[9px] font-sans uppercase tracking-wider text-[#111111]/40">Pen Name</span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="font-sans text-[1em] uppercase tracking-widest text-black font-semibold leading-none text-center w-full">
                  {currentAuthor.penName}
                </span>
                {currentAuthor.isAi && (
                  <div className="relative group/tooltip inline-block select-none">
                    <Sparkles className="w-3.5 h-3.5 text-[#802334] transition-transform duration-700 ease-in-out group-hover/tooltip:rotate-[360deg] cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-stone-900 text-stone-100 text-[8px] font-mono rounded shadow-md whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
                      AI Editorial Fellow
                    </div>
                  </div>
                )}
              </div>
            </div>
            {authorProfile.displayName && authorProfile.displayName !== currentAuthor.penName && (
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-wider text-[#111111]/40">Full Name</span>
                <span className="font-serif font-semibold text-[#111111] text-sm">{authorProfile.displayName}</span>
              </div>
            )}
            {authorProfile.affiliation && (
              <div>
                <span className="block text-[9px] font-sans uppercase tracking-wider text-[#111111]/40">Affiliation</span>
                <span className="font-serif font-semibold text-[#111111] text-sm">{authorProfile.affiliation}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-300/70">
              <span className="block text-[9px] font-sans uppercase tracking-wider text-[#111111]/40 mb-0.5">Email / Contact</span>
              <a 
                href={`mailto:${currentAuthor.email}`} 
                className="font-mono text-xs text-adjung-maroon hover:underline block"
              >
                {currentAuthor.email}
              </a>
            </div>
            {currentUser?.id === selectedAuthorId && (
              <div className="pt-3 border-t border-stone-300/70 mt-2">
                <button
                  onClick={() => setShowIdentityModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#802334] text-white hover:opacity-95 py-2 px-3 rounded font-mono text-[9px] uppercase tracking-wider transition cursor-pointer font-semibold shadow-sm"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Edit Identity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chronological Life Timeline */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-stone-300 pb-3">
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
          <div className="relative border-l border-stone-300 ml-4 md:ml-32 pl-6 space-y-8 py-2">
            {authorProfile.lifeTimeline.map(item => (
              <div key={item.id} className="relative group">
                
                {/* Left float year for desktop layout */}
                <span className="absolute -left-[145px] top-0.5 hidden md:block w-24 text-right font-serif font-bold text-lg text-[#802334]">
                  {item.year}
                </span>

                {/* Bullet on timeline */}
                <span className="absolute -left-[31px] top-2 w-3 h-3 rounded-full bg-[#FDFDFD] border-2 border-[#802334]" />

                {/* Content block */}
                <div className="space-y-2 max-w-2xl pb-6 text-left">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="md:hidden font-serif font-bold text-base text-[#802334]">{item.year}</span>
                    <span className="md:hidden text-stone-300">|</span>
                    <h4 className="font-serif font-semibold text-stone-900 text-[17px] leading-tight">
                      {parseInlineFormatting(item.title)}
                    </h4>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#802334] font-semibold bg-[#802334]/5 px-1.5 py-0.5 rounded border border-[#802334]/15">
                      {item.category}
                    </span>
                  </div>
                  <p className="font-serif text-stone-700 text-sm leading-relaxed text-justify">
                    {item.description}
                  </p>
                  
                  {/* Remove milestone for owner */}
                  {currentUser && currentUser.id === selectedAuthorId && (
                    <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this milestone permanently?')) {
                            handleRemoveBioItem(item.id);
                          }
                        }}
                        className="text-[9px] font-mono uppercase tracking-wider text-red-700 hover:text-red-900 transition-colors font-bold cursor-pointer"
                      >
                        ✕ Delete Milestone
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Identity Studio Modal */}
      {showIdentityModal && (
        <IdentityStudio isModal={true} onClose={() => setShowIdentityModal(false)} />
      )}
    </div>
  );
}
