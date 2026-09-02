import React, { useState } from 'react';
import { ListOrdered, Info, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Entry, User, SystemSettings } from '../../types';
import { isArabicText, parseInlineFormatting, flattenBlocksForPreview } from '../../utils';
import { getIndexEntries, getIndexFacets, IndexSortOrder } from '../../utils/getIndexEntries';
import { WordSafeEllipsis } from '../common/WordSafeEllipsis';

interface EditorialIndexProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  systemSettings: SystemSettings;
  initialSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  initialTag?: string;
}

const PAGE_SIZE = 20;

// Reads/writes ?type=&language=&tag=&q=&sort=&page= on the current URL so a
// filtered Index view can be bookmarked or shared — per SPEC-028 §14.1,
// Index must behave as already-finite (fixed page size, Prev/Next, no
// infinite scroll) even while the query engine behind it stays client-side.
function readParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') || '',
    type: (params.get('type') as 'All' | 'Essay' | 'Note') || 'All',
    language: params.get('language') || 'All',
    tag: params.get('tag') || 'All',
    sort: (params.get('sort') as IndexSortOrder) || 'newest',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
  };
}

function writeParamsToUrl(state: {
  query: string; type: string; language: string; tag: string; sort: string; page: number;
}) {
  const params = new URLSearchParams(window.location.search);
  const setOrDelete = (key: string, value: string, defaultValue: string) => {
    if (value && value !== defaultValue) params.set(key, value);
    else params.delete(key);
  };
  setOrDelete('q', state.query, '');
  setOrDelete('type', state.type, 'All');
  setOrDelete('language', state.language, 'All');
  setOrDelete('tag', state.tag, 'All');
  setOrDelete('sort', state.sort, 'newest');
  setOrDelete('page', String(state.page), '1');

  const qs = params.toString();
  const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
  window.history.replaceState(null, '', newUrl);
}

export function EditorialIndex({
  entries,
  users,
  setSelectedEntry,
  systemSettings,
  initialSearchQuery = '',
  onSearchQueryChange,
  initialTag = '',
}: EditorialIndexProps) {
  const initial = React.useMemo(readParamsFromUrl, []);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || initial.query);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Essay' | 'Note'>(initial.type);
  const [languageFilter, setLanguageFilter] = useState<string>(initial.language);
  const [selectedTag, setSelectedTag] = useState<string>(initial.tag);
  const [sortBy, setSortBy] = useState<IndexSortOrder>(initial.sort);
  const [page, setPage] = useState<number>(initial.page);

  React.useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Frontpage's Topics list picks a real, exact tag (frequency-counted from
  // entries' own tags array) — filtering by that exact tag here, not a
  // free-text search, avoids pulling in an unrelated entry that merely
  // mentions the word somewhere in its body.
  React.useEffect(() => {
    if (initialTag) setSelectedTag(initialTag);
  }, [initialTag]);

  // Any filter/sort change resets to page 1 — a stale page number from a
  // wider result set would otherwise silently show an empty page.
  const resetToFirstPage = () => setPage(1);

  React.useEffect(() => {
    writeParamsToUrl({ query: searchQuery, type: typeFilter, language: languageFilter, tag: selectedTag, sort: sortBy, page });
  }, [searchQuery, typeFilter, languageFilter, selectedTag, sortBy, page]);

  const { tags: allTags, languages: allLanguages } = React.useMemo(
    () => getIndexFacets(entries),
    [entries]
  );

  const { results, total, totalPages, page: currentPage } = React.useMemo(
    () => getIndexEntries({
      entries,
      users,
      query: searchQuery,
      type: typeFilter,
      language: languageFilter,
      tag: selectedTag,
      sort: sortBy,
      page,
      pageSize: PAGE_SIZE,
    }),
    [entries, users, searchQuery, typeFilter, languageFilter, selectedTag, sortBy, page]
  );

  return (
    <div className="space-y-8 text-left">
      <div className="space-y-1 border-b border-[#111111]/10 pb-5">
        <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2 text-left">
          <ListOrdered className="w-6 h-6 text-adjung-maroon" />
          Index
        </h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40 text-left">
          Live dynamic catalog of all published entries in the shared index database
        </p>
      </div>

      {/* Search, Sort, and Filters Panel */}
      <div className="bg-stone-50 border border-stone-200/60 rounded-md p-4 space-y-4 shadow-sm">
        {/* Row 1: Search and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search entries by title, author, content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetToFirstPage();
                if (onSearchQueryChange) onSearchQueryChange(e.target.value);
              }}
              className="w-full border border-stone-200 p-2.5 pl-8 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white transition-all hover:border-stone-300"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3.5" />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#111111]/40 font-mono uppercase tracking-wider text-[10px] whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as IndexSortOrder); resetToFirstPage(); }}
              className="border border-stone-200 p-2 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white pr-4 cursor-pointer hover:border-stone-300 transition-colors"
            >
              <option value="newest">Published Date (Newest)</option>
              <option value="oldest">Published Date (Oldest)</option>
              <option value="title-az">Title (A-Z)</option>
              <option value="title-za">Title (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Type, Language, and Tag Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-stone-200/60">
          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono select-none">
            <span className="text-[#111111]/40 uppercase tracking-wider mr-2 text-[10px]">Type:</span>
            {(['All', 'Essay', 'Note'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { setTypeFilter(type); resetToFirstPage(); }}
                className={`px-3 py-1 rounded text-[11px] transition-all duration-200 cursor-pointer border ${
                  typeFilter === type
                    ? 'bg-adjung-maroon text-white border-adjung-maroon font-semibold shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:text-adjung-maroon hover:border-stone-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Language and Tag dropdowns */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Language Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#111111]/40 font-mono uppercase tracking-wider text-[10px]">Language:</span>
              <select
                value={languageFilter}
                onChange={(e) => { setLanguageFilter(e.target.value); resetToFirstPage(); }}
                className="border border-stone-200 p-1.5 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white pr-4 cursor-pointer hover:border-stone-300 transition-colors"
              >
                <option value="All">All Languages ({allLanguages.length})</option>
                {allLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#111111]/40 font-mono uppercase tracking-wider text-[10px]">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => { setSelectedTag(e.target.value); resetToFirstPage(); }}
                className="border border-stone-200 p-1.5 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white pr-4 cursor-pointer hover:border-stone-300 transition-colors max-w-[150px]"
              >
                <option value="All">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Database Table */}
      {/* Same affordance Directory carries — the table scrolls sideways below
          its 700px minimum, and without this the Type/Published/Slug columns
          just vanish off the edge with no sign they exist. */}
      <p className="min-[700px]:hidden font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1.5 text-right select-none">
        Swipe left to see more →
      </p>
      <div className="bg-white border border-[#111111]/10 rounded overflow-hidden shadow-sm font-sans text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-adjung-maroon/90 backdrop-blur-md border-b border-adjung-maroon/20 font-sans text-[9px] uppercase tracking-widest text-white/90 font-semibold">
                <th className="p-3 pl-4 text-left">Author / Publisher</th>
                <th className="p-3 text-left">Title / Excerpt</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Published</th>
                <th className="p-3 pr-4 text-left">Slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/5 font-serif text-sm">
              {results.map((item) => {
                const author = users.find(u => u.id === item.authorId);
                const isAr = item.contentType === 'Note' ? isArabicText(item.content) : isArabicText(item.title);
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedEntry(item)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 pl-4 font-sans font-medium text-[#111111]">
                      {item.publicationClass === 'Institutional'
                        ? (item.publisher || 'Adjung Editorial Board')
                        : (author?.penName || 'Anonymous')}
                    </td>
                    <td
                      dir={isAr ? 'rtl' : 'ltr'}
                      className={`p-3 text-[#111111] font-medium ${isAr ? 'text-right' : 'text-left'}`}
                    >
                      {item.contentType === 'Note' ? (
                        (() => {
                          const cleanText = flattenBlocksForPreview(item.content);
                          const firstPara = cleanText.split(/\n+/)[0] || '';
                          const sentenceMatch = firstPara.match(/^[^.!?]+[.!?]/);
                          const preview = sentenceMatch ? sentenceMatch[0] : firstPara;
                          // A width-measured single-line cut (ResizeObserver-
                          // based) instead of a fixed word budget — an
                          // unusually long first sentence shouldn't blow out
                          // the row regardless of how wide this column
                          // actually renders at.
                          return <WordSafeEllipsis text={preview} className="text-stone-600 font-normal" />;
                        })()
                      ) : (
                        <WordSafeEllipsis text={item.title} format={t => parseInlineFormatting(t)} />
                      )}
                    </td>
                    <td className="p-3 font-sans"><span className="text-adjung-maroon font-semibold">{item.contentType}</span></td>
                    <td className="p-3 font-mono text-[#111111]/60 text-[10px]">{item.publishedDate ? new Date(item.publishedDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3 font-mono text-[#111111]/40 text-[10px] pr-4">{item.slug}</td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 font-sans">
                    No matching published entries are indexed in the shared database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Finite pagination — no infinite scroll, per SPEC-028 §14.1 */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#111111]/10 bg-stone-50 font-sans text-[11px] text-[#111111]/60">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-stone-200 bg-white hover:border-adjung-maroon hover:text-adjung-maroon disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-stone-200 disabled:hover:text-inherit transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>
              <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-stone-200 bg-white hover:border-adjung-maroon hover:text-adjung-maroon disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-stone-200 disabled:hover:text-inherit transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
