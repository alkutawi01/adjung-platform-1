import React, { useState, useEffect } from 'react';
import { Entry, User, IdentityProfile } from '../../types';
import { WritingDesk } from '../desk/WritingDesk';
import { EntryRenderer } from '../rendering/EntryRenderer';
import { TimelineEntryCollapseRenderer } from '../rendering/TimelineEntryCollapseRenderer';
import { getPresentationSpec, PresentationSpec } from '../../presentation';
import { isArabicText, parseInlineFormatting, flattenBlocksForPreview, truncateAtWord } from '../../utils';
import { 
  BookOpen, FileText, Layers, CheckCircle, Monitor, Layout, 
  Calendar, Search, RefreshCw, Copy, ShieldAlert, Award, FileCode,
  Undo2, UserCheck, AlertCircle, FlaskConical, Check, ChevronDown, ChevronUp
} from 'lucide-react';

interface ReferenceLibraryProps {
  entries: Entry[];
  users: User[];
}

type ContextType = 'publication' | 'frontpage' | 'folio' | 'search' | 'archive';

interface ContextVariant {
  id: string;
  name: string;
}

interface PublicationContext {
  id: ContextType;
  name: string;
  variants: ContextVariant[];
}

const PUBLICATION_CONTEXTS: PublicationContext[] = [
  {
    id: 'publication',
    name: 'Publication Page',
    variants: [
      { id: 'standard', name: 'Standard Canvas Layout' }
    ]
  },
  {
    id: 'frontpage',
    name: 'Frontpage',
    variants: [
      { id: 'standard', name: 'Standard Card' },
      { id: 'featured', name: 'Featured Card (Future)' },
      { id: 'hero', name: 'Hero Layout (Future)' }
    ]
  },
  {
    id: 'folio',
    name: 'Folio',
    variants: [
      { id: 'timeline', name: 'Timeline Item' },
      { id: 'card', name: 'Card (Future)' }
    ]
  },
  {
    id: 'search',
    name: 'Search',
    variants: [
      { id: 'standard', name: 'Search Result' }
    ]
  },
  {
    id: 'archive',
    name: 'Archive',
    variants: [
      { id: 'row', name: 'Archive Row' }
    ]
  }
];

export function ReferenceLibrary({ entries, users }: ReferenceLibraryProps) {
  // 1. Template & Sandbox state
  const canonicalTemplates = entries.filter(e => e.id.startsWith('entry-canonical-') && !e.id.endsWith('-ar'));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(canonicalTemplates[0]?.id || '');
  const [language, setLanguage] = useState<'LTR' | 'RTL'>('LTR');

  const [tempEntry, setTempEntry] = useState<Entry | null>(null);
  const [originalEntry, setOriginalEntry] = useState<Entry | null>(null);

  // 2. Author/Identity customization state
  const [authorName, setAuthorName] = useState('Zayd Al-Ghazali');
  const [authorSignature, setAuthorSignature] = useState('Zayd Al-Ghazali');
  const [authorSignatureFont, setAuthorSignatureFont] = useState('Mrs Saint Delafield');
  const [authorBiography, setAuthorBiography] = useState(
    'Preservation begins when a work is expected to outlive its author. In the scholastic tradition, the text occupies a sacred geography.'
  );

  // 3. Selection of Active Context and Variant
  const [selectedContextId, setSelectedContextId] = useState<ContextType>('publication');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('standard');

  // Accordion status in the top metadata grid
  const [openSection, setOpenSection] = useState<'pub' | 'author' | 'metadata' | 'editorial' | null>(null);

  // Auto-sync variant when context changes
  useEffect(() => {
    const ctx = PUBLICATION_CONTEXTS.find(c => c.id === selectedContextId);
    if (ctx && ctx.variants.length > 0) {
      const hasVariant = ctx.variants.some(v => v.id === selectedVariantId);
      if (!hasVariant) {
        setSelectedVariantId(ctx.variants[0].id);
      }
    }
  }, [selectedContextId, selectedVariantId]);

  // Sync sandbox with canonical archetypes or language changes
  useEffect(() => {
    const template = entries.find(e => e.id === selectedTemplateId);
    if (template) {
      const overrideObj = language === 'RTL' ? {
        content: template.id === 'entry-canonical-note' 
          ? 'هذه هي الملاحظة المعيارية المكتوبة بخط الرقعة العربي التقليدي. تُعرض الملاحظات دائمًا بدون عناوين ضخمة، لتوفير تجربة قراءة حميمية ومريحة للباحث الكلاسيكي.'
          : template.id === 'entry-canonical-essay'
          ? 'إن فن الطباعة وهندسة الحروف ليس مجرد اختيار أشكال الحروف، بل هو تهيئة الفراغ البصري المحيط بالنص [^1]. في التقاليد العلمية الكلاسيكية، يحتل النص مساحة مقدسة على الصفحة.'
          : 'تقدم هذه المقالة نموذج تخطيط الصحافة الرقمية، وهو نظام تصميم متين تم هندسته لتوفير تجارب قراءة عالية الأداء. يعتمد النظام على شبكات CSS لتحقيق محاذاة دقيقة عبر مختلف أبعاد الشاشات.',
        title: template.id === 'entry-canonical-note'
          ? 'الملاحظة النموذجية (الترميز العربي)'
          : template.id === 'entry-canonical-essay'
          ? 'المقالة النموذجية: فن الطباعة الأكاديمية التقليدية'
          : 'المقالة النموذجية: نموذج تخطيط الصحافة الرقمية',
        tags: ['نموذجي', 'عربي']
      } : {};

      const mergedEntry: Entry = {
        ...template,
        ...overrideObj,
        publishedDate: template.publishedDate || new Date().toISOString()
      };

      setTempEntry(mergedEntry);
      setOriginalEntry(JSON.parse(JSON.stringify(mergedEntry)));
    }
  }, [selectedTemplateId, language, entries]);

  if (!tempEntry) {
    return <div className="p-8 text-center text-stone-500 font-sans">Initializing Sandbox Environment...</div>;
  }

  const activeSpec = getPresentationSpec(tempEntry.contentType);

  const updateTempEntry = (fields: Partial<Entry>) => {
    setTempEntry(prev => prev ? { ...prev, ...fields } : null);
  };

  const handleReset = () => {
    if (originalEntry) {
      setTempEntry(JSON.parse(JSON.stringify(originalEntry)));
    }
  };

  const handleClone = () => {
    if (tempEntry) {
      const cloned: Entry = {
        ...tempEntry,
        id: `sandbox-${Math.random().toString(36).substr(2, 9)}`,
        title: `${tempEntry.title} (Clone)`,
        slug: `${tempEntry.slug}-clone`
      };
      setTempEntry(cloned);
    }
  };

  // Live Diagnostics Rule Engine
  const getDiagnostics = () => {
    const list: { type: 'success' | 'warning' | 'error' | 'info'; msg: string; spec: string }[] = [];
    const isNote = tempEntry.contentType === 'Note';

    if (isNote) {
      if (tempEntry.title) {
        list.push({
          type: 'info',
          msg: `Title "${tempEntry.title}" is defined for indexing but hidden on the Publication Page canvas.`,
          spec: 'SPEC-007 (Note Layout)'
        });
      }
      if (tempEntry.subtitle) {
        list.push({
          type: 'warning',
          msg: `Subtitle "${tempEntry.subtitle}" is populated but ignored in Note layouts.`,
          spec: 'SPEC-017 (Metadata Policy)'
        });
      }
      if (tempEntry.excerpt) {
        list.push({
          type: 'warning',
          msg: `Abstract/Excerpt is populated but ignored in Note layouts.`,
          spec: 'SPEC-017 (Metadata Policy)'
        });
      }
      if (tempEntry.featuredImage) {
        list.push({
          type: 'warning',
          msg: 'Cover Image is populated but ignored in Note layouts.',
          spec: 'SPEC-017 (Metadata Policy)'
        });
      }
    } else {
      if (!tempEntry.title) {
        list.push({
          type: 'error',
          msg: `${tempEntry.contentType} requires a title for indexing.`,
          spec: 'SPEC-017 (Core Metadata)'
        });
      }
    }

    const slugRegex = /^[a-z0-9-_]+$/;
    if (tempEntry.slug && !slugRegex.test(tempEntry.slug)) {
      list.push({
        type: 'error',
        msg: `Slug "${tempEntry.slug}" contains invalid characters. Use lowercase alphanumeric and hyphens.`,
        spec: 'SPEC-005 (URL Routing)'
      });
    }

    if (!tempEntry.tags || tempEntry.tags.length === 0) {
      list.push({
        type: 'warning',
        msg: 'No tags provided. Discovery in the directory may fail.',
        spec: 'SPEC-012 (Index)'
      });
    }

    if (list.length === 0) {
      list.push({
        type: 'success',
        msg: 'All metadata properties are 100% compliant with Adjung presentation rules.',
        spec: 'SPEC-007 / SPEC-017'
      });
    }

    return list;
  };

  const renderSelectedContext = () => {
    switch (selectedContextId) {
      case 'publication':
        return (
          <div className="bg-stone-50/40 border border-stone-200/60 rounded-md p-6 md:p-8">
            <div className="max-w-4xl mx-auto shadow-sm">
              <EntryRenderer
                entry={tempEntry}
                mode="view"
                preventScrollToTop={true}
                authorName={authorName}
                authorSignature={authorSignature}
                authorSignatureFont={authorSignatureFont}
                presentationSpec={activeSpec}
              />
            </div>
          </div>
        );

      case 'frontpage':
        const isAr = isArabicText(tempEntry.content);
        const isHero = selectedVariantId === 'hero';
        const isFeatured = selectedVariantId === 'featured';

        if (isHero) {
          const showHeroTitle = tempEntry.contentType !== 'Note';
          const isNote = tempEntry.contentType === 'Note';
          return (
            <div className="bg-[#FDFBF7] p-8 md:p-12 rounded-md max-w-5xl mx-auto flex flex-col justify-between min-h-[300px] shadow-md relative overflow-hidden border border-stone-200 text-left animate-fade-in">
              <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-adjung-maroon tracking-widest uppercase font-bold select-none">
                Hero Publication Feature
              </div>
              <div className="space-y-4 max-w-2xl">
                <span className="bg-adjung-maroon text-white font-mono text-[8px] tracking-widest px-2.5 py-0.5 uppercase font-bold rounded">
                  {tempEntry.contentType}
                </span>
                {showHeroTitle && (
                  <h2 className="text-3xl md:text-4xl font-sans font-light text-stone-900 leading-tight">
                    {tempEntry.title || 'Untitled Sandbox Entry'}
                  </h2>
                )}
                {showHeroTitle && tempEntry.subtitle && (
                  <p className="text-stone-400 text-sm font-sans italic">{tempEntry.subtitle}</p>
                )}
                <div className={`text-stone-700 leading-relaxed font-sans ${isNote ? 'text-[15.5px] md:text-[16.5px]' : 'text-sm'} line-clamp-4`}>
                  {parseInlineFormatting(tempEntry.excerpt || tempEntry.content)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-500 font-sans border-t border-stone-200 pt-4 mt-6">
                <span>By <strong className="text-stone-800">{authorName}</strong></span>
                <span>•</span>
                <span>{new Date(tempEntry.publishedDate).toLocaleDateString()}</span>
              </div>
            </div>
          );
        }

        if (isFeatured) {
          return (
            <div className="bg-[#FAF8F5] border-y-2 border-adjung-maroon p-8 rounded-sm max-w-3xl mx-auto shadow-md text-left flex flex-col md:flex-row gap-6 items-start">
              {tempEntry.featuredImage && (
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <img src={tempEntry.featuredImage} className="w-full h-32 object-cover rounded-sm border border-stone-200/90" alt="" />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <span className="font-mono text-[8px] uppercase tracking-widest text-adjung-maroon font-bold">Featured {tempEntry.contentType}</span>
                {tempEntry.contentType !== 'Note' && (
                  <h3 className="font-sans text-xl font-bold text-stone-900 leading-tight">
                    {tempEntry.title || 'Untitled Featured Archetype'}
                  </h3>
                )}
                <div className="font-sans text-stone-700 text-xs leading-relaxed line-clamp-3">
                  {parseInlineFormatting(tempEntry.excerpt || truncateAtWord(flattenBlocksForPreview(tempEntry.content), 27))}
                </div>
                <div className="text-[10px] text-stone-500 font-sans pt-1 border-t border-stone-200/20">
                  By {authorName} • {new Date(tempEntry.publishedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        }

        // Default: Standard card representation
        return (
          <div className="max-w-md mx-auto p-5 rounded border bg-white border-stone-200/60 shadow-sm text-left">
            <span className="block font-mono text-[9px] uppercase tracking-wider text-adjung-maroon mb-2">{tempEntry.contentType}</span>
            {activeSpec.visibility.showTitle && tempEntry.title && (
              <h4 
                dir={isAr ? 'rtl' : 'ltr'}
                className="text-stone-900 leading-tight mb-2 font-sans text-base font-bold"
              >
                {tempEntry.title}
              </h4>
            )}
            <div 
              dir={isAr ? 'rtl' : 'ltr'}
              className={`text-stone-700 leading-relaxed mb-4 line-clamp-3 ${
                tempEntry.contentType === 'Note'
                  ? (isAr ? 'font-arabic text-base md:text-lg leading-loose text-right' : 'font-sans text-sm md:text-base')
                  : (isAr ? 'font-arabic text-xs leading-loose' : 'font-sans text-xs')
              }`}
            >
              {parseInlineFormatting(tempEntry.excerpt || truncateAtWord(flattenBlocksForPreview(tempEntry.content), 25))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-sans border-t border-stone-100 pt-2">
              <span>By {authorName}</span>
              <span>{new Date(tempEntry.publishedDate).toLocaleDateString()}</span>
            </div>
          </div>
        );

      case 'folio':
        return (
          <div className="max-w-2xl mx-auto p-6 bg-stone-50 border border-stone-200/60 rounded">
            <div className="relative border-l border-stone-200 pl-4 py-2 text-left">
              <span className="absolute left-0 w-2.5 h-2.5 rounded-full bg-adjung-maroon -ml-[5.5px] mt-1.5" />
              <div className="font-mono text-[9px] text-stone-400 uppercase tracking-widest mb-1.5">
                {new Date(tempEntry.publishedDate).getFullYear()} • {tempEntry.contentType}
              </div>
              <TimelineEntryCollapseRenderer
                item={tempEntry}
                isExpanded={true}
                onToggle={() => {}}
                presentationSpec={activeSpec}
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="max-w-3xl mx-auto p-6 bg-white border border-stone-200 rounded text-left space-y-2 font-sans shadow-sm">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-400 select-none">
              <span>Match Score: 98%</span>
              <span>INDEXED</span>
            </div>
            <h4 className="font-sans text-base font-semibold text-adjung-maroon hover:underline cursor-pointer">
              {tempEntry.title || 'Untitled Sandbox Entry'}
            </h4>
            <p className="font-sans text-stone-600 text-xs line-clamp-2 leading-relaxed">
              ... {truncateAtWord(flattenBlocksForPreview(tempEntry.content), 25)} ...
            </p>
            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-2 border-t border-stone-100/60">
              <span>By {authorName}</span>
              <div className="flex gap-1.5">
                {tempEntry.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-stone-100 border border-stone-200/60 rounded font-mono text-[9px]">#{t}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'archive':
        const cleanContent = flattenBlocksForPreview(tempEntry.content);
        const firstPara = cleanContent.split(/\n+/)[0] || '';
        const sentenceMatch = firstPara.match(/^[^.!?]+[.!?]/);
        const archiveRowText = tempEntry.contentType === 'Note'
          ? (sentenceMatch ? sentenceMatch[0] : truncateAtWord(firstPara, 17))
          : tempEntry.title;

        return (
          <div className="max-w-4xl mx-auto p-4 bg-white border border-stone-200/60 rounded font-sans text-xs flex items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="bg-adjung-maroon/5 text-adjung-maroon font-mono text-[9px] font-bold px-2 py-0.5 border border-adjung-maroon/20 rounded uppercase">
                {tempEntry.contentType}
              </span>
              <div 
                dir={isArabicText(archiveRowText) ? 'rtl' : 'ltr'}
                className={`text-left ${isArabicText(archiveRowText) ? 'text-right' : ''}`}
              >
                <div className="font-sans font-bold text-stone-900 text-sm">
                  {archiveRowText || '(Untitled Note)'}
                </div>
                {tempEntry.contentType !== 'Note' && (
                  <div className="font-mono text-[9px] text-stone-400">Slug: {tempEntry.slug}</div>
                )}
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-stone-400">
              Published: {new Date(tempEntry.publishedDate).toLocaleDateString()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Universal Laboratory Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/90 pb-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light text-stone-950 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-adjung-maroon" />
            Universal Rendering Laboratory
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-stone-400">
            Authoritative, specification-first presentation workspace operating on in-memory sandbox data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200/90 border border-stone-200/60 text-stone-700 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 transition rounded cursor-pointer font-semibold shadow-sm"
          >
            <Undo2 className="w-3.5 h-3.5" /> Reset Template
          </button>
          <button
            type="button"
            onClick={handleClone}
            className="px-3 py-1.5 bg-adjung-maroon hover:bg-[#6c1d2c] text-white font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 transition rounded cursor-pointer font-semibold shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" /> Clone Sandbox
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: CANONICAL LIBRARY & METADATA WORKSPACE (TOP PANEL) ================= */}
      <div className="bg-[#FAF9F6] border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left card: Canonical Archetype Selector & Language toggle */}
          <div className="md:col-span-4 bg-white border border-stone-200 rounded p-4 shadow-sm space-y-3">
            <h5 className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold border-b border-stone-100 pb-1.5 flex items-center gap-1 select-none">
              <Award className="w-3.5 h-3.5" /> Canonical Library
            </h5>
            
            <div className="flex flex-col gap-1.5">
              {canonicalTemplates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`w-full text-left px-3 py-2 rounded font-sans text-sm transition flex items-center gap-2 select-none cursor-pointer ${
                    selectedTemplateId === t.id
                      ? 'bg-adjung-maroon/10 text-adjung-maroon font-semibold border-l-2 border-adjung-maroon'
                      : 'text-stone-700 hover:bg-stone-50 border-l-2 border-transparent'
                  }`}
                >
                  {t.contentType === 'Note' && <FileText className="w-4 h-4 text-stone-400" />}
                  {t.contentType === 'Essay' && <BookOpen className="w-4 h-4 text-stone-400" />}
                  {t.title.replace('Canonical ', '')}
                </button>
              ))}
            </div>

            <div className="flex border border-stone-200/90 rounded bg-stone-50/60 p-0.5 font-mono text-[8px] uppercase tracking-wider select-none mt-2">
              <button
                type="button"
                onClick={() => setLanguage('LTR')}
                className={`flex-1 py-1 rounded transition cursor-pointer font-semibold ${
                  language === 'LTR' ? 'bg-adjung-maroon text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                English LTR
              </button>
              <button
                type="button"
                onClick={() => setLanguage('RTL')}
                className={`flex-1 py-1 rounded transition cursor-pointer font-semibold ${
                  language === 'RTL' ? 'bg-adjung-maroon text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                العربية RTL
              </button>
            </div>
          </div>

          {/* Right card: Metadata configuration accordions */}
          <div className="md:col-span-8 bg-white border border-stone-200 rounded shadow-sm divide-y divide-stone-200 font-sans text-xs">
            {/* 1. Publication Context */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'pub' ? null : 'pub')}
                className="w-full flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold select-none cursor-pointer"
              >
                <span>1. Publication Context</span>
                {openSection === 'pub' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              
              {openSection === 'pub' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Content Type</label>
                    <select
                      value={tempEntry.contentType}
                      onChange={(e) => updateTempEntry({ contentType: e.target.value as any })}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                    >
                      <option value="Note">Note</option>
                      <option value="Essay">Essay</option>
                      <option value="Notice">Notice</option>
                      <option value="Editor's Note">Editor's Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Status</label>
                    <select
                      value={tempEntry.status}
                      onChange={(e) => updateTempEntry({ status: e.target.value as any })}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Visibility</label>
                    <select
                      value={tempEntry.visibility}
                      onChange={(e) => updateTempEntry({ visibility: e.target.value as any })}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Author Identity */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'author' ? null : 'author')}
                className="w-full flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold select-none cursor-pointer"
              >
                <span>2. Author Identity</span>
                {openSection === 'author' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {openSection === 'author' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Real & Full Name</label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Signature Scribble</label>
                      <input
                        type="text"
                        value={authorSignature}
                        onChange={(e) => setAuthorSignature(e.target.value)}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-adjung-maroon font-signature text-xl focus:outline-none focus:border-adjung-maroon"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Signature Font</label>
                      <select
                        value={authorSignatureFont}
                        onChange={(e) => setAuthorSignatureFont(e.target.value)}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                      >
                        <option value="Mrs Saint Delafield">Mrs Saint Delafield</option>
                        <option value="Alex Brush">Alex Brush</option>
                        <option value="Monsieur La Doulaise">Monsieur La Doulaise</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Biography Context</label>
                    <textarea
                      value={authorBiography}
                      onChange={(e) => setAuthorBiography(e.target.value)}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon h-28 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Publication Metadata */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'metadata' ? null : 'metadata')}
                className="w-full flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold select-none cursor-pointer"
              >
                <span>3. Publication Metadata</span>
                {openSection === 'metadata' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {openSection === 'metadata' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Title</label>
                      <input
                        type="text"
                        value={tempEntry.title}
                        onChange={(e) => updateTempEntry({ title: e.target.value })}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={tempEntry.subtitle || ''}
                        onChange={(e) => updateTempEntry({ subtitle: e.target.value })}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Slug</label>
                      <input
                        type="text"
                        value={tempEntry.slug}
                        onChange={(e) => updateTempEntry({ slug: e.target.value })}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 font-mono text-[11px] focus:outline-none focus:border-adjung-maroon"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Tags (Comma Sep)</label>
                      <input
                        type="text"
                        value={tempEntry.tags.join(', ')}
                        onChange={(e) => updateTempEntry({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Editorial Settings */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'editorial' ? null : 'editorial')}
                className="w-full flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold select-none cursor-pointer"
              >
                <span>4. Editorial Settings</span>
                {openSection === 'editorial' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {openSection === 'editorial' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Access Policy Class</label>
                    <select
                      value={tempEntry.publicationClass || 'Personal'}
                      onChange={(e) => updateTempEntry({ publicationClass: e.target.value as any })}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                    >
                      <option value="Personal">Personal (Scholar Folio)</option>
                      <option value="Institutional">Institutional (Editorial Board)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] text-stone-400 uppercase font-semibold mb-1">Under Review</label>
                    <select
                      value={tempEntry.underReview ? 'yes' : 'no'}
                      onChange={(e) => updateTempEntry({ underReview: e.target.value === 'yes' })}
                      className="w-full border border-stone-200 p-1.5 rounded bg-white text-stone-800 focus:outline-none focus:border-adjung-maroon"
                    >
                      <option value="no">Active / Normal</option>
                      <option value="yes">Flagged / Under Review</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: PRODUCTION WRITING DESK (LARGE) ================= */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <div className="border-b border-stone-100 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h4 className="font-serif text-lg font-semibold text-stone-900">Authoring Workspace</h4>
            <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Instantiating production WritingDesk in sandbox isolation</p>
          </div>
          <span className="bg-adjung-maroon/5 text-adjung-maroon font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 border border-adjung-maroon/30 rounded select-none font-bold">
            Interactive Editor
          </span>
        </div>

        <div className="w-full max-w-full">
          <WritingDesk 
            mode="laboratory" 
            entry={tempEntry} 
            onSave={(updated) => setTempEntry(updated)}
            viewModeOverride="editor"
            authorName={authorName}
            authorSignature={authorSignature}
            authorSignatureFont={authorSignatureFont}
          />
        </div>
      </div>

      {/* ================= SECTION 3: LIVE CONTEXT VIEWPORTS ================= */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
        <div className="border-b border-stone-100 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-serif text-lg font-semibold text-stone-900">Live Context Viewports</h4>
            <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400">Production rendering adapters for actual publication contexts</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            {PUBLICATION_CONTEXTS.map(ctx => (
              <button
                key={ctx.id}
                type="button"
                onClick={() => setSelectedContextId(ctx.id)}
                className={`px-3 py-1.5 rounded uppercase tracking-wider font-semibold border transition cursor-pointer ${
                  selectedContextId === ctx.id
                    ? 'bg-adjung-maroon text-white border-adjung-maroon shadow-sm'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-adjung-maroon hover:bg-stone-100/60'
                }`}
              >
                {ctx.name}
              </button>
            ))}
          </div>
        </div>

        {/* Variant Selector Bar (If context has multiple variants) */}
        {(() => {
          const currentCtx = PUBLICATION_CONTEXTS.find(c => c.id === selectedContextId);
          if (currentCtx && currentCtx.variants.length > 1) {
            return (
              <div className="flex items-center gap-2 mb-4 p-2 bg-stone-50 border border-stone-200/60 rounded font-sans text-xs">
                <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest pl-1">Presentation Variant:</span>
                {currentCtx.variants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                      selectedVariantId === v.id
                        ? 'bg-stone-700 text-white font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            );
          }
          return null;
        })()}

        {/* Live Viewport Output Grid Container */}
        <div className="w-full relative mt-4">
          {renderSelectedContext()}
        </div>
      </div>

      {/* ================= SECTION 4: RENDERING DIAGNOSTICS ================= */}
      <div className="bg-[#FAF8F5] border border-stone-200/90 rounded-lg p-5 shadow-sm text-left">
        <h5 className="font-mono text-[10px] uppercase tracking-wider text-adjung-maroon font-bold border-b border-stone-200 pb-1.5 mb-3 flex items-center gap-1 select-none">
          <ShieldAlert className="w-3.5 h-3.5" /> Rendering Diagnostics
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getDiagnostics().map((d, dIdx) => (
            <div key={dIdx} className="flex gap-2.5 items-start text-xs leading-relaxed animate-fade-in font-sans p-2.5 bg-white border border-stone-200/60 rounded">
              {d.type === 'success' && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
              {d.type === 'info' && <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
              {d.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
              {d.type === 'error' && <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
              <div>
                <div className="font-semibold text-stone-800 flex items-center gap-1.5 select-none">
                  {d.type.toUpperCase()}
                  <span className="text-[9px] font-mono text-stone-400 bg-stone-100 border border-stone-200/60 px-1 rounded">
                    {d.spec}
                  </span>
                </div>
                <div className="text-stone-600 text-[11px] mt-0.5">{d.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
