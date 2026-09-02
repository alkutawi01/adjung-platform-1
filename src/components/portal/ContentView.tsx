import React, { useState, useEffect } from 'react';
import { Rss, SlidersHorizontal, X, Search, ArrowRight } from 'lucide-react';
import { Entry, User } from '../../types';
import { isArabicText, flattenBlocksForPreview, truncateAtWord, formatSerialNumber, resolveEntryCanonicalUrl } from '../../utils';
import { getContentEntries, getContentFacets, resolveContentAuthorName, resolveContentAuthorSig } from '../../utils/getContentEntries';
import { useAppContext } from '../../context/AppContext';
import { resolveSignatureText } from '../../utils/signatureResolvers';

interface ContentViewProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  setSelectedAuthorId: (id: string) => void;
}

const PAGE_SIZE = 15;
const POPULAR_COUNT = 4;
const SEARCH_RESULT_LIMIT = 8;

function newestTimestamp(entries: Entry[]): number {
  return entries
    .filter(e => e.status === 'Published' && (e.contentType === 'Note' || e.contentType === 'Essay'))
    .reduce((max, e) => Math.max(max, e.publishedDate ? new Date(e.publishedDate).getTime() : 0), 0);
}

function formatDayLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, today)) return `Today · ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday · ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function ContentView({ entries, users, setSelectedEntry, setSelectedAuthorId }: ContentViewProps) {
  const { currentUser, identities, saveEntry, setActiveTab } = useAppContext();

  const [page, setPage] = useState(1);
  const [selectedWriters, setSelectedWriters] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // The modal is only meaningful below the xl breakpoint, where the
  // persistent sidebar is hidden — React state doesn't know about CSS
  // media queries, so widening the window past xl (e.g. after opening the
  // modal at a narrower width) left it stuck open on top of the sidebar
  // that had just appeared, showing the same filters twice at once.
  useEffect(() => {
    const closeIfWide = () => {
      if (window.innerWidth >= 1280) setShowFilterPanel(false);
    };
    window.addEventListener('resize', closeIfWide);
    return () => window.removeEventListener('resize', closeIfWide);
  }, []);

  // Snapshot on first view — anything published after this moment is "new"
  // and waits behind an explicit "Show N new" action (same idea as X's
  // "Show 35 posts" banner) rather than silently reordering the list a
  // reader is already partway through, or auto-refreshing behind their
  // back. No inferred personalization either way — just a plain count.
  const [baselineTimestamp, setBaselineTimestamp] = useState(() => newestTimestamp(entries));

  const authorIds = React.useMemo(() => Array.from(selectedWriters), [selectedWriters]);
  const tags = React.useMemo(() => Array.from(selectedTopics), [selectedTopics]);
  const hasActiveFilters = authorIds.length > 0 || tags.length > 0;

  const { writers, topics } = React.useMemo(() => getContentFacets(entries, users), [entries, users]);

  // A search-first filter picker, not a browse-everything list — an
  // auto-listed page of every writer/topic doesn't survive past a handful
  // of either. At any scale, this only ever renders a small "popular"
  // starter set or a capped set of live matches, never the full roster.
  const trimmedQuery = query.trim().toLowerCase();
  const matchedWriters = trimmedQuery
    ? writers.filter(w => w.name.toLowerCase().includes(trimmedQuery)).slice(0, SEARCH_RESULT_LIMIT)
    : writers.slice(0, POPULAR_COUNT);
  const matchedTopics = trimmedQuery
    ? topics.filter(t => t.tag.toLowerCase().includes(trimmedQuery)).slice(0, SEARCH_RESULT_LIMIT)
    : topics.slice(0, POPULAR_COUNT);

  const { results, total, hasMore } = React.useMemo(
    () => getContentEntries({ entries, page, pageSize: PAGE_SIZE, authorIds, tags }),
    [entries, page, authorIds, tags]
  );

  // "New" is scoped to whatever's currently in view — under an active
  // filter, "3 new" means 3 new entries matching that filter, not 3 new
  // entries anywhere on the platform.
  const newCount = React.useMemo(() => {
    const { total: currentTotal } = getContentEntries({ entries, page: 1, pageSize: 1, authorIds, tags });
    const { total: baselineTotal } = getContentEntries({
      entries: entries.filter(e => !e.publishedDate || new Date(e.publishedDate).getTime() <= baselineTimestamp),
      page: 1,
      pageSize: 1,
      authorIds,
      tags,
    });
    return Math.max(0, currentTotal - baselineTotal);
  }, [entries, authorIds, tags, baselineTimestamp]);

  const showNewEntries = () => {
    setBaselineTimestamp(newestTimestamp(entries));
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedWriters(new Set());
    setSelectedTopics(new Set());
    setPage(1);
  };

  const toggleWriter = (authorId: string) => {
    setSelectedWriters(prev => toggleInSet(prev, authorId));
    setPage(1);
  };

  const toggleTopic = (tag: string) => {
    setSelectedTopics(prev => toggleInSet(prev, tag));
    setPage(1);
  };

  const openEntry = (entry: Entry) => {
    setSelectedAuthorId(entry.authorId);
    setSelectedEntry(entry);
  };

  const goWriteEssay = () => {
    setSelectedAuthorId(currentUser?.id || '');
    setActiveTab('desk');
  };

  // A quick Note, published straight from the feed — Threads/X's "What's
  // new?" composer, but scoped to Note only. Essay needs Desk's full
  // canvas (title, margin notes, the works), so that path is a redirect,
  // not a shrunk-down version crammed into this box. Deliberately doesn't
  // reuse createNewEntry() — that always routes into Desk as a Draft;
  // this stays on Content and publishes immediately, matching what a
  // "post inline" composer is actually for.
  const publishNote = () => {
    const text = noteDraft.trim();
    if (!text || !currentUser || isPublishing) return;
    setIsPublishing(true);

    const newId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const slugSuffix = Date.now().toString().slice(-4);
    const nowIso = new Date().toISOString();
    const identity = identities.find(i => i.accountId === currentUser.id) || null;

    const newEntry: Entry = {
      id: newId,
      authorId: currentUser.id,
      contentType: 'Note',
      status: 'Published',
      visibility: 'Public',
      createdDate: nowIso,
      updatedDate: nowIso,
      publishedDate: nowIso,
      title: '',
      slug: `note-${slugSuffix}`,
      tags: [],
      canonicalUrl: resolveEntryCanonicalUrl(
        { id: newId, authorId: currentUser.id, contentType: 'Note', slug: `note-${slugSuffix}`, status: 'Published', visibility: 'Public', createdDate: nowIso, updatedDate: nowIso, publishedDate: nowIso, title: '', tags: [] } as Entry,
        currentUser.username,
        entries,
        identity,
        currentUser.createdAt,
        currentUser.subdomainApprovedEarly,
        currentUser.isAi
      ),
      content: text,
    };

    saveEntry(newEntry);
    setNoteDraft('');
    setNoteFocused(false);
    setIsPublishing(false);
    setBaselineTimestamp(newestTimestamp([...entries, newEntry]));
  };

  const currentUserSig = currentUser
    ? resolveSignatureText(currentUser.id, currentUser.signature || '', identities)
    : '';

  let lastDayLabel = '';

  // Shared between the xl+ sidebar (rendered inline, room to spare) and
  // the centered modal (md-and-below, and the icon rail's "more" trigger)
  // — same search-first content either way, just a different container.
  const filterPickerBody = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search writers or topics…"
          className="w-full border border-stone-200 rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-adjung-maroon"
        />
      </div>

      {!trimmedQuery && (writers.length > 0 || topics.length > 0) && (
        <span className="block font-mono text-[9px] uppercase tracking-widest text-[#111111]/30">Popular</span>
      )}

      {matchedWriters.length > 0 && (
        <div className="space-y-1">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-[#111111]/50">Writers</span>
          {matchedWriters.map(w => (
            <button
              key={w.authorId}
              type="button"
              onClick={() => toggleWriter(w.authorId)}
              className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-[13px] font-serif transition-colors ${
                selectedWriters.has(w.authorId) ? 'bg-adjung-maroon text-white' : 'text-[#111111] hover:bg-adjung-maroon/[0.06]'
              }`}
            >
              <span className="truncate">{w.name}</span>
              <span className={`font-mono text-[10px] shrink-0 ${selectedWriters.has(w.authorId) ? 'text-white/70' : 'text-[#111111]/40'}`}>{w.count}</span>
            </button>
          ))}
        </div>
      )}

      {matchedTopics.length > 0 && (
        <div className="space-y-1.5">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-[#111111]/50">Topics</span>
          <div className="flex flex-wrap gap-1.5">
            {matchedTopics.map(t => (
              <button
                key={t.tag}
                type="button"
                onClick={() => toggleTopic(t.tag)}
                className={`font-mono text-[10px] uppercase tracking-wide rounded px-2 py-1 transition-colors ${
                  selectedTopics.has(t.tag) ? 'bg-adjung-maroon text-white' : 'bg-adjung-maroon/[0.06] text-[#111111]/60 hover:bg-adjung-maroon/[0.12]'
                }`}
              >
                {t.tag} <span className="opacity-60">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {trimmedQuery && matchedWriters.length === 0 && matchedTopics.length === 0 && (
        <p className="text-xs text-stone-400 text-center py-2">No match for "{query}".</p>
      )}

      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} className="w-full text-center font-mono text-[10px] uppercase tracking-wider text-adjung-maroon hover:underline pt-1 border-t border-stone-100">
          Clear all filters
        </button>
      )}
    </div>
  );

  const activeChips = hasActiveFilters && (
    <div className="flex flex-wrap items-center gap-1.5">
      {writers.filter(w => selectedWriters.has(w.authorId)).map(w => (
        <span key={w.authorId} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide bg-adjung-maroon/10 text-adjung-maroon rounded-full pl-2.5 pr-1.5 py-1">
          {w.name}
          <button type="button" onClick={() => toggleWriter(w.authorId)} aria-label={`Remove ${w.name} filter`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {topics.filter(t => selectedTopics.has(t.tag)).map(t => (
        <span key={t.tag} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide bg-adjung-maroon/10 text-adjung-maroon rounded-full pl-2.5 pr-1.5 py-1">
          {t.tag}
          <button type="button" onClick={() => toggleTopic(t.tag)} aria-label={`Remove ${t.tag} filter`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto relative">
      {/* xl+ only: a persistent left rail, vertically centered in the
          viewport (not top-pinned like Threads' own nav) — full
          search+facets, room to spare. Below xl: no second trigger here —
          the header's own "Filters" button is the sole entry point, all
          the way down to mobile. (What else might live in this margin at
          md-xl is still open — not decided yet.) */}
      <aside className="hidden xl:block fixed left-[max(12px,calc(50%-640px))] top-1/2 -translate-y-1/2 z-30">
        <div className="w-56 bg-white border border-stone-200/70 rounded-lg shadow-sm p-4 max-h-[70vh] overflow-y-auto">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-[#111111]/40 mb-3">Filters</span>
          {filterPickerBody}
        </div>
      </aside>

      {/* Centered modal — used on md-and-below (the header's own "Filters"
          button) and by the icon rail's search icon on md-to-xl. Same
          picker body as the xl sidebar, just a different container so it
          never needs its own duplicate logic. */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowFilterPanel(false)} aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white border border-stone-200 rounded-lg shadow-xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#111111]/40">Filter by writer or topic</span>
              <button type="button" onClick={() => setShowFilterPanel(false)} aria-label="Close filters">
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            {filterPickerBody}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8 text-left">
        <div className="border-b border-[#111111]/10 pb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2 text-left">
              <Rss className="w-5 h-5 text-adjung-maroon" />
              Content
            </h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40 text-left">
              The latest notes and essays, newest first, from every writer on Adjung
            </p>
          </div>
          {/* Visible below xl only — the full sidebar covers this at xl+,
              the icon rail's own search icon covers it at md-to-xl, so
              this is really only load-bearing below md. Kept visible up
              to xl too so there's always at least one obvious, textual
              way in regardless of viewport. */}
          <button
            type="button"
            onClick={() => setShowFilterPanel(true)}
            className={`xl:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-mono uppercase tracking-wider transition-colors ${
              hasActiveFilters ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'border-stone-200 text-stone-600 hover:border-adjung-maroon hover:text-adjung-maroon'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters{hasActiveFilters ? ` (${authorIds.length + tags.length})` : ''}
          </button>
        </div>

        {activeChips}

        {/* Quick Note composer — Threads/X's "What's new?" box, scoped to
            Note only. Essay needs Desk's full canvas, so that's a
            redirect, not a cramped inline version. */}
        {currentUser && (
          <div className="border border-stone-200/70 rounded-lg bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="sig italic text-lg text-adjung-maroon shrink-0" aria-hidden="true">{currentUserSig}</span>
              <div className="flex-1 min-w-0">
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  onFocus={() => setNoteFocused(true)}
                  placeholder="Share a short note or fragment…"
                  rows={noteFocused || noteDraft ? 3 : 1}
                  className="w-full font-handwritten text-lg text-black leading-snug resize-none focus:outline-none placeholder:font-sans placeholder:text-sm placeholder:text-stone-400"
                />
                {(noteFocused || noteDraft) && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                    <button type="button" onClick={goWriteEssay} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-stone-400 hover:text-adjung-maroon transition-colors">
                      Write a full essay instead <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={publishNote}
                      disabled={!noteDraft.trim() || isPublishing}
                      className="px-4 py-1.5 rounded-full bg-adjung-maroon text-white text-xs font-sans font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-adjung-maroon/90 transition-colors"
                    >
                      Publish
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {newCount > 0 && (
          <div className="flex justify-center -mb-2">
            <button
              type="button"
              onClick={showNewEntries}
              className="px-4 py-1.5 rounded-full bg-adjung-maroon text-white text-xs font-sans font-medium shadow-sm hover:bg-adjung-maroon/90 transition-colors"
            >
              Show {newCount} new {newCount === 1 ? 'entry' : 'entries'}
            </button>
          </div>
        )}

        <div className="space-y-0">
          {results.map(entry => {
            const authorName = resolveContentAuthorName(entry, users);
            const authorSig = resolveContentAuthorSig(entry, users, identities);
            const author = users.find(u => u.id === entry.authorId);
            const isNote = entry.contentType === 'Note';
            const preview = flattenBlocksForPreview(entry.content);
            const isAr = isArabicText(isNote ? preview : entry.title);

            const dayLabel = formatDayLabel(entry.publishedDate);
            const showDayDivider = dayLabel !== lastDayLabel;
            lastDayLabel = dayLabel;

            // AI disclosure stays (a reader needs to know authorship type);
            // internal editorial rank (Chief Editor, Editor) does not — a
            // rank badge is staff-facing organizational detail, not
            // something a reader of the content itself needs to see.
            const roleBadge = author?.isAi ? 'AI Scriptor' : null;

            const readingTimeLabel = entry.readingTimeMinutes
              ? (entry.readingTimeMinutes < 1 ? '<1 min read' : `${entry.readingTimeMinutes} min read`)
              : null;

            return (
              <React.Fragment key={entry.id}>
                {showDayDivider && (
                  <div className="relative text-center my-5 first:mt-0">
                    <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-[#111111]/10" aria-hidden="true" />
                    <span className="relative bg-[#FAF8F3] px-3 font-mono text-[10px] uppercase tracking-widest text-[#111111]/40">
                      {dayLabel}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openEntry(entry)}
                  className={`w-full text-left border rounded-lg overflow-hidden hover:shadow-sm transition-all mb-3 ${
                    isNote ? 'border-adjung-maroon/15 hover:border-adjung-maroon/35' : 'border-stone-200/70 hover:border-adjung-maroon/40'
                  }`}
                >
                  {/* Type accent — a visual cue before a reader even parses
                      the pill text. Note fades out (it's the shorter,
                      lighter-weight form); Essay stays a solid bar. */}
                  <div className={`h-[3px] ${isNote ? 'bg-gradient-to-r from-adjung-maroon to-adjung-maroon/10' : 'bg-adjung-maroon'}`} />

                  <div className={`p-5 ${isNote ? 'bg-[#FDFBF7]' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="sig italic text-[15px] text-adjung-maroon shrink-0" aria-hidden="true">
                          {authorSig}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-serif text-[13px] font-semibold text-[#111111] truncate">{authorName}</span>
                            {roleBadge && (
                              <span className="font-mono text-[8px] uppercase tracking-wider text-adjung-maroon border border-adjung-maroon/25 rounded px-1 py-0.5">
                                {roleBadge}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[9.5px] text-[#111111]/40 truncate">
                            {author?.username ? `${author.username}.adjung.com` : 'adjung.com'}
                            {entry.serialNo !== undefined && ` · ${formatSerialNumber(entry.serialNo)}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-adjung-maroon border border-adjung-maroon/25 rounded px-1.5 py-0.5">
                          {entry.contentType}
                        </span>
                        {/* Visual echo of Folio/Frontpage's own entry-actions
                            glyph — decorative here too, same as those, not
                            wired to a menu of its own. */}
                        <span className="text-stone-300 tracking-widest select-none pt-0.5" aria-hidden="true">⋯</span>
                      </div>
                    </div>

                    {isNote ? (
                      // A flattened preview can mix scripts within one string
                      // (e.g. a Malay heading followed by a quoted Arabic
                      // hadith) — forcing the whole block to one direction via
                      // isArabicText's single true/false verdict corrupted the
                      // reading order of whichever script lost the vote.
                      // dir="auto" hands each embedded run to the browser's
                      // own Unicode Bidi Algorithm instead of one blanket guess.
                      <p dir="auto" style={{ unicodeBidi: 'plain-text' }} className="font-handwritten text-[19px] text-black leading-relaxed text-left">
                        {truncateAtWord(preview, 46)}
                      </p>
                    ) : (
                      <>
                        <h3 dir={isAr ? 'rtl' : 'ltr'} title={entry.title} className={`font-serif text-lg font-medium text-[#111111] mb-1.5 line-clamp-2 ${isAr ? 'text-right' : 'text-left'}`}>
                          {entry.title}
                        </h3>
                        <p dir="auto" style={{ unicodeBidi: 'plain-text' }} className="font-serif text-sm text-stone-500 leading-relaxed text-left">
                          {truncateAtWord(preview, 32)}
                        </p>
                      </>
                    )}

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="font-mono text-[9px] uppercase tracking-wide text-[#111111]/50 bg-adjung-maroon/[0.06] rounded px-1.5 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#111111]/[0.06] font-mono text-[10px] text-[#111111]/40">
                      <div className="flex items-center gap-2.5">
                        {readingTimeLabel && <span>{readingTimeLabel}</span>}
                        {readingTimeLabel && entry.language && <span aria-hidden="true">·</span>}
                        {entry.language && <span>{entry.language}</span>}
                      </div>
                      <span>{entry.publishedDate ? new Date(entry.publishedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                  </div>
                </button>
              </React.Fragment>
            );
          })}

          {results.length === 0 && (
            <p className="text-center text-stone-400 font-sans text-sm py-12">
              {hasActiveFilters ? 'No entries match the current filters.' : 'No published notes or essays yet.'}
            </p>
          )}
        </div>

        {hasMore ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              className="px-5 py-2 rounded border border-stone-200 bg-white text-xs font-mono uppercase tracking-wider text-stone-600 hover:border-adjung-maroon hover:text-adjung-maroon transition-colors"
            >
              Load More ({results.length} / {total})
            </button>
          </div>
        ) : (
          results.length > 0 && (
            // Finite pagination means the feed genuinely ends — saying so
            // plainly is more complete than a Load More button that just
            // quietly disappears with no acknowledgement.
            <div className="text-center py-7">
              <p className="font-serif text-sm text-stone-500">You've reached the end.</p>
              <p className="font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mt-1">
                {total} of {total} · No more to load
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
