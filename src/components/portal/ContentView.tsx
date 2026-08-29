import React, { useState } from 'react';
import { Rss } from 'lucide-react';
import { Entry, User } from '../../types';
import { isArabicText, flattenBlocksForPreview, truncateAtWord, formatSerialNumber } from '../../utils';
import { getContentEntries, resolveContentAuthorName, resolveContentAuthorSig } from '../../utils/getContentEntries';

interface ContentViewProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  setSelectedAuthorId: (id: string) => void;
}

const PAGE_SIZE = 15;

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

export function ContentView({ entries, users, setSelectedEntry, setSelectedAuthorId }: ContentViewProps) {
  const [page, setPage] = useState(1);

  const { results, total, hasMore } = React.useMemo(
    () => getContentEntries({ entries, page, pageSize: PAGE_SIZE }),
    [entries, page]
  );

  const openEntry = (entry: Entry) => {
    setSelectedAuthorId(entry.authorId);
    setSelectedEntry(entry);
  };

  let lastDayLabel = '';

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-left">
      <div className="space-y-1 border-b border-[#111111]/10 pb-5">
        <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2 text-left">
          <Rss className="w-5 h-5 text-adjung-maroon" />
          Content
        </h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40 text-left">
          The latest notes and essays, newest first, from every writer on Adjung
        </p>
      </div>

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
                    <p dir={isAr ? 'rtl' : 'ltr'} className={`font-handwritten text-[19px] text-black leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                      {truncateAtWord(preview, 46)}
                    </p>
                  ) : (
                    <>
                      <h3 dir={isAr ? 'rtl' : 'ltr'} title={entry.title} className={`font-serif text-lg font-medium text-[#111111] mb-1.5 line-clamp-2 ${isAr ? 'text-right' : 'text-left'}`}>
                        {entry.title}
                      </h3>
                      <p className="font-serif text-sm text-stone-500 leading-relaxed">
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
            No published notes or essays yet.
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
  );
}
