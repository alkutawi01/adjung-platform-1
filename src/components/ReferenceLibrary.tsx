import React, { useState } from 'react';
import { Entry, User, Footnote } from '../types';
import { EntryRenderer } from './EntryRenderer';
import { db } from '../db/mockDb';
import { isArabicText } from '../utils';
import { BookOpen, FileText, Layers, CheckCircle, Monitor, Eye, Layout, Calendar, Search } from 'lucide-react';

const archetypeLanguageVersions: Record<string, { LTR: Partial<Entry>; RTL: Partial<Entry> }> = {
  'entry-canonical-note': {
    LTR: {
      content: 'This is the Canonical Note. Note publications are short, casual observations designed without massive titles or abstract summaries. They rely on hand-written letterforms like Caveat to deliver an intimate reading experience. By utilizing [direct](gloss:clear) notation, they offer immediate clarity.',
      title: 'Canonical Note on Classical Scholarship',
      tags: ['Canonical', 'Note', 'Standard']
    },
    RTL: {
      content: 'هذه هي الملاحظة المعيارية المكتوبة بخط الرقعة العربي التقليدي. تُعرض الملاحظات دائمًا بدون عناوين ضخمة، لتوفير تجربة قراءة حميمية ومريحة للباحث الكلاسيكي.',
      title: 'Canonical Arabic Note (الترميز العربي)',
      tags: ['Canonical', 'Arabic', 'Note']
    }
  },
  'entry-canonical-essay': {
    LTR: {
      content: 'The art of typography is not merely the selection of letterforms; it is the curation of visual silence. In the scholastic tradition, the text occupies a sacred geography on the page [^1]. The margins are not empty space, but the structural frame that allows the text to breathe and command authority. By studying the early printed sheets of the fifteenth century, we discover that alignment and proportion were treated as geometry, reflecting the harmony of the cosmic order.\n\n### The Sacred Geometry of Margins\n\nHistorically, the page margins followed strict ratios such as the golden section [^2]. These proportions ensured that the reader\'s thumb would never obscure the text, and that the balance between ink and white space remained constant. In modern digital rendering, we must preserve this structural restraint to avoid chaotic visual overload.',
      title: 'Canonical Essay: The Art of Traditional Academic Typography',
      tags: ['Canonical', 'Essay', 'Typography'],
      footnotes: ['[^1]', '[^2]'],
      footnotesData: [
        { id: '1', displayNum: 1, originalId: '1', content: 'This visual silence is equivalent to the musical pause, which gives meaning to the note.' },
        { id: '2', displayNum: 2, originalId: '2', content: 'See Jan Tschichold, "The Form of the Book" (1975) for historical margin ratios.' }
      ]
    },
    RTL: {
      content: 'إن فن الطباعة وهندسة الحروف ليس مجرد اختيار أشكال الحروف، بل هو تهيئة الفراغ البصري المحيط بالنص [^1]. في التقاليد العلمية الكلاسيكية، يحتل النص مساحة مقدسة على الصفحة. الهوامش ليست فراغًا مهملًا، بل هي الإطار الهيكلي الذي يتيح للنص التنفس وفرض هيبته العلمية. من خلال دراسة المخطوطات القديمة وأوائل المطبوعات في القرن الخامس عشر، نكتشف أن المحاذاة والتناسب كانا يعاملان كهندسة مقدسة تعكس تناغم النظام الكوني.\n\n### الهندسة المقدسة للهوامش\n\nتاريخيًا، اتبعت هوامش الصفحة نسبًا صارمة مثل النسبة الذهبية [^2]. وضمنت هذه النسب ألا تغطي إبهام القارئ النص أبدًا، وأن يظل التوازن بين الحبر والفراغ ثابتًا. في التنسيق الرقمي الحديث، يجب علينا الحفاظ على هذا القيد الهيكلي لتجنب الفوضى البصرية.',
      title: 'المقالة النموذجية: فن الطباعة الأكاديمية التقليدية',
      tags: ['نموذجي', 'مقالة', 'خط'],
      footnotes: ['[^1]', '[^2]'],
      footnotesData: [
        { id: '1', displayNum: 1, originalId: '1', content: 'هذا الفراغ البصري يعادل الصمت الموسيقي الذي يمنح النغمة معناها وقيمتها.' },
        { id: '2', displayNum: 2, originalId: '2', content: 'انظر كتاب يان تشيشولد "شكل الكتاب" (1975) لمعرفة نسب الهوامش التاريخية.' }
      ]
    }
  },
  'entry-canonical-article': {
    LTR: {
      content: 'This article presents the digital press layout model, a robust design system engineered for high-performance reading experiences. The system utilizes CSS grids to achieve pixel-perfect alignment across multiple viewport brackets. By combining flexible flexbox structures with explicit grid controls, we establish a responsive workspace that dynamically adjusts to reading behaviors.\n\n### Grid Architecture\n\nThe layout is divided into three primary zones: the global sidebar for platform navigation, the central canvas for text composition, and the elastic margin for annotations and metadata. This spatial segregation ensures that readers can consume core arguments without distracting peripheral noise.',
      title: 'Canonical Article: The Digital Press Layout Model',
      tags: ['Canonical', 'Article', 'Grid'],
      marginNotes: {'0': 'mn-1'},
      marginNotesData: {'mn-1': 'The elastic margin expands dynamically on viewports wider than 1280px to prevent layout shifting.'}
    },
    RTL: {
      content: 'تقدم هذه المقالة نموذج تخطيط الصحافة الرقمية، وهو نظام تصميم متين تم هندسته لتوفير تجارب قراءة عالية الأداء. يعتمد النظام على شبكات CSS لتحقيق محاذاة دقيقة عبر مختلف أبعاد الشاشات. من خلال دمج مرونة التصميم مع عناصر التحكم في الشبكة، ننشئ مساحة عمل تستجيب ديناميكيًا لسلوكيات القراءة.\n\n### بنية الشبكة\n\nينقسم التخطيط إلى ثلاث مناطق رئيسية: الشريط الجانبي للتنقل، والمساحة المركزية لكتابة النصوص، والهامش المرن للملاحظات والبيانات الوصفية. يضمن هذا الفصل المكاني تمكين القراء من استيعاب الحجج الأساسية دون تشتيت.',
      title: 'المقالة النموذجية: نموذج تخطيط الصحافة الرقمية',
      tags: ['نموذجي', 'مقالة', 'شبكة'],
      marginNotes: {'0': 'mn-1'},
      marginNotesData: {'mn-1': 'يتسع الهامش المرن ديناميكياً على الشاشات التي يزيد عرضها عن 1280 بكسل لمنع انزياح التخطيط.'}
    }
  }
};

interface ReferenceLibraryProps {
  entries: Entry[];
  users: User[];
}

type PreviewContext = 'publication' | 'editor' | 'frontpage' | 'folio' | 'search';

export function ReferenceLibrary({ entries, users }: ReferenceLibraryProps) {
  const canonicalEntries = entries.filter(e => e.id.startsWith('entry-canonical-') && !e.id.endsWith('-ar'));
  const [selectedEntryId, setSelectedEntryId] = useState<string>(canonicalEntries[0]?.id || '');
  const [previewContext, setPreviewContext] = useState<PreviewContext>('publication');
  const [language, setLanguage] = useState<'LTR' | 'RTL'>('LTR');
  
  const baseEntry = entries.find(e => e.id === selectedEntryId);
  const selectedEntry = baseEntry ? {
    ...baseEntry,
    ...(archetypeLanguageVersions[baseEntry.id]?.[language] || {})
  } as Entry : undefined;


  const getAuthorInfo = (authorId: string | null) => {
    const author = users.find(u => u.id === authorId);
    let signatureFont = 'Mrs Saint Delafield';
    if (authorId) {
      const identity = db.getIdentityByAccountId(authorId);
      const defaultSig = identity?.signatures?.find(s => s.status === 'Default');
      if (defaultSig && defaultSig.type === 'typed' && defaultSig.fontFamily) {
        const rawFamily = defaultSig.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        signatureFont = `"${rawFamily}", cursive`;
      }
    }
    return {
      name: author?.penName || 'Adjung Editorial Board',
      signature: author?.signature || 'Adjung Editorial Board',
      signatureFont
    };
  };

  const authorInfo = selectedEntry ? getAuthorInfo(selectedEntry.authorId) : { name: '', signature: '', signatureFont: '' };

  const renderContextPreview = () => {
    if (!selectedEntry) return null;

    switch (previewContext) {
      case 'editor':
        return (
          <div className="bg-[#FDFDFD] border border-stone-250 rounded shadow-sm overflow-hidden text-left font-sans">
            {/* Simulated editor header / toolbar */}
            <div className="bg-stone-50 border-b border-stone-200 px-4 py-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold select-none">
              <div className="flex items-center gap-3">
                <span className="text-stone-700 font-bold">Writing Desk (Simulated Editor)</span>
                <span className="text-stone-300">|</span>
                <span>Words: {selectedEntry.content.split(/\s+/).filter(Boolean).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-saved</span>
              </div>
            </div>
            <div className="p-6 bg-stone-50/20">
               <EntryRenderer
                entry={selectedEntry}
                mode="edit"
                preventScrollToTop={true}
                authorName={authorInfo.name}
                authorSignature={authorInfo.signature}
                authorSignatureFont={authorInfo.signatureFont}
              />
            </div>
          </div>
        );

      case 'frontpage':
        return (
          <div className="max-w-md mx-auto p-8 border border-stone-200 rounded-md bg-stone-50/50 shadow-inner flex flex-col justify-center font-sans">
            <div className="text-center font-mono text-[8px] uppercase tracking-widest text-stone-400 mb-6 select-none">— Frontpage Preview Context —</div>
            {selectedEntry.contentType === 'Note' ? (
              (() => {
                const isAr = isArabicText(selectedEntry.content);
                return (
                  <div 
                    className={`bg-[#FAF8F5] border border-stone-200/50 p-6 rounded-lg shadow-md mx-auto max-w-xs relative overflow-hidden ${
                      isAr ? 'text-right' : 'text-left font-handwritten'
                    }`} 
                    style={{ fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' }}
                  >
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-1 select-none">Note</span>
                    <h4 className={`font-bold leading-tight mb-2 select-all text-stone-900 ${
                      isAr ? 'text-xl font-arabic-handwritten' : 'text-lg font-handwritten'
                    }`}>{selectedEntry.title}</h4>
                    <p className="text-sm line-clamp-3 leading-relaxed mb-3 select-all text-stone-850">{selectedEntry.content}</p>
                    <span className="text-[11px] text-stone-500">— {authorInfo.name}</span>
                  </div>
                );
              })()
            ) : selectedEntry.contentType === 'Essay' ? (
              <div className="bg-white border border-stone-200 p-6 rounded shadow-sm text-left font-serif text-[#111111] mx-auto max-w-sm">
                <span className="block font-mono text-[8px] uppercase tracking-widest text-[#802334] font-bold mb-2 select-none">Featured Essay</span>
                <h3 className="text-xl font-light mb-3 leading-tight hover:text-[#802334] transition select-all">{selectedEntry.title}</h3>
                <p className="text-stone-500 italic text-xs leading-relaxed line-clamp-3 mb-4 select-all">{selectedEntry.excerpt}</p>
                <span className="text-[11px] font-sans text-stone-400">By {authorInfo.name}</span>
              </div>
            ) : (
              <div className="bg-white border border-stone-250/70 p-5 rounded shadow-sm text-left mx-auto max-w-sm">
                <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-1 select-none">Article</span>
                <h4 className="font-serif text-base font-bold text-stone-900 leading-tight mb-2 line-clamp-2 select-all">{selectedEntry.title}</h4>
                <p className="font-serif text-stone-500 text-xs line-clamp-3 leading-relaxed mb-3 select-all">{selectedEntry.excerpt}</p>
                <span className="font-sans text-[11px] text-stone-400">By {authorInfo.name}</span>
              </div>
            )}
          </div>
        );

      case 'folio':
        return (
          <div className="max-w-xl mx-auto p-6 border border-stone-200 bg-white rounded shadow-sm text-left relative overflow-hidden font-sans">
            <div className="absolute top-0 right-0 p-3 bg-stone-50 border-l border-b border-stone-200 font-mono text-[8px] uppercase tracking-widest text-stone-400 select-none">
              Folio Feed Item
            </div>
            
            <div className="flex gap-4 items-start text-xs mt-4">
              {/* Year marker */}
              <div className="flex flex-col items-center">
                <span className="font-mono text-xs font-semibold text-[#802334] tracking-wider select-none">2026</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#802334] my-2 select-none" />
                <div className="w-px h-16 bg-stone-200 select-none" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-stone-405 select-none">
                  <span>{selectedEntry.contentType}</span>
                  <span>•</span>
                  <span>Published</span>
                </div>
                <h4 className="font-serif text-base font-semibold text-stone-900 leading-snug select-all">{selectedEntry.title}</h4>
                <p className="font-serif text-stone-550 leading-relaxed text-[13px] line-clamp-2 select-all">
                  {selectedEntry.excerpt || selectedEntry.content.substring(0, 150) + '...'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="max-w-2xl mx-auto p-5 border border-stone-200 bg-[#FDFDFD] rounded shadow-sm hover:border-[#802334]/30 transition text-left space-y-2 font-sans">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-stone-400 select-none">
              <span>Match Score: 98%</span>
              <span>Archived</span>
            </div>
            <h4 className="font-serif text-base font-semibold text-[#802334] hover:underline cursor-pointer select-all">{selectedEntry.title}</h4>
            <p className="font-sans text-stone-600 text-xs line-clamp-2 leading-relaxed select-all">
              ... {selectedEntry.content.substring(0, 150)} ...
            </p>
            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 select-none">
              <span>By {authorInfo.name}</span>
              <div className="flex gap-1.5">
                {selectedEntry.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-stone-100 border border-stone-200/50 rounded font-mono text-[9px]">#{t}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'publication':
      default:
        return (
          <div className="border border-stone-200 rounded p-6 bg-stone-50/50 shadow-inner">
             <EntryRenderer
              entry={selectedEntry}
              mode="view"
              preventScrollToTop={true}
              authorName={authorInfo.name}
              authorSignature={authorInfo.signature}
              authorSignatureFont={authorInfo.signatureFont}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Presentation Matrix Section */}
      <div className="bg-[#FDFDFD] border border-stone-200 rounded p-6 shadow-sm">
        <div className="border-b border-stone-100 pb-3 mb-4">
          <h4 className="font-serif text-base font-semibold text-stone-900">Adjung Presentation Matrix</h4>
          <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Canonical rendering contexts for each publication archetype</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs border border-stone-200 rounded">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[9px] uppercase tracking-wider text-stone-500">
                <th className="p-3 pl-4">Archetype</th>
                <th className="p-3">Writing Desk</th>
                <th className="p-3">Publication Page</th>
                <th className="p-3">Frontpage</th>
                <th className="p-3">Folio</th>
                <th className="p-3">Biography</th>
                <th className="p-3">Search Index</th>
                <th className="p-3">PDF/Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-700 font-sans text-xs">
              <tr className="hover:bg-stone-50/30 transition">
                <td className="p-3 pl-4 font-serif font-bold text-[#802334]">Note</td>
                <td className="p-3">Full Text Canvas</td>
                <td className="p-3">Index Card View</td>
                <td className="p-3">Compact Card</td>
                <td className="p-3">Compact Card</td>
                <td className="p-3">List Entry</td>
                <td className="p-3">Full Result</td>
                <td className="p-3 font-mono text-[10px] text-emerald-700">✓ Supported</td>
              </tr>
              <tr className="hover:bg-stone-50/30 transition">
                <td className="p-3 pl-4 font-serif font-bold text-[#802334]">Essay</td>
                <td className="p-3">Full Text Canvas</td>
                <td className="p-3">Book Layout (Footnotes)</td>
                <td className="p-3">Featured Card</td>
                <td className="p-3">Featured Card</td>
                <td className="p-3">List Entry</td>
                <td className="p-3">Full Result</td>
                <td className="p-3 font-mono text-[10px] text-emerald-700">✓ Supported</td>
              </tr>
              <tr className="hover:bg-stone-50/30 transition">
                <td className="p-3 pl-4 font-serif font-bold text-[#802334]">Article</td>
                <td className="p-3">Split Block Editor</td>
                <td className="p-3">Multi-Column (Margin Notes)</td>
                <td className="p-3">Standard Card</td>
                <td className="p-3">Grid Card</td>
                <td className="p-3">List Entry</td>
                <td className="p-3">Full Result</td>
                <td className="p-3 font-mono text-[10px] text-emerald-700">✓ Supported</td>
              </tr>
              <tr className="hover:bg-stone-50/30 transition">
                <td className="p-3 pl-4 font-serif font-bold text-stone-500">Notice</td>
                <td className="p-3">Rich Document Editor</td>
                <td className="p-3">Full Announcement Page</td>
                <td className="p-3">Banner Header</td>
                <td className="p-3 text-stone-400 font-mono text-[10px]">No</td>
                <td className="p-3 text-stone-400 font-mono text-[10px]">No</td>
                <td className="p-3">Short Result</td>
                <td className="p-3 font-mono text-[10px] text-stone-400">Unsupported</td>
              </tr>
              <tr className="hover:bg-stone-50/30 transition">
                <td className="p-3 pl-4 font-serif font-bold text-stone-500">Editor's Note</td>
                <td className="p-3">Rich Document Editor</td>
                <td className="p-3">Editorial Column View</td>
                <td className="p-3">Excerpt Highlight</td>
                <td className="p-3 text-stone-400 font-mono text-[10px]">No</td>
                <td className="p-3 text-stone-400 font-mono text-[10px]">No</td>
                <td className="p-3">Short Result</td>
                <td className="p-3 font-mono text-[10px] text-stone-400">Unsupported</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Select Archetype & Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Selector Panel */}
        <div className="lg:col-span-1 bg-[#FDFDFD] border border-stone-200 rounded p-4 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-2">
            <h5 className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold">Archetypes</h5>
          </div>

          <div className="flex flex-col gap-1">
            {canonicalEntries.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedEntryId(e.id)}
                className={`w-full text-left px-3 py-2.5 rounded font-serif text-sm transition flex items-center gap-2 select-none cursor-pointer ${
                  selectedEntryId === e.id
                    ? 'bg-[#802334]/10 text-[#802334] font-semibold border-l-4 border-[#802334]'
                    : 'text-stone-700 hover:bg-stone-50 border-l-4 border-transparent'
                }`}
              >
                {e.contentType === 'Note' && <FileText className="w-4 h-4 text-stone-455" />}
                {e.contentType === 'Essay' && <BookOpen className="w-4 h-4 text-stone-455" />}
                {e.contentType === 'Article' && <Layers className="w-4 h-4 text-stone-455" />}
                {e.title.replace('Canonical ', '')}
              </button>
            ))}
          </div>

          {selectedEntry && (
            <div className="pt-2 border-t border-stone-100 space-y-3 font-sans text-xs">
              <div>
                <span className="block font-mono text-[8px] uppercase tracking-widest text-stone-400">Mock Scope</span>
                <span className="font-medium text-stone-850 mt-1 block">{selectedEntry.contentType} Template</span>
              </div>
              <div>
                <span className="block font-mono text-[8px] uppercase tracking-widest text-stone-400">Tags Featured</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEntry.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-stone-100 border border-stone-200/50 rounded text-[9px] text-stone-500 font-mono">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-3 space-y-4">
           <div className="flex flex-col gap-4 border-b border-stone-200 pb-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif text-base font-semibold text-stone-900">Live Contextual Presentation</h4>
              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-250 rounded font-semibold select-none">
                <CheckCircle className="w-3 h-3" /> Standard Conformant
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* PRESENTATION CONTEXT SWITCHER TABS */}
              <div className="flex border border-stone-200/80 rounded bg-stone-50/50 p-1 font-mono text-[9px] uppercase tracking-wider select-none overflow-x-auto whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setPreviewContext('publication')}
                  className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${
                    previewContext === 'publication'
                      ? 'bg-[#802334] text-white font-semibold shadow-sm'
                      : 'text-stone-605 hover:text-stone-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> 📖 Publication Page
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewContext('editor')}
                  className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${
                    previewContext === 'editor'
                      ? 'bg-[#802334] text-white font-semibold shadow-sm'
                      : 'text-stone-605 hover:text-stone-800'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> 📝 Writing Desk (Editor)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewContext('frontpage')}
                  className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${
                    previewContext === 'frontpage'
                      ? 'bg-[#802334] text-white font-semibold shadow-sm'
                      : 'text-stone-605 hover:text-stone-800'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" /> 🏠 Frontpage Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewContext('folio')}
                  className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${
                    previewContext === 'folio'
                      ? 'bg-[#802334] text-white font-semibold shadow-sm'
                      : 'text-stone-605 hover:text-stone-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> 🗂️ Folio Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewContext('search')}
                  className={`px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer ${
                    previewContext === 'search'
                      ? 'bg-[#802334] text-white font-semibold shadow-sm'
                      : 'text-stone-605 hover:text-stone-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" /> 🔍 Search Result
                </button>
              </div>

              {/* LANGUAGE SWITCHER */}
              <div className="flex items-center gap-1.5 border border-stone-200/80 rounded bg-stone-50/50 p-1 font-mono text-[9px] uppercase tracking-wider select-none">
                <span className="text-stone-400 font-bold px-2">Language:</span>
                <button
                  type="button"
                  onClick={() => setLanguage('LTR')}
                  className={`px-3 py-1 rounded transition cursor-pointer font-semibold ${
                    language === 'LTR'
                      ? 'bg-stone-700 text-white shadow-sm'
                      : 'text-stone-605 hover:text-stone-850'
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('RTL')}
                  className={`px-3 py-1 rounded transition cursor-pointer font-semibold ${
                    language === 'RTL'
                      ? 'bg-stone-700 text-white shadow-sm'
                      : 'text-stone-605 hover:text-stone-850'
                  }`}
                >
                  العربية (RTL)
                </button>
              </div>
            </div>
          </div>

          {selectedEntry ? (
            <div className="animate-fade-in">
              {renderContextPreview()}
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 italic font-serif">
              Select a canonical template to view its live presentation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
