import React, { useState } from 'react';
import { Rss, SlidersHorizontal, X } from 'lucide-react';
import { Entry, User } from '../../types';
import { isArabicText, flattenBlocksForPreview, truncateAtWord, formatSerialNumber } from '../../utils';
import { getContentEntries, getContentFacets, resolveContentAuthorName, resolveContentAuthorSig } from '../../utils/getContentEntries';

interface ContentViewProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  setSelectedAuthorId: (id: string) => void;
}

const PAGE_SIZE = 15;
const FACET_PREVIEW_COUNT = 6;

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
  const [page, setPage] = useState(1);
  const [selectedWriters, setSelectedWriters] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [showAllWriters, setShowAllWriters] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  let lastDayLabel = '';

  const visibleWriters = showAllWriters ? writers : writers.slice(0, FACET_PREVIEW_COUNT);
  const visibleTopics = showAllTopics ? topics : topics.slice(0, FACET_PREVIEW_COUNT);

  const sidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#111111]/40">Filters</span>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="font-mono text-[10px] uppercase tracking-wider text-adjung-maroon hover:underline">
            Clear all
          </button>
        )}
      </div>

      {writers.length > 0 && (
        <div className="space-y-2">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-[#111111]/50">Writers</span>
          <div className="space-y-1">
            {visibleWriters.map(w => (
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
          {writers.length > FACET_PREVIEW_COUNT && (
            <button type="button" onClick={() => setShowAllWriters(v => !v)} className="font-mono text-[10px] uppercase tracking-wider text-[#111111]/40 hover:text-adjung-maroon px-2">
              {showAllWriters ? 'Show less' : `Show ${writers.length - FACET_PREVIEW_COUNT} more`}
            </button>
          )}
        </div>
      )}

      {topics.length > 0 && (
        <div className="space-y-2">
          <span className="block font-sans text-[10px] font-semibold uppercase tracking-wider text-[#111111]/50">Topics</span>
          <div className="flex flex-wrap gap-1.5">
            {visibleTopics.map(t => (
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
          {topics.length > FACET_PREVIEW_COUNT && (
            <button type="button" onClick={() => setShowAllTopics(v => !v)} className="font-mono text-[10px] uppercase tracking-wider text-[#111111]/40 hover:text-adjung-maroon">
              {showAllTopics ? 'Show less' : `Show ${topics.length - FACET_PREVIEW_COUNT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto md:grid md:grid-cols-[220px_1fr] md:gap-10 text-left">
      {/* Desktop sidebar — sticky so filters stay reachable while scrolling
          the feed, per the same "keep it visible" principle a long filter
          list needs to actually get used. */}
      <aside className="hidden md:block">
        <div className="sticky top-6">{sidebarContent}</div>
      </aside>

      <div className="space-y-8 min-w-0">
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
          {/* Mobile-only filter toggle — the sidebar collapses behind this
              below md, same breakpoint the Navbar's own hamburger uses. */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(v => !v)}
            className={`md:hidden shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-mono uppercase tracking-wider transition-colors ${
              hasActiveFilters ? 'bg-adjung-maroon text-white border-adjung-maroon' : 'border-stone-200 text-stone-600'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters{hasActiveFilters ? ` (${authorIds.length + tags.length})` : ''}
          </button>
        </div>

        {showMobileFilters && (
          <div className="md:hidden bg-[#FDFBF7] border border-adjung-maroon/15 rounded-lg p-4">
            {sidebarContent}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 -mt-4">
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
            const authorSig = resolveContentAuthorSig(entry, users);
            const author = users.find(u => u.id === entry.authorId);
            const isNote = entry.contentType === 'Note';
            const preview = flattenBlocksForPreview(entry.content);
            const isAr = isArabicText(isNote ? preview : entry.title);

            const dayLabel = formatDayLabel(entry.publishedDate);
            const showDayDivider = dayLabel !== lastDayLabel;
            lastDayLabel = dayLabel;

            // Role badge mirrors the Navbar's own rule: an unremarkable
            // "Writer" role shows nothing (it's the default, not a
            // distinction worth calling out); an AI scriptor or an
            // editorial role does.
            const roleBadge = author?.isAi ? 'AI Scriptor' : (author && author.role !== 'Writer' ? author.role : null);

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
                      {/* Visual echo of Folio/Frontpage's own entry-actions
                          glyph — decorative here too, same as those, not
                          wired to a menu of its own. */}
                      <span className="text-stone-300 tracking-widest select-none pt-0.5 shrink-0" aria-hidden="true">⋯</span>
                    </div>

                    <span className="inline-block font-mono text-[8.5px] font-bold uppercase tracking-wider text-adjung-maroon border border-adjung-maroon/25 rounded px-1.5 py-0.5 mb-2">
                      {entry.contentType}
                    </span>

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
