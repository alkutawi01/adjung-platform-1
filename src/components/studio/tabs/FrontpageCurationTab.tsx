import React from 'react';
import { Layers, Globe, Calendar, AlertTriangle } from 'lucide-react';
import { User, Entry } from '../../../types';
import { parseInlineFormatting, parseInTheNews, parseWorldClockHolidays, flattenBlocksForPreview, truncateAtWord } from '../../../utils';

interface FrontpageCurationTabProps {
  // State Values
  featuredScholarId: string;
  setFeaturedScholarId: (id: string) => void;
  featuredEntryId: string;
  setFeaturedEntryId: (id: string) => void;
  editorialSelectionIds: string[];
  setEditorialSelectionIds: (ids: string[]) => void;
  featuredEssayIds: string[];
  setFeaturedEssayIds: (ids: string[]) => void;
  featuredNoteIds: string[];
  setFeaturedNoteIds: (ids: string[]) => void;
  announcementBanner: string;
  setAnnouncementBanner: (banner: string) => void;
  enableArabicAccent: boolean;
  setEnableArabicAccent: (val: boolean) => void;
  layoutDensity: 'Standard' | 'Compact' | 'Classical';
  setLayoutDensity: (density: 'Standard' | 'Compact' | 'Classical') => void;
  
  inTheNewsGoogleDocUrl: string;
  setInTheNewsGoogleDocUrl: (url: string) => void;
  googleDocSyncTimes: string;
  setGoogleDocSyncTimes: (times: string) => void;
  inTheNewsRawText: string;
  setInTheNewsRawText: (text: string) => void;
  inTheNewsGoogleDocText: string;
  inTheNewsGoogleDocStatus: string;
  
  worldClockHolidaysGoogleDocUrl: string;
  setWorldClockHolidaysGoogleDocUrl: (url: string) => void;
  worldClockHolidaysRawText: string;
  setWorldClockHolidaysRawText: (text: string) => void;
  worldClockHolidaysGoogleDocText: string;
  worldClockHolidaysGoogleDocStatus: string;

  // Data & Handlers
  publishedEntries: Entry[];
  users: User[];
  handleSaveCuration: () => void;
  handleSaveNewsDigest: () => void;
  handleSaveWorldClockHolidays: () => void;
  handleDownloadTemplate: () => void;
  handleDownloadHolidaysTemplate: () => void;
  renderGoogleDocConnectionStatus: (status: string, count: number) => React.ReactNode;
}

const resolveEntryFromInput = (input: string, entries: Entry[]): Entry | undefined => {
  if (!input) return undefined;
  const cleanInput = input.trim();
  
  let match = entries.find(e => e.id === cleanInput);
  if (match) return match;
  
  match = entries.find(e => e.slug === cleanInput);
  if (match) return match;
  
  try {
    const url = new URL(cleanInput);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      match = entries.find(e => e.id === lastPart || e.slug === lastPart);
      if (match) return match;
    }
  } catch (err) {
    // Ignore
  }
  
  match = entries.find(e => e.title.toLowerCase().includes(cleanInput.toLowerCase()));
  if (match) return match;

  return undefined;
};

export function FrontpageCurationTab({
  featuredScholarId,
  setFeaturedScholarId,
  featuredEntryId,
  setFeaturedEntryId,
  editorialSelectionIds,
  setEditorialSelectionIds,
  featuredEssayIds,
  setFeaturedEssayIds,
  featuredNoteIds,
  setFeaturedNoteIds,
  announcementBanner,
  setAnnouncementBanner,
  enableArabicAccent,
  setEnableArabicAccent,
  layoutDensity,
  setLayoutDensity,
  inTheNewsGoogleDocUrl,
  setInTheNewsGoogleDocUrl,
  googleDocSyncTimes,
  setGoogleDocSyncTimes,
  inTheNewsRawText,
  setInTheNewsRawText,
  inTheNewsGoogleDocText,
  inTheNewsGoogleDocStatus,
  worldClockHolidaysGoogleDocUrl,
  setWorldClockHolidaysGoogleDocUrl,
  worldClockHolidaysRawText,
  setWorldClockHolidaysRawText,
  worldClockHolidaysGoogleDocText,
  worldClockHolidaysGoogleDocStatus,
  publishedEntries,
  users,
  handleSaveCuration,
  handleSaveNewsDigest,
  handleSaveWorldClockHolidays,
  handleDownloadTemplate,
  handleDownloadHolidaysTemplate,
  renderGoogleDocConnectionStatus
}: FrontpageCurationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Curation Form */}
      <div className="lg:col-span-7 bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-3 text-left">
          <h3 className="font-serif text-lg font-semibold text-stone-950">Frontpage Curation & Pinning</h3>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Promote featured entries or writers to the main public landing feed</p>
        </div>

        <div className="space-y-4 text-xs font-sans">
          {/* 3 Slots for Featured Articles */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold text-left">
              Featured Articles (3 Slots)
            </label>
            <div className="space-y-3">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-stone-400 text-[10px] w-12 flex-shrink-0 text-left">Slot {idx + 1}:</span>
                    <input
                      type="text"
                      value={editorialSelectionIds[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const resolved = resolveEntryFromInput(val, publishedEntries);
                        const updated = [...editorialSelectionIds];
                        updated[idx] = resolved ? resolved.id : val;
                        setEditorialSelectionIds(updated);
                      }}
                      placeholder="Enter Entry ID, Slug, or URL..."
                      className="flex-1 border border-stone-200 p-2 rounded bg-white text-xs focus:outline-none focus:border-adjung-maroon font-mono"
                    />
                  </div>
                  <div className="pl-14 text-[9px] font-mono text-left">
                    {(() => {
                      const val = editorialSelectionIds[idx];
                      if (!val) return <span className="text-stone-400">Empty Slot</span>;
                      const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
                      if (!resolved) return <span className="text-red-500">❌ Entry not found</span>;
                      if (resolved.contentType !== 'Essay') {
                        return <span className="text-red-500">❌ Invalid Type: Must be an Essay (resolved as {resolved.contentType})</span>;
                      }
                      return <span className="text-emerald-600">✅ {resolved.contentType}: "{resolved.title}" by {users.find(u => u.id === resolved.authorId)?.penName}</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-stone-400 text-[9px] font-mono mt-1 block text-left">
              Curated entries displayed on the Frontpage under "Featured Articles".
            </span>
          </div>

          {/* 1 Slot for Featured Entry */}
          <div className="pt-4 border-t border-stone-200 space-y-2">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold text-left">
              Featured Entry
            </label>
            <div className="space-y-1">
              <input
                type="text"
                value={featuredEntryId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const resolved = resolveEntryFromInput(val, publishedEntries);
                  setFeaturedEntryId(resolved ? resolved.id : val);
                }}
                placeholder="Enter Entry ID, Slug, or URL..."
                className="w-full border border-stone-200 p-2.5 rounded bg-white font-mono text-xs focus:outline-none focus:border-adjung-maroon"
              />
              <div className="text-[9px] font-mono text-left pl-2">
                {(() => {
                  if (!featuredEntryId) return <span className="text-stone-400">None Selected</span>;
                  const resolved = publishedEntries.find(e => e.id === featuredEntryId || e.slug === featuredEntryId);
                  if (!resolved) return <span className="text-red-500">❌ Entry not found</span>;
                  if (resolved.contentType !== 'Essay') {
                    return <span className="text-red-500">❌ Invalid Type: Must be an Essay (resolved as {resolved.contentType})</span>;
                  }
                  return <span className="text-emerald-600">✅ {resolved.contentType}: "{resolved.title}" by {users.find(u => u.id === resolved.authorId)?.penName}</span>;
                })()}
              </div>
            </div>
            <span className="text-stone-400 text-[9px] font-mono mt-1 block text-left">
              Pins this publication at the absolute pinnacle of the public landing archive timeline.
            </span>
          </div>

          {/* 3 Slots for Featured Essays */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold text-left">
              Featured Essays (3 Slots)
            </label>
            <div className="space-y-3">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-stone-400 text-[10px] w-12 flex-shrink-0 text-left">Slot {idx + 1}:</span>
                    <input
                      type="text"
                      value={featuredEssayIds[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const resolved = resolveEntryFromInput(val, publishedEntries);
                        const updated = [...featuredEssayIds];
                        updated[idx] = resolved ? resolved.id : val;
                        setFeaturedEssayIds(updated);
                      }}
                      placeholder="Enter Entry ID, Slug, or URL..."
                      className="flex-1 border border-stone-200 p-2 rounded bg-white text-xs focus:outline-none focus:border-adjung-maroon font-mono"
                    />
                  </div>
                  <div className="pl-14 text-[9px] font-mono text-left">
                    {(() => {
                      const val = featuredEssayIds[idx];
                      if (!val) return <span className="text-stone-400">Empty Slot</span>;
                      const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
                      if (!resolved) return <span className="text-red-500">❌ Entry not found</span>;
                      if (resolved.contentType !== 'Essay') {
                        return <span className="text-red-500">❌ Invalid Type: Must be an Essay (resolved as {resolved.contentType})</span>;
                      }
                      return <span className="text-emerald-600">✅ Essay: "{resolved.title}" by {users.find(u => u.id === resolved.authorId)?.penName}</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-stone-400 text-[9px] font-mono mt-1 block text-left">
              Curated essays displayed on the Frontpage under "Featured Essays".
            </span>
          </div>

          {/* 3 Slots for Featured Notes */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold text-left">
              Featured Notes (3 Slots)
            </label>
            <div className="space-y-3">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-stone-400 text-[10px] w-12 flex-shrink-0 text-left">Slot {idx + 1}:</span>
                    <input
                      type="text"
                      value={featuredNoteIds[idx] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const resolved = resolveEntryFromInput(val, publishedEntries);
                        const updated = [...featuredNoteIds];
                        updated[idx] = resolved ? resolved.id : val;
                        setFeaturedNoteIds(updated);
                      }}
                      placeholder="Enter Entry ID, Slug, or URL..."
                      className="flex-1 border border-stone-200 p-2 rounded bg-white text-xs focus:outline-none focus:border-adjung-maroon font-mono"
                    />
                  </div>
                  <div className="pl-14 text-[9px] font-mono text-left">
                    {(() => {
                      const val = featuredNoteIds[idx];
                      if (!val) return <span className="text-stone-400">Empty Slot</span>;
                      const resolved = publishedEntries.find(e => e.id === val || e.slug === val);
                      if (!resolved) return <span className="text-red-500">❌ Entry not found</span>;
                      if (resolved.contentType !== 'Note' && resolved.contentType !== 'Essay') {
                        return <span className="text-red-500">❌ Invalid Type: Must be a Note or Essay (resolved as {resolved.contentType})</span>;
                      }
                      return <span className="text-emerald-600">✅ {resolved.contentType}: "{resolved.title || 'Untitled Note'}" by {users.find(u => u.id === resolved.authorId)?.penName}</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-stone-400 text-[9px] font-mono mt-1 block text-left">
              Curated notes displayed on the Frontpage under "Featured Notes".
            </span>
          </div>

          {/* Announcement Banner */}
          <div className="pt-4 border-t border-stone-200 space-y-2">
            <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold text-left">
              Institutional Announcement Banner
            </label>
            <input
              type="text"
              value={announcementBanner}
              onChange={(e) => setAnnouncementBanner(e.target.value)}
              placeholder="Announcement text..."
              className="w-full border border-stone-200 p-2.5 rounded bg-[#FAFAF9] text-stone-800 font-mono text-xs focus:outline-none focus:border-adjung-maroon"
            />
            <span className="text-stone-400 text-[9px] font-mono mt-1 block text-left">
              Displays at the absolute top of the public landing screen for temporary notices.
            </span>
          </div>

          {/* Scholar Highlight and Theme Details */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1 text-left">Featured Writer</label>
                <select
                  value={featuredScholarId}
                  onChange={(e) => setFeaturedScholarId(e.target.value)}
                  className="w-full border border-stone-200 p-2.5 rounded bg-white text-xs focus:outline-none focus:border-adjung-maroon text-stone-700"
                >
                  <option value="">-- None Selected --</option>
                  {users.filter(u => u.role === 'Writer' || u.role === 'Editor' || u.role === 'Chief Editor').map(u => (
                    <option key={u.id} value={u.id}>{u.penName} (@{u.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1 text-left">Visual Layout Density</label>
                <select
                  value={layoutDensity}
                  onChange={(e) => setLayoutDensity(e.target.value as any)}
                  className="w-full border border-stone-200 p-2.5 rounded bg-white text-xs focus:outline-none focus:border-adjung-maroon text-stone-700"
                >
                  <option value="Standard">Standard (Relaxed Spacing)</option>
                  <option value="Compact">Compact (Tight Line Heights)</option>
                  <option value="Classical">Classical (Broad Borders)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-left">
              <input
                type="checkbox"
                id="enable-arabic-accent"
                checked={enableArabicAccent}
                onChange={(e) => setEnableArabicAccent(e.target.checked)}
                className="w-3.5 h-3.5 text-adjung-maroon focus:ring-adjung-maroon border-stone-300 rounded cursor-pointer"
              />
              <label htmlFor="enable-arabic-accent" className="font-mono text-[10px] uppercase text-stone-600 select-none cursor-pointer">
                Render accent lines for Arabic Typography blocks on Frontpage
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCuration}
            className="w-full bg-adjung-maroon text-white py-2.5 rounded text-xs font-mono uppercase tracking-wider hover:opacity-95 transition shadow-sm mt-4 cursor-pointer"
          >
            Apply Curation Settings
          </button>
        </div>
      </div>

      {/* Live Mockup */}
      <div className="lg:col-span-5 space-y-4">
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 block font-semibold text-left">Frontpage Curation Mockup</span>
        <div className="bg-[#FDFDFD] border border-stone-300 p-5 rounded scholarly-border shadow-inner text-left space-y-4 select-none relative overflow-hidden">
          <div className="border-b pb-2 flex justify-between items-center text-[8px] font-mono text-stone-400">
            <span>ADJUNG</span>
            <span>LAYOUT: {layoutDensity.toUpperCase()}</span>
          </div>

          {announcementBanner && (
            <div className="bg-adjung-maroon/5 border-l-2 border-adjung-maroon p-2 text-[9px] text-stone-600 italic">
              "{announcementBanner}"
            </div>
          )}

          {/* Article Preview */}
          <div className="border-t pt-3 space-y-1">
            <span className="font-mono text-[7px] uppercase tracking-wider text-stone-400 font-semibold block">Featured Entry</span>
            <h5 className="font-sans font-bold text-stone-800 text-xs line-clamp-1">
              {(() => {
                const ent = publishedEntries.find(e => e.id === featuredEntryId);
                if (!ent) return 'None Selected';
                return ent.title ? parseInlineFormatting(ent.title) : truncateAtWord(flattenBlocksForPreview(ent.content), 6);
              })()}
            </h5>
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-stone-400">
              <span>{publishedEntries.find(e => e.id === featuredEntryId)?.contentType || 'Essay'}</span>
              <span>•</span>
              <span>By {users.find(u => u.id === (publishedEntries.find(e => e.id === featuredEntryId)?.authorId || ''))?.penName || 'Anonymous'}</span>
              {enableArabicAccent && <span className="text-adjung-maroon font-semibold">AR-TAG</span>}
            </div>
          </div>
        </div>
      </div>

      {/* In The News digest raw editor */}
      {(() => {
        const { items: docItems, errors: docErrors } = parseInTheNews(inTheNewsGoogleDocText);
        const { items: localItems, errors: localErrors } = parseInTheNews(inTheNewsRawText);
        const newsParsedItems = [...docItems, ...localItems];
        const newsParseErrors = [...docErrors, ...localErrors];
        return (
          <div className="lg:col-span-12 mt-4 border-t border-stone-200 pt-6">
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
              <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1F1F]">In The News Digest</h3>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Curate global developments (displays up to 50 items from Source A & B, separated by ---)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded transition cursor-pointer font-semibold"
                  >
                    Download Template (.txt)
                  </button>
                  <span className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-100 text-stone-600 rounded w-fit select-none">Version 1.0 Spec</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Google Doc URL (Source A)</label>
                      <input
                        type="text"
                        value={inTheNewsGoogleDocUrl}
                        onChange={(e) => setInTheNewsGoogleDocUrl(e.target.value)}
                        className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800"
                        placeholder="https://docs.google.com/document/d/.../edit"
                      />
                    </div>
                    
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Jadual Refresh Google Doc (Format 24j, cth: 12:10, 00:10)</label>
                      <input
                        type="text"
                        value={googleDocSyncTimes}
                        onChange={(e) => setGoogleDocSyncTimes(e.target.value)}
                        className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800"
                        placeholder="12:10, 00:10"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 mb-1">
                    {renderGoogleDocConnectionStatus(inTheNewsGoogleDocStatus, docItems.length)}
                  </div>
                  
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Raw Digest Text (Source B)</label>
                    <textarea
                      value={inTheNewsRawText}
                      onChange={(e) => setInTheNewsRawText(e.target.value)}
                      rows={8}
                      className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800"
                      placeholder="desk: Astronomy&#10;title: Title of post&#10;brief: Brief text...&#10;source: Source Name&#10;url: Link url&#10;&#10;---&#10;&#10;..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSaveNewsDigest}
                    className="w-full bg-[#7B2737] hover:bg-[#631e2a] text-white py-2 px-4 rounded text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                  >
                    Save News Digest Settings
                  </button>
                </div>
                
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-stone-200 rounded p-4 bg-stone-50/60 space-y-3 max-h-[300px] overflow-y-auto text-left">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-semibold block">Parsed Items ({newsParsedItems.length})</span>
                    {newsParsedItems.length === 0 ? (
                      <p className="font-sans italic text-stone-400 text-xs">No valid items parsed. Add items above.</p>
                    ) : (
                      <div className="space-y-3">
                        {newsParsedItems.map((item, i) => (
                          <div key={i} className="text-xs border-b border-stone-200 pb-2.5 last:border-b-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-bold text-[#7B2737]">{item.title}</span>
                              <span className="font-mono text-[8px] tracking-wider bg-stone-200 px-1 py-0.5 rounded font-semibold text-stone-600 uppercase">
                                {item.desk}
                              </span>
                            </div>
                            <p className="text-stone-600 line-clamp-2 leading-relaxed font-sans text-[11px]">{item.brief}</p>
                            <div className="flex justify-between text-stone-400 font-mono text-[8.5px]">
                              <span>Source: {item.source}</span>
                              {item.url && <span className="underline truncate max-w-[150px]">Link: {item.url}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {newsParseErrors.length > 0 && (
                    <div className="border border-red-200 rounded p-4 bg-red-50/30 text-left space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-red-500 font-bold block flex items-center gap-1.5 flex select-none">
                        <AlertTriangle className="w-3.5 h-3.5" /> Parse Warnings/Errors ({newsParseErrors.length})
                      </span>
                      <ul className="list-disc pl-4 text-[10px] text-red-700 font-mono space-y-1 max-h-[150px] overflow-y-auto">
                        {newsParseErrors.map((err, i) => (
                          <li key={i}>Item {err.index}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* World Clock Calendars & Holidays digest raw editor */}
      {(() => {
        const { items: docItems, errors: docErrors } = parseWorldClockHolidays(worldClockHolidaysGoogleDocText);
        const { items: localItems, errors: localErrors } = parseWorldClockHolidays(worldClockHolidaysRawText);
        const holidayParsedItems = [...docItems, ...localItems];
        const holidayParseErrors = [...docErrors, ...localErrors];
        return (
          <div className="lg:col-span-12 mt-6 border-t border-stone-200 pt-6">
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm space-y-6">
              <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1F1F]">World Clock Calendars & Holidays Digest</h3>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Curate city working statuses and public holidays (separated by ---)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadHolidaysTemplate}
                    className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 rounded transition cursor-pointer font-semibold"
                  >
                    Download Template (.txt)
                  </button>
                  <span className="font-mono text-[9px] uppercase px-2 py-1 bg-stone-100 text-stone-600 rounded w-fit select-none">Version 1.0 Spec</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Google Doc URL (Source A)</label>
                      <input
                        type="text"
                        value={worldClockHolidaysGoogleDocUrl}
                        onChange={(e) => setWorldClockHolidaysGoogleDocUrl(e.target.value)}
                        className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800"
                        placeholder="https://docs.google.com/document/d/.../edit"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 mb-1">
                    {renderGoogleDocConnectionStatus(worldClockHolidaysGoogleDocStatus, docItems.length)}
                  </div>
                  
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">Raw Holidays Text (Source B)</label>
                    <textarea
                      value={worldClockHolidaysRawText}
                      onChange={(e) => setWorldClockHolidaysRawText(e.target.value)}
                      rows={8}
                      className="w-full border border-stone-200 p-2.5 rounded font-mono text-xs focus:outline-none focus:border-adjung-maroon bg-[#FAFAF9] text-stone-800"
                      placeholder="city: London&#10;date: 2026-12-25&#10;name: Christmas Day&#10;status: closed&#10;&#10;---&#10;&#10;..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSaveWorldClockHolidays}
                    className="w-full bg-[#7B2737] hover:bg-[#631e2a] text-white py-2 px-4 rounded text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                  >
                    Save Holidays Settings
                  </button>
                </div>
                
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-stone-200 rounded p-4 bg-stone-50/60 space-y-3 max-h-[300px] overflow-y-auto text-left">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-semibold block">Valid Items ({holidayParsedItems.length})</span>
                    {holidayParsedItems.length === 0 ? (
                      <p className="font-sans italic text-stone-400 text-xs">No valid items parsed. Add items above.</p>
                    ) : (
                      <div className="space-y-3">
                        {holidayParsedItems.map((item, i) => (
                          <div key={i} className="text-xs border-b border-stone-200 pb-2.5 last:border-b-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-bold text-[#7B2737]">{item.city}</span>
                              <span className="font-mono text-[8px] tracking-wider bg-stone-200 px-1 py-0.5 rounded font-semibold text-stone-600 uppercase">
                                {item.status}
                              </span>
                            </div>
                            <div className="flex justify-between text-stone-500 font-mono text-[10px]">
                              <span>Date: {item.dateStr}</span>
                              {item.holidayName && <span>Name: {item.holidayName}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {holidayParseErrors.length > 0 && (
                    <div className="border border-red-200 rounded p-4 bg-red-50/30 text-left space-y-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-red-500 font-bold block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Parse Warnings/Errors ({holidayParseErrors.length})
                      </span>
                      <ul className="list-disc pl-4 text-[10px] text-red-700 font-mono space-y-1 max-h-[150px] overflow-y-auto">
                        {holidayParseErrors.map((err, i) => (
                          <li key={i}>Item {err.index}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
