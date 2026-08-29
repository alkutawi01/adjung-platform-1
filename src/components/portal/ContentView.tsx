import React, { useState } from 'react';
import { Rss } from 'lucide-react';
import { Entry, User } from '../../types';
import { isArabicText, flattenBlocksForPreview } from '../../utils';
import { getContentEntries, resolveContentAuthorName } from '../../utils/getContentEntries';

interface ContentViewProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  setSelectedAuthorId: (id: string) => void;
}

const PAGE_SIZE = 15;

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

      <div className="space-y-4">
        {results.map(entry => {
          const authorName = resolveContentAuthorName(entry, users);
          const isNote = entry.contentType === 'Note';
          const preview = flattenBlocksForPreview(entry.content);
          const isAr = isArabicText(isNote ? preview : entry.title);

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => openEntry(entry)}
              className={`w-full text-left border rounded-md p-5 hover:shadow-sm transition-all ${
                isNote
                  ? 'bg-[#FDFBF7] border-adjung-maroon/15 hover:border-adjung-maroon/35'
                  : 'bg-white border-stone-200/70 hover:border-adjung-maroon/40'
              }`}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#111111]/40 mb-2">
                <span className="text-adjung-maroon font-semibold uppercase tracking-wider">{authorName}</span>
                <span>•</span>
                {isNote ? (
                  <span className="text-adjung-maroon font-bold border border-adjung-maroon/30 rounded px-1.5 py-0.5">NOTE</span>
                ) : (
                  <span className="uppercase tracking-wider">{entry.contentType}</span>
                )}
                <span>•</span>
                <span>{entry.publishedDate ? new Date(entry.publishedDate).toLocaleDateString() : ''}</span>
              </div>

              {isNote ? (
                // Note reads in its own handwritten voice (same face as
                // Folio's Note card) at a larger size than Essay's excerpt —
                // the text itself is the point, not a teaser toward "read
                // more," so it gets more room (280 chars) and no drop-cap-
                // adjacent essay styling.
                <p dir={isAr ? 'rtl' : 'ltr'} className={`font-handwritten text-[19px] text-black leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}>
                  {preview.length > 280 ? `${preview.slice(0, 280)}…` : preview}
                </p>
              ) : (
                <>
                  <h3 dir={isAr ? 'rtl' : 'ltr'} className={`font-serif text-lg font-medium text-[#111111] mb-1.5 ${isAr ? 'text-right' : 'text-left'}`}>
                    {entry.title}
                  </h3>
                  <p className="font-serif text-sm text-stone-500 leading-relaxed">
                    {preview.length > 200 ? `${preview.slice(0, 200)}…` : preview}
                  </p>
                </>
              )}
            </button>
          );
        })}

        {results.length === 0 && (
          <p className="text-center text-stone-400 font-sans text-sm py-12">
            No published notes or essays yet.
          </p>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2 rounded border border-stone-200 bg-white text-xs font-mono uppercase tracking-wider text-stone-600 hover:border-adjung-maroon hover:text-adjung-maroon transition-colors"
          >
            Load More ({results.length} / {total})
          </button>
        </div>
      )}
    </div>
  );
}
