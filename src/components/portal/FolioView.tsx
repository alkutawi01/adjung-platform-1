import React from 'react';
import { User, Entry, WriterProfile, SystemSettings } from '../../types';
import { BRAND } from '../../config/brand';
import { isArabicText, parseInlineFormatting, toRoman, truncateTitle, formatSerialNumber } from '../../utils';
import { SignatureRenderer } from '../desk/SignatureRenderer';
import { TimelineEntryCollapseRenderer } from '../rendering/TimelineEntryCollapseRenderer';
import { EntryRenderer } from '../rendering/EntryRenderer';
import { FileText, ArrowRight, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { supabaseService as firestoreService } from '../../utils/supabaseService';
import { resolveDigitalSignature } from '../../utils/signatureResolvers';

interface FolioViewProps {
  currentAuthor: User | null;
  authorProfile: WriterProfile | null;
  selectedEntry: Entry | null;
  systemSettings: SystemSettings;
  allUniqueTags: string[];
  selectedTagFilter: string;
  setSelectedTagFilter: (tag: string) => void;
  sortedYears: number[];
  timelineGroupedByYear: Record<number, Entry[]>;
  expandedNoteIds: string[];
  toggleNote: (id: string) => void;
  setSelectedEntry: (entry: Entry | null) => void;
  setSelectedAuthorId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setShowLoginModal: (show: boolean) => void;
  setLoginError: (error: string) => void;
}

export const FolioView: React.FC<FolioViewProps> = ({
  currentAuthor,
  authorProfile,
  selectedEntry,
  systemSettings,
  allUniqueTags,
  selectedTagFilter,
  setSelectedTagFilter,
  sortedYears,
  timelineGroupedByYear,
  expandedNoteIds,
  toggleNote,
  setSelectedEntry,
  setSelectedAuthorId,
  setActiveTab,
  setShowLoginModal,
  setLoginError,
}) => {
  const { currentUser, identities, refreshDbState } = useAppContext();
  const [noteExceedsMap, setNoteExceedsMap] = React.useState<Record<string, boolean>>({});
  const [isEditingHeader, setIsEditingHeader] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(authorProfile?.heroTitle || '');
  const [editedSubtitle, setEditedSubtitle] = React.useState(authorProfile?.heroSubtitle || '');

  React.useEffect(() => {
    setEditedTitle(authorProfile?.heroTitle || '');
    setEditedSubtitle(authorProfile?.heroSubtitle || '');
  }, [authorProfile]);

  const handleRestrictedAction = (action: () => void, actionType: 'expand' | 'read' = 'read') => {
    if (!currentUser) {
      setLoginError(
        actionType === 'expand'
          ? 'Sign in or register to read the full note.'
          : 'Sign in or register to read the full work.'
      );
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const handleKeyDownShortcut = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, setter: (val: string) => void) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const text = target.value;
      
      if (start === end) {
        const newText = text.slice(0, start) + '**' + text.slice(start);
        setter(newText);
        setTimeout(() => {
          target.focus();
          target.setSelectionRange(start + 1, start + 1);
        }, 0);
      } else {
        const selectedText = text.slice(start, end);
        const isAlreadyItalic = selectedText.startsWith('*') && selectedText.endsWith('*');
        let newText = '';
        let newCursorStart = start;
        let newCursorEnd = end;
        
        if (isAlreadyItalic) {
          const unwrapped = selectedText.slice(1, -1);
          newText = text.slice(0, start) + unwrapped + text.slice(end);
          newCursorEnd = start + unwrapped.length;
        } else {
          const wrapped = `*${selectedText}*`;
          newText = text.slice(0, start) + wrapped + text.slice(end);
          newCursorStart = start;
          newCursorEnd = end + 2;
        }
        
        setter(newText);
        setTimeout(() => {
          target.focus();
          target.setSelectionRange(newCursorStart, newCursorEnd);
        }, 0);
      }
    }
  };

  const handleSaveHeader = async () => {
    if (!currentAuthor) return;
    const updatedProfile = {
      authorId: currentAuthor.id,
      heroTitle: editedTitle,
      heroSubtitle: editedSubtitle
    };
    
    await firestoreService.saveProfile(updatedProfile);

    setIsEditingHeader(false);
    refreshDbState();
  };

  return (
    !currentAuthor ? (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 space-y-8 select-none">
        <div className="space-y-3">
          <span className="block font-mono text-[8px] md:text-[9px] uppercase tracking-[0.25em] text-adjung-maroon mb-2">
            Welcome to {BRAND.name}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 leading-tight">
            Independent Folios
          </h2>
          <div className="h-px w-24 bg-adjung-maroon/30 mx-auto my-4" />
          <p className="font-sans text-stone-600 text-sm md:text-base leading-loose max-w-lg mx-auto">
            {systemSettings.editorialPolicy}
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <p className="font-sans text-xs text-stone-500 max-w-md mx-auto">
            To view individual timelines, articles, essays, and writer profiles, please select a registered writer from our directory or sign in if you are an editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className="bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] font-mono text-xs uppercase tracking-wider px-6 py-3 rounded shadow transition cursor-pointer"
            >
              Browse Writers Directory
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginError('');
                setShowLoginModal(true);
              }}
              className="border border-stone-300 hover:border-adjung-maroon hover:text-adjung-maroon text-stone-700 font-mono text-xs uppercase tracking-wider px-6 py-3 rounded transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Writer Hero Block */}
        <div className="text-center md:text-left border-b border-stone-300 pb-8 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 md:gap-8">
          <div className="space-y-3 max-w-3xl flex-grow relative group">
            {isEditingHeader ? (
              <div className="space-y-3 py-2 text-left w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value.slice(0, 200))}
                    onKeyDown={(e) => handleKeyDownShortcut(e, setEditedTitle)}
                    maxLength={200}
                    className="w-full border border-stone-200 p-2 pr-16 rounded text-[22px] md:text-[26px] font-sans text-[#111111] focus:outline-none focus:border-adjung-maroon leading-tight"
                    placeholder="Folio Hero Title"
                  />
                  <span className="absolute right-2 bottom-2 text-[9px] font-mono text-stone-400 select-none">
                    {editedTitle.length}/200
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={editedSubtitle}
                    onChange={(e) => setEditedSubtitle(e.target.value.slice(0, 300))}
                    onKeyDown={(e) => handleKeyDownShortcut(e, setEditedSubtitle)}
                    maxLength={300}
                    className="w-full border border-stone-200 p-2 pr-16 rounded text-[14px] md:text-[15px] font-sans text-stone-500 focus:outline-none focus:border-adjung-maroon min-h-[140px] leading-relaxed"
                    placeholder="Folio Hero Subtitle"
                  />
                  <span className="absolute right-2 bottom-2 text-[9px] font-mono text-stone-400 select-none">
                    {editedSubtitle.length}/300
                  </span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingHeader(false)}
                    className="px-2.5 py-1 border border-stone-200 text-stone-600 rounded text-[10px] uppercase font-mono tracking-wider hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHeader}
                    className="px-2.5 py-1 bg-adjung-maroon text-white rounded text-[10px] uppercase font-mono tracking-wider hover:opacity-95 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-[22px] md:text-[26px] font-normal tracking-tight text-[#111111] leading-tight relative group/title inline-block">
                  <span>{parseInlineFormatting(authorProfile?.heroTitle || '')}</span>
                  {currentUser?.id === currentAuthor.id && (
                    <button
                      onClick={() => setIsEditingHeader(true)}
                      className="inline-block align-middle ml-2 opacity-0 group-hover/title:opacity-100 transition-opacity p-1 text-stone-400 hover:text-adjung-maroon cursor-pointer"
                      title="Edit Banner Title & Subtitle"
                    >
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </h2>
                <p className="font-sans text-[14px] md:text-[15px] text-stone-500 leading-relaxed max-w-xl">
                  {parseInlineFormatting(authorProfile?.heroSubtitle || '')}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('bio')}
                  className="font-mono text-[10px] uppercase tracking-wider text-stone-400 hover:text-adjung-maroon transition cursor-pointer"
                >
                  View Biography
                </button>
              </>
            )}
          </div>
          {/* Writer Signature replacement of traditional avatar (refined personal seal style) */}
          <div className="flex-shrink-0 text-center border-l border-stone-300 pl-8 py-1.5 select-none flex flex-col justify-center">
            <div className="h-28 w-72 flex items-center justify-center z-10 relative mix-blend-multiply">
              {currentAuthor && (() => {
                const heroSig = resolveDigitalSignature(currentAuthor.id, identities);
                return (
                  <SignatureRenderer
                    representation={heroSig?.representation}
                    strokes={heroSig?.strokes || []}
                    type={heroSig?.type || 'drawn'}
                    typedText={heroSig?.typedText || ''}
                    fontFamily={heroSig?.fontFamily}
                    typographyStyle={heroSig?.typographyStyle}
                    penStyle={heroSig?.penStyle}
                    className="w-full h-full overflow-visible origin-center"
                    color="rgba(128, 35, 52, 0.85)"
                    strokeWidth={2.5}
                    enableBleed={true}
                  />
                );
              })()}
            </div>
          </div>
        </div>


        {/* Grouped timeline list */}
        {sortedYears.length === 0 ? (
          <div className="text-center py-20 bg-transparent border-none max-w-xl mx-auto">
            <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-stone-700 text-lg">Folio Archives Empty</h3>
            <p className="font-sans text-xs text-stone-500 mt-1">This writer has not yet cataloged any public publications in this category.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map(year => {
              // Filter entries for this year
              const yearEntries = timelineGroupedByYear[year].filter(entry => 
                selectedTagFilter === 'All' ? true : entry.tags.includes(selectedTagFilter)
              );

              if (yearEntries.length === 0) return null;

              return (
                <section key={year} className="relative pl-0 md:pl-28">
                  {/* Left side year indicator (Floating anchor) */}
                  <div className="absolute left-0 top-1 text-center hidden md:block">
                    <span className="font-mono text-2xl font-medium tracking-tight text-adjung-maroon block">
                      {year}
                    </span>
                  </div>

                  <div className="border-t border-stone-200/60 pt-3 mb-3 md:hidden">
                    <span className="font-mono text-xl font-medium tracking-tight text-adjung-maroon mr-2">{year}</span>
                  </div>

                  {/* Timeline items list */}
                  <div className="space-y-6">
                    {yearEntries.map((item) => {
                      const dateObj = new Date(item.publishedDate || item.createdDate);
                      const isAr = isArabicText(item.title || item.content);
                      // Note has no title by design and is meant to read as a
                      // short, standalone fragment (X/Threads-post register),
                      // not a compressed essay — so it skips the title slot,
                      // the essay's centered/justified layout, and the drop
                      // cap. Research backs the drop-cap cut specifically:
                      // it's a long-form-narrative convention (reserved for
                      // ~1200+ word prose with a deliberate opening), and
                      // readers rate it as "trying too hard" on short/
                      // transactional posts (Nieman Lab, Feb 2026).
                      const isNote = item.contentType === 'Note';

                      const formatDate = (d: Date) => {
                        const day = d.getDate();
                        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                        return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
                      };

                      // serial_no / current_version / reading_time_minutes are
                      // authoritative, DB-trigger-computed columns (SPEC-028
                      // §14.1) — this card and the full-view header
                      // (EntryRenderer.tsx) both just read them now, instead
                      // of each independently recomputing (and drifting from)
                      // the same numbers.
                      const serialNum = formatSerialNumber(item.serialNo);
                      const versionStr = item.currentVersion || 'v1.0';
                      const readingTimeStr = `${item.readingTimeMinutes || 1} MIN READ`;
                      const authorDomain = `${currentAuthor?.username || 'writer'}.adjung.com`;
                      const displayTitle = truncateTitle(item.title || '', 55);

                      return (
                        <div
                          key={item.id}
                          className={`group border rounded-md shadow-[0_1.5px_4px_rgba(0,0,0,0.015),0_1px_2px_rgba(0,0,0,0.008)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.035)] transition-all duration-300 p-8 flex flex-col justify-between select-text cursor-default relative overflow-hidden min-h-[180px] w-full ${
                            isNote ? 'bg-[#FDFBF7] border-adjung-maroon/15 text-left' : 'bg-white border-stone-200/90 text-center'
                          }`}
                        >
                          {/* Content Area — Essay centers around its title;
                              Note (no title) reads left-aligned instead, so
                              the card doesn't visually collapse around an
                              empty center. */}
                          <div className={`flex-1 flex flex-col justify-center select-text ${isNote ? 'items-start' : 'items-center'}`}>
                            {/* Metadata bar — mirrors the full-view header bar */}
                            <div className="w-full flex items-center justify-between gap-3 text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-4 border-b border-adjung-maroon pb-3 select-text">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {isNote && (
                                  <span className="text-adjung-maroon font-bold border border-adjung-maroon/30 rounded px-1.5 py-0.5 mr-1">NOTE</span>
                                )}
                                <span>{serialNum}</span>
                                <span className="text-stone-300 font-bold">·</span>
                                <span>{versionStr}</span>
                                <span className="text-stone-300 font-bold">·</span>
                                <span>{formatDate(dateObj)}</span>
                                {!isNote && (
                                  <>
                                    <span className="text-stone-300 font-bold">·</span>
                                    <span>{readingTimeStr}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="normal-case text-stone-400">{authorDomain}</span>
                                {/* Visual echo of the full view's actions-menu
                                    glyph — decorative here, not wired to
                                    EntryActionsMenu (that lives on the
                                    destination page, not the preview page). */}
                                <span className="text-stone-300 tracking-widest select-none" aria-hidden="true">⋯</span>
                              </div>
                            </div>

                            {/* Title — serif to match the full-view h1, capped
                                to one line so the card never grows past its
                                fixed slot height. Note skips this entirely —
                                it has no title by design (a NOTE pill above
                                already marks the type). */}
                            {!isNote && (
                              <h3 className={`text-xl md:text-2xl font-serif text-stone-900 leading-snug tracking-tight font-medium select-text px-9 ${isAr ? 'font-arabic' : ''}`}>
                                {parseInlineFormatting(displayTitle)}
                              </h3>
                            )}

                            {/* Byline — "by" stays mono/UI, the name itself
                                is serif with the same underline treatment as
                                full view's author stamp. */}
                            <div className={`flex items-baseline gap-1.5 mt-1.5 mb-3.5 select-text ${isNote ? '' : ''}`}>
                              <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">by</span>
                              <span className="font-serif font-medium text-stone-700 text-[11px] border-b border-stone-200 pb-0.5">
                                {currentAuthor?.penName || currentAuthor?.displayName || 'Anonymous'}
                              </span>
                            </div>

                            {/* Short Excerpt. Essay: 2 lines, justified,
                                centered, with a floating drop cap on its
                                first letter (::first-letter, text-4xl serif)
                                — a long-form-narrative convention. Note gets
                                none of that: no drop cap (research backs this
                                cut specifically — drop caps read as
                                "trying too hard" on short/transactional
                                posts; they're meant for ~1200+ word prose
                                with a deliberate opening), left-aligned
                                rather than justified (justify reads as
                                "formatted document," not "quick post"), and
                                the full handwritten-font body text is the
                                whole point — nothing else needs to compete
                                with it. Arabic also skips the drop cap (not
                                a script convention) but keeps Essay's
                                justified/centered treatment.

                                Truncation: maxWordsOverride/maxCharsOverride
                                keep the component's OWN word-safe cut (it
                                never splits mid-word — see
                                truncatePreviewContent) inside a budget that
                                actually fits 2 lines at this font size, so
                                its "..." is what readers see. line-clamp-3
                                below is a generous safety net only, not the
                                primary cut mechanism — CSS line-clamp has no
                                notion of word boundaries and was the actual
                                cause of the mid-word "menja..." cutoff. */}
                            <div className={`text-stone-500 leading-relaxed select-text w-full line-clamp-3 ${
                              isNote
                                ? 'text-sm text-left'
                                : `text-xs max-w-xl mx-auto px-9 [&_p]:!text-justify ${isAr ? '' : '[&::first-letter]:text-4xl [&::first-letter]:font-serif [&::first-letter]:font-normal [&::first-letter]:text-adjung-maroon [&::first-letter]:float-left [&::first-letter]:leading-none [&::first-letter]:mr-1 [&::first-letter]:mt-0.5'}`
                            }`}>
                              <TimelineEntryCollapseRenderer
                                item={item}
                                isExpanded={false}
                                onToggle={() => {}}
                                accentFirstWord
                                maxWordsOverride={isNote ? 45 : 22}
                                maxCharsOverride={isNote ? 240 : 115}
                                onOpenText={() => {}}
                                showInlineToggle={false}
                              />
                            </div>
                          </div>

                          {/* Circular Action Button -> on the right. Maroon
                              by default (not just on hover) and the ONLY
                              click target on the card — the box itself is
                              cursor-default, not a click surface. */}
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestrictedAction(() => setSelectedEntry(item));
                              }}
                              className="w-8 h-8 rounded-full border border-adjung-maroon bg-white flex items-center justify-center text-adjung-maroon hover:text-white hover:bg-adjung-maroon transition-all duration-200 cursor-pointer shadow-sm"
                              title="Read full essay"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    )
  );
};
