import React, { useState } from 'react';
import { ListOrdered, Info, Search } from 'lucide-react';
import { Entry, User, SystemSettings } from '../../types';
import { isArabicText, stripMarkdown, parseInlineFormatting } from '../../utils';

interface EditorialIndexProps {
  entries: Entry[];
  users: User[];
  setSelectedEntry: (entry: Entry) => void;
  systemSettings: SystemSettings;
  initialSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function EditorialIndex({
  entries,
  users,
  setSelectedEntry,
  systemSettings,
  initialSearchQuery = '',
  onSearchQueryChange,
}: EditorialIndexProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Essay' | 'Note'>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-az' | 'title-za'>('newest');

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // Extract all unique tags from the published content entries
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach(e => {
      if (
        e.status === 'Published' && 
        e.contentType !== 'Notice' && 
        e.contentType !== "Editor's Note" && 
        e.tags
      ) {
        e.tags.forEach(t => {
          if (t && t.trim()) {
            tagsSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [entries]);

  // Extract all unique languages from the published content entries
  const allLanguages = React.useMemo(() => {
    const langsSet = new Set<string>();
    entries.forEach(e => {
      if (
        e.status === 'Published' && 
        e.contentType !== 'Notice' && 
        e.contentType !== "Editor's Note"
      ) {
        // Use the entry's language metadata if available, otherwise auto-detect based on script
        const lang = e.language || (isArabicText(e.title || e.content) ? 'Arabic' : 'English');
        langsSet.add(lang);
      }
    });
    return Array.from(langsSet).sort();
  }, [entries]);

  // Filter entries based on search query, type, language, and tag filters
  const filteredEntries = entries.filter(e => {
    // Only published entries should be visible in the catalog
    if (e.status !== 'Published') return false;

    // Index is only for main content entries, not administrative / notice board contents
    if (e.contentType === 'Notice' || e.contentType === "Editor's Note") return false;

    const matchesType = typeFilter === 'All' || e.contentType === typeFilter;

    // Resolve language from the metadata field, defaulting dynamically
    const lang = e.language || (isArabicText(e.title || e.content) ? 'Arabic' : 'English');
    const matchesLanguage = languageFilter === 'All' || lang === languageFilter;

    // Filter by tag
    const matchesTag = selectedTag === 'All' || (e.tags && e.tags.includes(selectedTag));

    const query = searchQuery.trim().toLowerCase();
    const author = users.find(u => u.id === e.authorId);
    const authorName = e.publicationClass === 'Institutional'
      ? (e.publisher || 'Adjung Editorial Board')
      : (author?.penName || 'Anonymous');

    const matchesSearch = !query ||
      e.title.toLowerCase().includes(query) ||
      authorName.toLowerCase().includes(query) ||
      e.contentType.toLowerCase().includes(query) ||
      (e.tags && e.tags.some((t: string) => t.toLowerCase().includes(query))) ||
      (e.slug && e.slug.toLowerCase().includes(query)) ||
      e.id.toLowerCase().includes(query);

    return matchesType && matchesLanguage && matchesTag && matchesSearch;
  });

  // Sort the filtered entries
  const sortedEntries = React.useMemo(() => {
    const result = [...filteredEntries];
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateA - dateB;
      }
      if (sortBy === 'title-az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-za') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
    return result;
  }, [filteredEntries, sortBy]);

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
              placeholder="Search entries by title, author, slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
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
              onChange={(e) => setSortBy(e.target.value as any)}
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-stone-200/50">
          {/* Type Filters */}
          <div className="flex flex-wrap items-center gap-1 text-xs font-mono select-none">
            <span className="text-[#111111]/40 uppercase tracking-wider mr-2 text-[10px]">Type:</span>
            {(['All', 'Essay', 'Note'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
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
                onChange={(e) => setLanguageFilter(e.target.value)}
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
                onChange={(e) => setSelectedTag(e.target.value)}
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
      <div className="bg-white border border-[#111111]/10 rounded overflow-hidden shadow-sm font-sans text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-adjung-maroon/90 backdrop-blur-md border-b border-adjung-maroon/20 font-sans text-[9px] uppercase tracking-widest text-white/90 font-semibold">
                <th className="p-3 pl-4 text-left">Author / Publisher</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Published</th>
                <th className="p-3 pr-4 text-left">Slug</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/5 font-serif text-sm">
              {sortedEntries.map((item) => {
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
                        <span className="text-stone-600 font-normal">
                          {(() => {
                            const cleanText = item.content.replace(/\[\^.*?\]/g, '').trim();
                            const firstPara = cleanText.split(/\n+/)[0] || '';
                            const sentenceMatch = firstPara.match(/^[^.!?]+[.!?]/);
                            return sentenceMatch ? sentenceMatch[0] : firstPara.substring(0, 80) + '...';
                          })()}
                        </span>
                      ) : (
                        parseInlineFormatting(item.title)
                      )}
                    </td>
                    <td className="p-3 font-sans"><span className="text-adjung-maroon font-semibold">{item.contentType}</span></td>
                    <td className="p-3 font-mono text-[#111111]/50 text-[10px]">{item.publishedDate ? new Date(item.publishedDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3 font-mono text-[#111111]/40 text-[10px] pr-4">{item.slug}</td>
                  </tr>
                );
              })}
              {sortedEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center italic text-stone-400 font-sans">
                    No matching published entries are indexed in the shared database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
