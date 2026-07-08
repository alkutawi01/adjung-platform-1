import React, { useState, useEffect } from 'react';
import { User, Entry, SystemSettings } from '../types';
import { BRAND } from '../config/brand';
import { parseInlineFormatting, isArabicText } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface FrontpageViewProps {
  entries: Entry[];
  users: User[];
  systemSettings: SystemSettings;
  setSelectedEntry: (entry: Entry | null) => void;
  setSelectedAuthorId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const FrontpageView: React.FC<FrontpageViewProps> = ({
  entries,
  users,
  systemSettings,
  setSelectedEntry,
  setSelectedAuthorId,
  setActiveTab,
}) => {
  const [frontpageCarouselIndex, setFrontpageCarouselIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrontpageCarouselIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const featuredEntry = entries.find(
    (e) => e.id === systemSettings.featuredEntryId && e.status === 'Published'
  );
  
  const notice = entries
    .filter((e) => e.contentType === 'Notice' && e.status === 'Published')
    .sort(
      (a, b) =>
        new Date(b.publishedDate || b.createdDate).getTime() -
        new Date(a.publishedDate || a.createdDate).getTime()
    )[0];

  const editorNote = entries
    .filter((e) => e.contentType === "Editor's Note" && e.status === 'Published')
    .sort(
      (a, b) =>
        new Date(b.publishedDate || b.createdDate).getTime() -
        new Date(a.publishedDate || a.createdDate).getTime()
    )[0];

  const editorialSelections = entries.filter(
    (e) => systemSettings.editorialSelectionIds?.includes(e.id) && e.status === 'Published'
  );

  const latestEntries = entries
    .filter((e) => e.status === 'Published' && !e.isInstitutional && e.id !== featuredEntry?.id)
    .sort(
      (a, b) =>
        new Date(b.publishedDate || b.createdDate).getTime() -
        new Date(a.publishedDate || a.createdDate).getTime()
    )
    .slice(0, 10);

  const currentLatestEntry =
    latestEntries.length > 0
      ? latestEntries[frontpageCarouselIndex % latestEntries.length]
      : null;

  return (
    <div className="max-w-4xl mx-auto select-none animate-fade-in space-y-24 py-16 px-4">
      {/* 1. Logo / Identiti Adjung */}
      <div className="text-center pt-8">
        <h1 className="font-serif text-5xl md:text-6xl font-light text-[#802334] tracking-tight mb-4">
          {BRAND.logoText}
        </h1>
        <span className="font-mono text-[10px] text-stone-500 uppercase tracking-[0.3em]">
          {BRAND.tagline}
        </span>
      </div>

      {/* 2. Featured Entry */}
      {featuredEntry && (
        <div
          className="text-center group cursor-pointer"
          onClick={() => {
            setSelectedEntry(featuredEntry);
            setSelectedAuthorId(featuredEntry.authorId);
            setActiveTab('folio');
          }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-stone-200"></div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#802334] font-bold">
              Featured Entry
            </span>
            <div className="h-px w-12 bg-stone-200"></div>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-stone-900 leading-tight mb-6 group-hover:text-[#802334] transition-colors px-4">
            {parseInlineFormatting(featuredEntry.title)}
          </h2>
          <p className="font-serif text-stone-500 italic max-w-2xl mx-auto leading-relaxed">
            {featuredEntry.excerpt || featuredEntry.content.substring(0, 200) + '...'}
          </p>
        </div>
      )}

      {/* 3. Editor's Note (Optional) */}
      {editorNote && (
        <div
          className="border-t border-stone-200 pt-16 max-w-2xl mx-auto text-center cursor-pointer group"
          onClick={() => {
            setSelectedEntry(editorNote);
            setActiveTab('editorial');
          }}
        >
          <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-4">
            Editor's Note
          </span>
          <h3 className="font-serif text-2xl text-stone-900 mb-4 group-hover:text-[#802334] transition">
            {parseInlineFormatting(editorNote.title)}
          </h3>
          <p className="font-serif italic text-stone-600 line-clamp-2 mb-3">
            {editorNote.excerpt || editorNote.content.substring(0, 150) + '...'}
          </p>
          <span className="inline-block text-[#802334] hover:underline font-mono text-[10px] uppercase tracking-wider font-semibold">
            Continue Reading →
          </span>
        </div>
      )}

      {/* 4. Editorial Selection */}
      {editorialSelections.length > 0 && (
        <div className="pt-8">
          <div className="flex items-center gap-4 mb-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 flex-shrink-0">
              Editorial Selection
            </span>
            <div className="h-px w-full bg-stone-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {editorialSelections.map((item) => {
              const author = users.find((u) => u.id === item.authorId);
              const isNote = item.contentType === 'Note';
              const isAr = isArabicText(item.content);
              return (
                <div
                  key={item.id}
                  className={`group cursor-pointer transition-all p-4 rounded border ${
                    isNote 
                      ? 'bg-[#FAF8F5] border-stone-200/50 hover:border-stone-300 hover:shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-stone-50/40'
                  } ${isAr ? 'text-right' : 'text-left'}`}
                  style={isNote 
                    ? { fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } 
                    : undefined}
                  onClick={() => {
                    setSelectedEntry(item);
                    setSelectedAuthorId(item.authorId);
                    setActiveTab('folio');
                  }}
                >
                  <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-2">
                    {item.contentType}
                  </span>
                  <h4 className={`text-stone-900 group-hover:text-[#802334] transition leading-tight mb-2 ${
                    isNote 
                      ? (isAr ? 'text-xl font-bold font-arabic-handwritten' : 'text-lg md:text-xl font-bold font-handwritten') 
                      : 'font-serif text-xl'
                  }`}>
                    {parseInlineFormatting(item.title)}
                  </h4>
                  <span className={`text-[11px] text-stone-500 ${isNote ? (isAr ? 'font-arabic-handwritten' : 'font-handwritten') : 'font-sans'}`}>
                    {author?.penName || 'Writer'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Latest Entries (Auto-Rotate) */}
      {currentLatestEntry && (
        <div className="p-12 text-center">
          <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-8">
            Latest Transmissions
          </span>
          <div className="h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLatestEntry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.5 }}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedEntry(currentLatestEntry);
                  setSelectedAuthorId(currentLatestEntry.authorId);
                  setActiveTab('folio');
                }}
              >
                <h4 className="font-serif text-2xl text-stone-900 group-hover:text-[#802334] transition mb-3">
                  {parseInlineFormatting(currentLatestEntry.title)}
                </h4>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-sans text-[11px] text-stone-500">
                    {users.find((u) => u.id === currentLatestEntry.authorId)?.penName || 'Writer'}
                  </span>
                  <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
                    {currentLatestEntry.contentType}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 6. Notice (Optional, Bottom) */}
      {notice && (
        <div
          className="mt-24 pt-12 border-t border-stone-200 cursor-pointer group"
          onClick={() => {
            setSelectedEntry(notice);
            setActiveTab('notices');
          }}
        >
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-6 text-center md:text-left bg-[#802334]/5 p-6 rounded border border-[#802334]/10 hover:bg-[#802334]/10 transition">
            <span className="w-2 h-2 bg-[#802334] rotate-45 flex-shrink-0"></span>
            <div>
              <h4 className="font-serif text-lg text-[#802334] mb-1">
                {parseInlineFormatting(notice.title)}
              </h4>
              <p className="font-sans text-[13px] text-stone-600 line-clamp-2">
                {parseInlineFormatting(notice.excerpt || notice.content)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
