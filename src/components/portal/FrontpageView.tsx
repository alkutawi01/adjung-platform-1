import React, { useState, useEffect } from 'react';
import { User, Entry, SystemSettings } from '../../types';
import { BRAND } from '../../config/brand';
import { parseInlineFormatting, isArabicText } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Info } from 'lucide-react';

interface FrontpageViewProps {
  entries: Entry[];
  users: User[];
  systemSettings: SystemSettings;
  setSelectedEntry: (entry: Entry | null) => void;
  setSelectedAuthorId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  currentUser?: User | null;
}

export const FrontpageView: React.FC<FrontpageViewProps> = ({
  entries,
  users,
  systemSettings,
  setSelectedEntry,
  setSelectedAuthorId,
  setActiveTab,
  currentUser,
}) => {
  // 1. World Clock State
  const [times, setTimes] = useState<string[]>(['', '', '', '', '']);

  useEffect(() => {
    const cities = [
      { name: 'Tokyo', tz: 'Asia/Tokyo' },
      { name: 'Kuala Lumpur', tz: 'Asia/Kuala_Lumpur' },
      { name: 'Makkah', tz: 'Asia/Riyadh' }, // Makkah is in Riyadh timezone (UTC+3)
      { name: 'London', tz: 'Europe/London' },
      { name: 'New York', tz: 'America/New_York' }
    ];

    const updateTime = () => {
      const newTimes = cities.map(c => {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: c.tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const parts = formatter.formatToParts(new Date());
          const obj: any = {};
          parts.forEach(p => { obj[p.type] = p.value; });
          return `${obj.month}/${obj.day}/${obj.year} · ${obj.weekday.toUpperCase()} · ${obj.hour}:${obj.minute}`;
        } catch (e) {
          return '';
        }
      });
      setTimes(newTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to extract name initials (e.g. "Elena Vasquez" -> "E.V.")
  const getInitials = (name: string): string => {
    if (!name) return '';
    return name
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase())
      .filter(c => /[A-Z]/.test(c))
      .join('.') + '.';
  };

  // Helper to estimate reading duration
  const estimateReadingTime = (content: string): number => {
    if (!content) return 1;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // 2. Curated & Dynamic Content Prep
  const featuredEntry = entries.find(
    (e) => e.id === systemSettings.featuredEntryId && e.status === 'Published'
  );

  const fallbackFeatured: Entry = {
    id: 'fallback-featured',
    authorId: null,
    publisher: 'Elena Vasquez',
    contentType: 'Essay',
    status: 'Published',
    visibility: 'Public',
    createdDate: new Date(2026, 6, 4).toISOString(),
    updatedDate: new Date(2026, 6, 4).toISOString(),
    publishedDate: new Date(2026, 6, 4).toISOString(),
    title: 'On the Preservation of Human Knowledge in an Age of Impermanence',
    slug: 'preservation-of-human-knowledge',
    tags: ['Philosophy', 'Preservation', 'Institutions'],
    canonicalUrl: 'https://adjung.com/essay/preservation-of-human-knowledge',
    content: `A meditation on why civilizations forget, how libraries burn, and what it means to build institutions that outlast their founders. This essay traces the arc from Alexandria to the digital present, arguing that preservation is not passive but an active, moral commitment.`,
    excerpt: `A meditation on why civilizations forget, how libraries burn, and what it means to build institutions that outlast their founders. This essay traces the arc from Alexandria to the digital present, arguing that preservation is not passive but an active, moral commitment.`
  };

  const activeFeatured = featuredEntry || fallbackFeatured;
  const featuredAuthor = activeFeatured.authorId 
    ? users.find(u => u.id === activeFeatured.authorId) 
    : null;
  const featuredAuthorName = featuredAuthor?.penName || activeFeatured.publisher || 'Elena Vasquez';
  const featuredAuthorSig = featuredAuthor?.signature || getInitials(featuredAuthorName);

  // Editorial Note Aside
  const dbEditorNote = entries
    .filter((e) => e.contentType === "Editor's Note" && e.status === 'Published')
    .sort(
      (a, b) =>
        new Date(b.publishedDate || b.createdDate).getTime() -
        new Date(a.publishedDate || a.createdDate).getTime()
    )[0];

  // News Ticker State & Logic
  const [tickerIndex, setTickerIndex] = useState(0);
  const notices = entries.filter((e) => e.contentType === 'Notice' && e.status === 'Published');
  const fallbackTicker = [
    "New archaeological findings reveal previously unknown trade routes across Central Asia during the 8th century.",
    "Leading institutions establish consortium for digital preservation of endangered linguistic archives.",
    "Study examines long-term effects of historical documentation practices on contemporary scholarship."
  ];
  const tickerItems = notices.length > 0
    ? notices.map(n => `${n.title} - ${n.excerpt || n.content.substring(0, 100)}`)
    : fallbackTicker;

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerItems.length]);

  // Curation permissions
  const canCurate = currentUser && (
    currentUser.role === 'Chief Editor' || 
    currentUser.role === 'Editor' || 
    currentUser.role === 'Admin'
  );

  // Editor's Selections Grid (3 Columns)
  const selectedEntries = systemSettings.editorialSelectionIds
    ? entries.filter(e => systemSettings.editorialSelectionIds.includes(e.id) && e.status === 'Published')
    : [];

  const fallbackSelections = [
    {
      id: 'sel-1',
      title: 'The Cartography of Forgotten Languages',
      excerpt: 'How dead languages map the migrations of thought across millennia, and what their disappearance tells us about intellectual fragility.',
      discipline: 'HISTORY',
      authorName: 'Marguerite Lefèvre',
      authorSig: 'M.L.'
    },
    {
      id: 'sel-2',
      title: 'Silence as Method: Against the Obligation to Publish',
      excerpt: 'An argument for intellectual restraint in a world that rewards prolificacy over depth.',
      discipline: 'PHILOSOPHY',
      authorName: 'Tomas Eriksson',
      authorSig: 'T.E.'
    },
    {
      id: 'sel-3',
      title: 'The Ethics of Observation in Quantum Epistemology',
      excerpt: 'When measurement alters reality, the observer becomes participant. What this means for the philosophy of knowledge.',
      discipline: 'SCIENCE',
      authorName: 'Dr. Kenji Watanabe',
      authorSig: 'K.W.'
    }
  ];

  let selectionsList: any[] = selectedEntries.map(e => {
    const auth = users.find(u => u.id === e.authorId);
    const authName = auth?.penName || e.publisher || 'Scholar';
    return {
      id: e.id,
      title: e.title || (e.contentType === 'Note' ? 'Philosophical Fragment' : 'Untitled'),
      excerpt: e.excerpt || e.content.substring(0, 150) + '...',
      discipline: e.discipline || e.tags[0] || e.contentType,
      authorName: authName,
      authorSig: auth?.signature || getInitials(authName),
      entryObj: e
    };
  });

  if (selectionsList.length < 3) {
    const fallbacksNeeded = 3 - selectionsList.length;
    selectionsList = [
      ...selectionsList,
      ...fallbackSelections.slice(0, fallbacksNeeded)
    ];
  }

  // Featured Essays (3 entries)
  const essays = entries
    .filter(e => e.contentType === 'Essay' && e.status === 'Published' && e.id !== activeFeatured.id)
    .sort((a,b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())
    .slice(0, 3);

  const fallbackEssays = [
    { id: 'essay-fb-1', title: 'Architecture and Memory: On Building for Centuries', author: 'Anouk de Vries', sig: 'A.V.' },
    { id: 'essay-fb-2', title: 'The Moral Weight of Annotation', author: 'Samuel Okonkwo', sig: 'S.O.' },
    { id: 'essay-fb-3', title: 'Why We Still Read the Ancients', author: 'Isabela Moreira', sig: 'I.M.' }
  ];

  const displayEssays = essays.length > 0 
    ? essays.map(e => {
        const auth = users.find(u => u.id === e.authorId);
        const name = auth?.penName || e.publisher || 'Writer';
        return { id: e.id, title: e.title, author: name, sig: auth?.signature || getInitials(name), entryObj: e };
      })
    : fallbackEssays;

  // Featured Notes (2 entries)
  const notes = entries
    .filter(e => e.contentType === 'Note' && e.status === 'Published')
    .sort((a,b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())
    .slice(0, 2);

  const fallbackNotes = [
    { id: 'note-fb-1', title: 'On the Difference Between Knowledge and Information', author: 'R. Nakamura', sig: 'R.N.' },
    { id: 'note-fb-2', title: 'A Brief Defence of Slowness in Scholarship', author: 'C. Hoffmann', sig: 'C.H.' }
  ];

  const displayNotes = notes.length > 0
    ? notes.map(n => {
        const auth = users.find(u => u.id === n.authorId);
        const name = auth?.penName || n.publisher || 'Writer';
        return { id: n.id, title: n.title || n.content.substring(0, 80) + '...', author: name, sig: auth?.signature || getInitials(name), entryObj: n };
      })
    : fallbackNotes;

  // Institutional Notice Board
  const noticeBoardText = notices.length > 0
    ? `${notices[0].title}: ${notices[0].excerpt || notices[0].content.substring(0, 150)}`
    : "Adjung will begin accepting applications for the 2027 Fellowship Programme in September. Details will be published in the Directory.";

  return (
    <div className="bg-[#FAF8F3] text-[#1F1F1F] font-serif w-full min-h-screen px-4 md:px-8 py-12 select-none animate-fade-in">
      <div className="max-w-5xl mx-auto">
        
        {/* Wordmark Hero */}
        <section className="text-center pt-8 pb-6 animate-fade-in">
          <h1 className="font-serif font-light tracking-tight text-6xl md:text-7xl text-[#1F1F1F]">
            {BRAND.logoText}
          </h1>
          <p className="font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#777777] mt-3">
            {BRAND.tagline}
          </p>
        </section>

        <hr className="rule border-t border-[#E0DDD8] my-3" />

        {/* World Clock Strip */}
        <div className="py-2.5 flex justify-center items-center overflow-x-auto gap-10 px-1 text-center" id="world-clock">
          {[
            { city: 'Tokyo', tz: 'Asia/Tokyo' },
            { city: 'Kuala Lumpur', tz: 'Asia/Kuala_Lumpur' },
            { city: 'Makkah', tz: 'Asia/Riyadh' },
            { city: 'London', tz: 'Europe/London' },
            { city: 'New York', tz: 'America/New_York' }
          ].map((c, i) => (
            <div key={c.city} className="flex-shrink-0">
              <p className="font-sans text-[9px] tracking-editorial uppercase text-[#777777] mb-0.5">
                {c.city}
              </p>
              <p className="font-serif text-xs md:text-sm text-[#1F1F1F] font-light min-w-[140px]">
                {times[i] || 'Loading...'}
              </p>
            </div>
          ))}
        </div>

        <hr className="rule border-t border-[#E0DDD8] my-3" />

        {/* News Ticker */}
        <div className="py-2.5">
          <p className="font-sans text-[10px] tracking-editorial uppercase text-[#7B2737] font-semibold mb-2">
            IN THE NEWS
          </p>
          <div className="ticker-container h-6 overflow-hidden relative">
            {tickerItems.map((item, idx) => {
              let statusClass = "ticker-item";
              if (idx === tickerIndex) {
                statusClass = "ticker-item active";
              } else if (idx === (tickerIndex - 1 + tickerItems.length) % tickerItems.length) {
                statusClass = "ticker-item prev";
              }
              return (
                <div key={idx} className={statusClass}>
                  <p className="font-serif text-[14.5px] md:text-[15.5px] text-[#1F1F1F] leading-relaxed line-clamp-1">
                    {item}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="rule border-t border-[#E0DDD8] my-3" />

        {/* Featured Entry Label with Curation Option */}
        <div className="pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold">
              FEATURED ENTRY
            </span>
            {canCurate && (
              <button
                onClick={() => setActiveTab('editorium')}
                className="ml-3 flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#7B2737] hover:bg-stone-200/50 px-1.5 py-0.5 rounded border border-[#7B2737]/25 transition cursor-pointer"
                title="Manage Frontpage Curation"
              >
                <Settings className="w-2.5 h-2.5" /> Curate
              </button>
            )}
          </div>
        </div>

        {/* Two Column Hero */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-3 pb-8">
          
          {/* Left: Main Featured Article */}
          <div className="md:col-span-2 space-y-4">
            <h2 
              onClick={() => {
                if (activeFeatured.id !== 'fallback-featured') {
                  setSelectedEntry(activeFeatured);
                  setSelectedAuthorId(activeFeatured.authorId);
                  setActiveTab('folio');
                }
              }}
              className={`font-serif font-light leading-tight text-3xl md:text-4xl text-[#1F1F1F] hover:text-[#7B2737] transition-colors duration-200 ${
                activeFeatured.id !== 'fallback-featured' ? 'cursor-pointer' : ''
              }`}
            >
              {parseInlineFormatting(activeFeatured.title)}
            </h2>
            
            <p className="font-serif text-[16px] md:text-[17px] text-[#444444] leading-relaxed font-light">
              {parseInlineFormatting(activeFeatured.excerpt || activeFeatured.content.substring(0, 300) + '...')}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] md:text-xs text-[#777777]">
              <span 
                onClick={() => {
                  if (activeFeatured.authorId) {
                    setSelectedAuthorId(activeFeatured.authorId);
                    setActiveTab('bio');
                  }
                }}
                className={`font-sans tracking-editorial uppercase text-[#1F1F1F] ${
                  activeFeatured.authorId ? 'hover:text-[#7B2737] cursor-pointer font-medium' : ''
                }`}
              >
                {featuredAuthorName}
              </span>
              <span className="sig italic font-serif text-[9.5px] opacity-70">
                {featuredAuthorSig}
              </span>
              <span className="text-[#E0DDD8]">·</span>
              <span className="font-sans">
                {activeFeatured.publishedDate 
                  ? new Date(activeFeatured.publishedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '4 July 2026'}
              </span>
              <span className="text-[#E0DDD8]">·</span>
              <span className="font-sans">
                {estimateReadingTime(activeFeatured.content)} min read
              </span>
              <span className="text-[#E0DDD8]">·</span>
              <span className="font-sans">
                {activeFeatured.tags[0] || 'Scholarly'}
              </span>
            </div>

            {/* Author Script Signature stamp */}
            <div className="pt-2">
              <p className="sig font-serif text-[16px] md:text-[18px] text-[#1F1F1F] opacity-80 select-none">
                {featuredAuthorSig.replace(/\./g, '')}
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (activeFeatured.id !== 'fallback-featured') {
                    setSelectedEntry(activeFeatured);
                    setSelectedAuthorId(activeFeatured.authorId);
                    setActiveTab('folio');
                  } else {
                    setActiveTab('index');
                  }
                }}
                className="font-sans text-xs tracking-editorial uppercase text-[#7B2737] hover:text-[#9e3347] transition border-b border-[#7B2737] pb-0.5 font-semibold cursor-pointer"
              >
                Read Full Essay →
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Note */}
          <aside className="border-l border-[#E0DDD8] pl-6 md:pl-8 space-y-4">
            <span className="block font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold">
              EDITORIAL NOTE
            </span>
            
            {dbEditorNote ? (
              <div 
                onClick={() => {
                  setSelectedEntry(dbEditorNote);
                  setActiveTab('editorial');
                }}
                className="cursor-pointer group space-y-3"
              >
                <h4 className="font-serif text-lg md:text-xl text-[#1F1F1F] leading-snug group-hover:text-[#7B2737] transition">
                  {parseInlineFormatting(dbEditorNote.title)}
                </h4>
                <p className="font-serif text-sm leading-relaxed text-[#444444] italic">
                  {parseInlineFormatting(dbEditorNote.excerpt || dbEditorNote.content.substring(0, 220) + '...')}
                </p>
                <span className="inline-block font-sans text-[9px] uppercase tracking-wider text-[#7B2737] hover:underline">
                  Continue Reading →
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-serif text-[14px] leading-relaxed text-[#444444] font-light">
                  This week we return to a question that has occupied Adjung since its founding: what does it mean to publish something that endures? In an era of ephemeral content and algorithmic decay, the act of writing for permanence is itself a form of resistance. We present Dr. Vasquez's essay as both argument and demonstration.
                </p>
                <p className="font-sans text-[9px] tracking-editorial uppercase text-[#777777] font-medium leading-normal">
                  THE ADJUNG EDITORIAL BOARD
                </p>
              </div>
            )}
          </aside>

        </section>

        <hr className="rule border-t border-[#E0DDD8]" />

        {/* Editor's Selections */}
        <section className="py-10">
          <div className="flex items-center justify-between mb-8">
            <span className="font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold">
              EDITOR'S SELECTIONS
            </span>
            {canCurate && (
              <button
                onClick={() => setActiveTab('editorium')}
                className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-[#7B2737] hover:bg-stone-200/50 px-1.5 py-0.5 rounded border border-[#7B2737]/25 transition cursor-pointer"
              >
                Curate Selection
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {selectionsList.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => {
                  if (item.entryObj) {
                    setSelectedEntry(item.entryObj);
                    setSelectedAuthorId(item.entryObj.authorId);
                    setActiveTab('folio');
                  }
                }}
                className={`space-y-2.5 ${idx > 0 ? 'md:border-l md:border-[#E0DDD8] md:pl-8' : ''} ${item.entryObj ? 'cursor-pointer group' : ''}`}
              >
                <p className="font-sans text-[9px] md:text-[10px] tracking-editorial uppercase text-[#777777]">
                  {item.discipline}
                </p>
                <h3 className="font-serif font-light text-[20px] md:text-[22px] text-[#1F1F1F] leading-snug group-hover:text-[#7B2737] transition-colors duration-200">
                  {parseInlineFormatting(item.title)}
                </h3>
                <p className="font-serif text-sm leading-relaxed text-[#444444]">
                  {parseInlineFormatting(item.excerpt)}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-sans text-[9px] md:text-[10px] text-[#777777]">
                    {item.authorName.toUpperCase()}
                  </span>
                  <span className="sig italic text-[9px] text-[#777777] opacity-70">
                    {item.authorSig}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule border-t border-[#E0DDD8]" />

        {/* Featured Essays & Notes Section */}
        <section className="py-10 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Column 1 & 2: Featured Essays */}
          <div className="md:col-span-2 space-y-6">
            <span className="block font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold mb-2">
              FEATURED ESSAYS
            </span>
            <div className="space-y-4">
              {displayEssays.map((essay) => (
                <div 
                  key={essay.id}
                  onClick={() => {
                    if (essay.entryObj) {
                      setSelectedEntry(essay.entryObj);
                      setSelectedAuthorId(essay.entryObj.authorId);
                      setActiveTab('folio');
                    }
                  }}
                  className={`flex justify-between items-baseline border-b border-[#E0DDD8] pb-3 ${
                    essay.entryObj ? 'cursor-pointer group' : ''
                  }`}
                >
                  <h3 className="font-serif font-light text-[18px] md:text-[20px] text-[#1F1F1F] group-hover:text-[#7B2737] transition-colors max-w-[70%]">
                    {parseInlineFormatting(essay.title)}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#777777]">
                    <span className="font-sans font-light">{essay.author}</span>
                    <span className="sig italic font-serif text-[9px] opacity-70">{essay.sig}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Featured Notes */}
          <div className="border-l border-[#E0DDD8] pl-6 md:pl-8 space-y-6">
            <span className="block font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold mb-2">
              FEATURED NOTES
            </span>
            <div className="space-y-5">
              {displayNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => {
                    if (note.entryObj) {
                      setSelectedEntry(note.entryObj);
                      setSelectedAuthorId(note.entryObj.authorId);
                      setActiveTab('folio');
                    }
                  }}
                  className={`space-y-1.5 ${note.entryObj ? 'cursor-pointer group' : ''}`}
                >
                  <h3 className="font-serif font-light text-[18px] text-[#1F1F1F] leading-snug group-hover:text-[#7B2737] transition-colors">
                    {parseInlineFormatting(note.title)}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-[#777777]">
                    <span className="font-sans font-light">{note.author}</span>
                    <span className="sig italic text-[9px] opacity-70">{note.sig}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        <hr className="rule border-t border-[#E0DDD8]" />

        {/* Institutional Section */}
        <section className="py-10">
          <span className="block font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold mb-8">
            INSTITUTIONAL
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Notice Board */}
            <div>
              <p className="font-sans text-[9px] md:text-[10px] tracking-editorial uppercase text-[#777777] mb-2 font-medium">
                NOTICE BOARD
              </p>
              <p className="font-serif text-sm leading-relaxed text-[#444444] font-light">
                {parseInlineFormatting(noticeBoardText)}
              </p>
            </div>
            
            {/* Publishing Policy */}
            <div className="md:border-l md:border-[#E0DDD8] md:pl-8">
              <p className="font-sans text-[9px] md:text-[10px] tracking-editorial uppercase text-[#777777] mb-2 font-medium">
                PUBLISHING POLICY
              </p>
              <p className="font-serif text-sm leading-relaxed text-[#444444] font-light">
                All works are reviewed for intellectual merit and editorial clarity. Adjung does not optimise for engagement. We publish what endures.
              </p>
            </div>
            
            {/* About */}
            <div className="md:border-l md:border-[#E0DDD8] md:pl-8">
              <p className="font-sans text-[9px] md:text-[10px] tracking-editorial uppercase text-[#777777] mb-2 font-medium">
                ABOUT ADJUNG
              </p>
              <p className="font-serif text-sm leading-relaxed text-[#444444] font-light">
                Adjung is a knowledge publishing platform dedicated to thoughtful writing, scholarly publishing, and the long-term preservation of human knowledge.
              </p>
            </div>
          </div>
        </section>

        <hr className="rule border-t border-[#E0DDD8]" />

        {/* Collections & Topics */}
        <section className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <p className="font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold mb-4">
                COLLECTIONS
              </p>
              {['The Preservation Papers', 'Letters on Method', 'Foundations of Inquiry'].map(coll => (
                <p 
                  key={coll}
                  onClick={() => setActiveTab('index')} 
                  className="font-serif text-[16px] text-[#1F1F1F] hover:text-[#7B2737] transition duration-150 mb-2.5 cursor-pointer inline-block w-full"
                >
                  {coll}
                </p>
              ))}
            </div>
            
            <div className="md:border-l md:border-[#E0DDD8] md:pl-8">
              <p className="font-sans text-[10px] md:text-xs tracking-editorial uppercase text-[#7B2737] font-semibold mb-4">
                TOPICS
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Philosophy', 'History', 'Science', 'Literature'].map(topic => (
                  <p 
                    key={topic}
                    onClick={() => setActiveTab('index')}
                    className="font-serif text-[16px] text-[#1F1F1F] hover:text-[#7B2737] transition duration-150 cursor-pointer"
                  >
                    {topic}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
