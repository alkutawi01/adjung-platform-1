import React from 'react';
import { Trash2 } from 'lucide-react';
import { 
  parseInlineFormatting, 
  getWordCount, 
  toRoman 
} from '../../utils';
import { Footnote } from '../../types';

interface FootnotesCitationsSectionProps {
  contentType: string;
  mode: 'view' | 'edit';
  marginNotesData: Record<string, string>;
  setMarginNotesData: (val: Record<string, string>) => void;
  deleteNote: (id: string, type: 'margin-note' | 'footnote') => void;
  footnotes: string[];
  footnotesData: Footnote[];
  activeSpec: {
    visibility: {
      showFootnotes: boolean;
      showCitations: boolean;
    };
  };
  orderedFootnotes: { originalId: string; displayNum: number; text: string }[];
  handleFootnoteChange: (id: string, text: string) => void;
  handleRemoveFootnote: (id: string) => void;
  citations: any[];
  referenceSortOrder: 'alphabetical' | 'appearance';
  marginNotesReadingOrder: { occurrences: string[]; map: Record<string, number> };
  citationsMap: Record<string, number>;
  footnotesReadingOrder: { occurrences: string[]; map: Record<string, number> };
  triggerSave: (...args: any[]) => void;
  content: string;
  status: string;
  visibility: string;
  tags: string[];
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string;
  revisions: any[];
}

export function FootnotesCitationsSection({
  contentType,
  mode,
  marginNotesData,
  setMarginNotesData,
  deleteNote,
  footnotes,
  footnotesData,
  activeSpec,
  orderedFootnotes,
  handleFootnoteChange,
  handleRemoveFootnote,
  citations,
  referenceSortOrder,
  marginNotesReadingOrder,
  citationsMap,
  footnotesReadingOrder,
  triggerSave,
  content,
  status,
  visibility,
  tags,
  slug,
  title,
  excerpt,
  featuredImage,
  revisions
}: FootnotesCitationsSectionProps) {

  return (
    <>
      {/* Margin Notes Fallback for Smaller Screens */}
      {contentType === 'Essay' && (
        <div className="lg:hidden mt-16 pt-8 border-t border-stone-300 font-sans text-stone-700 animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-100 select-none">
            <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-800">
              Scholarly Margin Notes
            </h3>
          </div>
          
          {(() => {
             const { occurrences, map: mMap } = marginNotesReadingOrder;
             const citeMap = citationsMap;
             const fMap = footnotesReadingOrder.map;
             if (occurrences.length === 0) {
               return (
                 <div className="text-stone-400 font-serif italic text-sm py-4 text-left">
                   No margin notes registered yet. Right-click inside text editor to insert margin notes.
                 </div>
               );
             }
             return (
               <div className="space-y-4">
                 {occurrences.map(id => (
                   <div key={id} className="bg-white border border-stone-100 p-4 rounded-md shadow-sm relative text-left">
                     <div className="absolute top-4 left-4 select-none">
                        <span className="font-sans text-[10px] font-medium align-super text-adjung-maroon">
                          ({toRoman(mMap[id]).toLowerCase()})
                        </span>
                      </div>
                     <div className="pl-14">
                       {mode === 'edit' ? (
                         <div>
                           <textarea
                             value={marginNotesData[id] || ''}
                             onChange={(e) => {
                               const val = e.target.value;
                               const updated = { ...marginNotesData, [id]: val };
                               setMarginNotesData(updated);
                               triggerSave(content, footnotes, marginNotesData, contentType, status, visibility, tags, slug, title, excerpt, featuredImage, revisions, citations, referenceSortOrder, updated);
                             }}
                             placeholder="Add margin note here..."
                             rows={2}
                             className="w-full bg-stone-50 border border-stone-200 focus:border-adjung-maroon rounded p-2 focus:outline-none text-xs font-serif text-stone-700 leading-relaxed"
                           />
                           <div className="mt-2 text-right">
                             <button 
                               type="button" 
                               onClick={() => deleteNote(id, 'margin-note')}
                               className="text-stone-400 hover:text-red-600 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                             >
                               Delete Note
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="font-serif text-sm leading-relaxed text-stone-600">
                           {parseInlineFormatting(marginNotesData[id] || '(Empty Note)', citations, referenceSortOrder, citeMap, fMap, undefined, undefined, mMap)}
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             );
          })()}
        </div>
      )}

      {/* Footnotes Section */}
      {activeSpec.visibility.showFootnotes && orderedFootnotes.length > 0 && (
        <div className="mt-16 pt-8 border-t border-stone-300 font-sans text-stone-700">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 select-none">
            <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-800">
              Scholarly Footnotes & Citations
            </h3>
            {mode === 'edit' && (
              <span className="text-[9px] font-mono text-stone-400">Total registered: {orderedFootnotes.length}</span>
            )}
          </div>

          {mode === 'edit' ? (
            <div className="space-y-4">
              {orderedFootnotes.map((item) => {
                return (
                  <div key={item.originalId} className="flex gap-3 items-start bg-stone-50/50 p-3 border border-stone-200/50 rounded-md hover:bg-white transition-all text-left">
                    <span className="font-mono text-xs text-adjung-maroon font-semibold w-5 mt-1.5 select-none">
                      [{item.displayNum}]
                    </span>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between select-none">
                        <span className="text-[8px] font-mono uppercase text-stone-400">Footnote Text (Internal ID: [^{item.originalId}])</span>
                        <span className={getWordCount(item.text) > 1000 ? "text-red-600 font-semibold font-mono text-[9px]" : "text-stone-400 font-mono text-[9px]"}>
                          {getWordCount(item.text)}/1000 words
                        </span>
                      </div>
                      <textarea
                        value={item.text}
                        onChange={(e) => {
                          handleFootnoteChange(item.originalId, e.target.value);
                        }}
                        rows={2}
                        className="w-full bg-white border border-stone-200 p-2 rounded text-xs focus:outline-none focus:border-adjung-maroon resize-y font-serif text-stone-700 leading-relaxed"
                        placeholder={`Enter footnote ${item.displayNum} text content...`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFootnote(item.originalId)}
                      className="text-stone-300 hover:text-red-700 p-1 rounded mt-1 select-none cursor-pointer"
                      title="Remove Footnote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <ol className="space-y-3 font-serif text-[12.5px] leading-relaxed list-none pl-0 text-left">
              {orderedFootnotes.map((item, idx) => {
                const fMap = footnotesReadingOrder.map;
                const citeMap = citationsMap;
                return (
                  <li 
                    key={idx} 
                    id={item.originalId.startsWith('fn-') ? `footnote-dest-${item.originalId}` : `footnote-dest-legacy-${item.originalId}`} 
                    className="group flex gap-3 hover:bg-stone-50 p-1.5 rounded transition scroll-mt-24 duration-700"
                  >
                    <span 
                      className="font-sans text-[10px] font-medium align-super text-adjung-maroon w-4 flex-shrink-0 select-none cursor-pointer hover:underline hover:text-adjung-maroon/80 text-left"
                      title="Go back to citation"
                      onClick={() => {
                        const refId = item.originalId.startsWith('fn-') ? `fnref-${item.originalId}` : `fnref-legacy-${item.originalId}`;
                        const refEl = document.getElementById(refId);
                        if (refEl) {
                          refEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          refEl.classList.remove('citation-flash');
                          void refEl.offsetWidth; // Trigger reflow
                          refEl.classList.add('citation-flash');
                          setTimeout(() => refEl.classList.remove('citation-flash'), 2500);
                        }
                      }}
                    >
                      ({item.displayNum})
                    </span>
                    
                    <div className="flex-grow text-left text-stone-700">
                      {parseInlineFormatting(item.text, citations, referenceSortOrder, citeMap, fMap)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* References & Bibliography */}
      {activeSpec.visibility.showCitations && citations.length > 0 && (
        <div className="mt-16 pt-8 border-t border-stone-300 font-sans text-stone-700">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100 text-left">
            <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-stone-800">
              References & Bibliography
            </h3>
            <span className="font-mono text-[9px] text-stone-400 uppercase select-none">
              Sorted by {referenceSortOrder === 'alphabetical' ? 'Author' : 'Appearance'}
            </span>
          </div>

          <ul className="space-y-3 font-serif text-[12.5px] leading-relaxed list-none pl-0 text-left">
            {(() => {
              const citeMap = citationsMap;
              const sorted = [...citations].sort((a, b) => {
                if (referenceSortOrder === 'alphabetical') {
                  return a.author.localeCompare(b.author);
                } else {
                  const aIdx = citeMap[a.id] || 9999;
                  const bIdx = citeMap[b.id] || 9999;
                  return aIdx - bIdx;
                }
              });

              return sorted.map((cit, idx) => {
                const displayIdx = citeMap[cit.id] || idx + 1;
                return (
                  <li 
                    key={cit.id} 
                    id={`reference-${cit.id}`}
                    className="text-stone-700 text-left hover:bg-stone-50/50 p-1.5 rounded transition flex items-baseline gap-2"
                  >
                    <span className="font-mono text-xs text-adjung-maroon font-medium select-none">
                      {referenceSortOrder === 'appearance' ? `[${displayIdx}]` : '•'}
                    </span>
                    <div className="flex-grow">
                      <strong className="font-sans font-semibold text-stone-900">{cit.author}</strong> ({cit.year}). 
                      <span> "{cit.title}."</span> <em>{cit.publisher}</em>.
                      {cit.url && (
                        <a href={cit.url} target="_blank" rel="noopener noreferrer" className="text-adjung-maroon hover:underline ml-1.5 font-mono text-[10px] break-all">
                          [Link]
                        </a>
                      )}
                      {cit.doi && (
                        <span className="text-stone-400 ml-1.5 font-mono text-[10px]">
                          doi:{cit.doi}
                        </span>
                      )}
                    </div>
                  </li>
                );
              });
            })()}
          </ul>
        </div>
      )}
    </>
  );
}
