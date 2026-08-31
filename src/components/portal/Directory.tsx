import React, { useState } from 'react';
import { Search, Compass, BookOpen, FileText, Sparkles } from 'lucide-react';
import { User, Entry } from '../../types';
import { isArabicText, isSubdomainUnlocked } from '../../utils';
import { useAppContext } from '../../context/AppContext';
import { FieldTooltip } from '../common/FieldTooltip';

interface DirectoryProps {
  users: User[];
  entries: Entry[];
  onSelectMember: (userId: string, targetTab: 'folio' | 'bio') => void;
}

export function Directory({ users, entries, onSelectMember }: DirectoryProps) {
  const { identities } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name-az' | 'name-za'>('name-az');

  // Helper to extract country from location/affiliation
  const getCountry = (location?: string) => {
    if (!location) return 'N/A';
    const parts = location.split(',');
    return parts[parts.length - 1].trim();
  };

  // Helper to get languages and tags written by the user in published entries
  const getUserMetadata = React.useCallback((userId: string) => {
    const userEntries = entries.filter(e => 
      e.authorId === userId && 
      e.status === 'Published' && 
      e.contentType !== 'Notice' && 
      e.contentType !== "Editor's Note"
    );

    const languages = new Set<string>();
    const tags = new Set<string>();

    userEntries.forEach(e => {
      const lang = e.language || (isArabicText(e.title || e.content) ? 'Arabic' : 'English');
      languages.add(lang);
      if (e.tags) {
        e.tags.forEach(t => {
          if (t && t.trim()) {
            tags.add(t.trim());
          }
        });
      }
    });

    return {
      languages: Array.from(languages).sort(),
      tags: Array.from(tags).sort()
    };
  }, [entries]);

  // Extract unique countries dynamically from active users
  const allCountries = React.useMemo(() => {
    const countriesSet = new Set<string>();
    users.forEach(u => {
      if (!u.suspended && u.affiliation) {
        const country = getCountry(u.affiliation);
        if (country && country !== 'N/A') {
          countriesSet.add(country);
        }
      }
    });
    return Array.from(countriesSet).sort();
  }, [users]);

  // Extract unique languages from published entries in the catalog
  const allLanguages = React.useMemo(() => {
    const langsSet = new Set<string>();
    entries.forEach(e => {
      if (
        e.status === 'Published' && 
        e.contentType !== 'Notice' && 
        e.contentType !== "Editor's Note"
      ) {
        const lang = e.language || (isArabicText(e.title || e.content) ? 'Arabic' : 'English');
        langsSet.add(lang);
      }
    });
    return Array.from(langsSet).sort();
  }, [entries]);

  // Extract unique tags from published entries in the catalog
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

  // Filter members based on search query, country, language, and tag filters
  const filteredUsers = users.filter(u => {
    if (u.suspended) return false;

    const uMeta = getUserMetadata(u.id);

    const matchesCountry = countryFilter === 'All' || getCountry(u.affiliation) === countryFilter;
    const matchesLanguage = languageFilter === 'All' || uMeta.languages.includes(languageFilter);
    const matchesTag = selectedTag === 'All' || uMeta.tags.includes(selectedTag);

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      u.penName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.affiliation && u.affiliation.toLowerCase().includes(query)) ||
      (u.bioSummary && u.bioSummary.toLowerCase().includes(query));

    return matchesCountry && matchesLanguage && matchesTag && matchesSearch;
  });

  // Sort the filtered users
  const sortedUsers = React.useMemo(() => {
    const result = [...filteredUsers];
    result.sort((a, b) => {
      if (sortBy === 'name-az') {
        return a.penName.localeCompare(b.penName);
      }
      if (sortBy === 'name-za') {
        return b.penName.localeCompare(a.penName);
      }
      if (sortBy === 'joined-newest') {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA); // Newest first
      }
      if (sortBy === 'joined-oldest') {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateA.localeCompare(dateB); // Oldest first
      }
      return 0;
    });
    return result;
  }, [filteredUsers, sortBy]);

  return (
    <div className="space-y-8 text-left">
      {/* Title & Description */}
      <div className="space-y-1 border-b border-[#111111]/10 pb-5">
        <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2 text-left">
          <Compass className="w-6 h-6 text-adjung-maroon" />
          Directory
        </h2>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40 text-left">
          A searchable record of all Adjung members, contributors, and the editorial team
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
              placeholder="Search members by pen name, biography..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="name-az">Pen Name (A-Z)</option>
              <option value="name-za">Pen Name (Z-A)</option>
              <option value="joined-newest">Date Joined (Newest)</option>
              <option value="joined-oldest">Date Joined (Oldest)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Location, Language, and Tag Filters */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-stone-200/60 text-xs">
          {/* Location/Country Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[#111111]/40 font-mono uppercase tracking-wider text-[10px]">Country:</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border border-stone-200 p-1.5 rounded text-xs focus:outline-none focus:border-adjung-maroon font-sans bg-white pr-4 cursor-pointer hover:border-stone-300 transition-colors"
            >
              <option value="All">All Countries ({allCountries.length})</option>
              {allCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

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

      {/* Directory Table */}
      <p className="md:hidden font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1.5 text-right select-none">
        Swipe left to see more →
      </p>
      <div className="bg-white border border-[#111111]/10 rounded overflow-hidden shadow-sm font-sans text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-adjung-maroon/90 backdrop-blur-md border-b border-adjung-maroon/20 font-sans text-[9px] uppercase tracking-widest text-white/90 font-semibold">
                <th className="p-3 pl-4 text-left">Pen Name</th>
                <th className="p-3 text-left">Full Name</th>
                <th className="p-3 text-left">Country</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-left">Languages</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-left">Subdomain / Contact</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/5 font-sans text-sm">
               {sortedUsers.map((u) => {
                const uMeta = getUserMetadata(u.id);
                const identity = identities.find(i => i.accountId === u.id);
                const unlocked = isSubdomainUnlocked(u.id, entries, identity, u.createdAt, u.subdomainApprovedEarly);
                const domain = unlocked 
                  ? `${u.username}.adjung.com` 
                  : `adjung.com/ps/${u.id} (Reserved)`;

                return (
                  <tr 
                    key={u.id} 
                    onClick={() => onSelectMember(u.id, 'folio')}
                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    {/* Scholar (Pen Name) */}
                    <td className="p-3 pl-4 font-sans font-bold text-[#111111]">
                      <div className="flex items-center gap-1.5">
                        <span>{u.penName}</span>
                        {u.isAi && (
                          <FieldTooltip text="AI Editorial Fellow" bubbleClassName="px-2 py-0.5 text-[8px] font-mono whitespace-nowrap">
                            <Sparkles className="w-3.5 h-3.5 text-adjung-maroon transition-transform duration-700 ease-in-out group-hover/tooltip:rotate-[360deg] cursor-help" />
                          </FieldTooltip>
                        )}
                      </div>
                    </td>

                    {/* Full Name */}
                    <td className="p-3 font-sans text-stone-600">
                      {(() => {
                        const identity = identities.find(i => i.accountId === u.id);
                        return identity?.displayName || '-';
                      })()}
                    </td>

                    {/* Country */}
                    <td className="p-3 font-sans text-stone-700">
                      {getCountry(u.affiliation)}
                    </td>

                    {/* Joined */}
                    <td className="p-3 font-sans text-stone-500 font-mono text-[11px]">
                      {u.createdAt ? u.createdAt.split('T')[0] : 'N/A'}
                    </td>

                    {/* Languages */}
                    <td className="p-3 font-sans text-stone-600 font-medium">
                      {uMeta.languages.join(', ') || '-'}
                    </td>

                    {/* Tags */}
                    <td className="p-3 font-sans">
                      <div className="flex flex-wrap gap-1">
                        {uMeta.tags.length > 0 ? (
                          uMeta.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-stone-100 rounded text-[9px] text-stone-500 font-mono uppercase tracking-wide">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </div>
                    </td>

                    {/* Subdomain & Contact */}
                    <td className="p-3 font-mono text-[10px] text-stone-500">
                      <div className="flex flex-col gap-0.5 select-all" onClick={(e) => e.stopPropagation()}>
                        <span className="lowercase text-adjung-maroon hover:underline cursor-pointer">
                          {domain}
                        </span>
                        <span className="text-[#111111]/30">{u.email}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 pr-4 font-sans text-[10px] text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectMember(u.id, 'folio')}
                          className="flex items-center gap-1 px-2.5 py-1 border border-stone-200 hover:border-adjung-maroon hover:bg-adjung-maroon/5 text-stone-700 hover:text-adjung-maroon font-mono text-[9px] uppercase tracking-wider rounded transition cursor-pointer font-semibold"
                        >
                          <BookOpen className="w-3 h-3" /> Folio
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectMember(u.id, 'bio')}
                          className="flex items-center gap-1 px-2.5 py-1 border border-stone-200 hover:border-adjung-maroon hover:bg-adjung-maroon/5 text-stone-700 hover:text-adjung-maroon font-mono text-[9px] uppercase tracking-wider rounded transition cursor-pointer font-semibold"
                        >
                          <FileText className="w-3 h-3" /> Bio
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center italic text-stone-400 font-sans">
                    No matching writers are listed in the directory.
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
