import React, { useState, useLayoutEffect, useRef } from 'react';
import { Entry } from '../types';
import { parseContentToBlocks, isArabicText, parseInlineFormatting, getFootnotesReadingOrderMap, getMarginNotesReadingOrderMap } from '../utils';

interface TimelineEntryCollapseRendererProps {
  item: Entry;
  isExpanded: boolean;
  onToggle: () => void;
  maxHeight?: number;
  onOpenText?: () => void;
}

export function TimelineEntryCollapseRenderer({
  item,
  isExpanded,
  onToggle,
  maxHeight = 220,
  onOpenText,
}: TimelineEntryCollapseRendererProps) {
  const [visibleCount, setVisibleCount] = useState<number>(9999);
  const [exceedsLimit, setExceedsLimit] = useState<boolean>(false);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);

  const contentBlocks = parseContentToBlocks(item.content);
  const fMap = getFootnotesReadingOrderMap(item.content).map;
  const mMap = getMarginNotesReadingOrderMap(item.content).map;

  useLayoutEffect(() => {
    const measureContainer = measureContainerRef.current;
    if (!measureContainer) return;

    const children = measureContainer.children;
    if (children.length === 0) return;

    const containerRect = measureContainer.getBoundingClientRect();
    const containerTop = containerRect.top;

    let limitIdx = contentBlocks.length;
    let exceeded = false;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childBottom = child.getBoundingClientRect().bottom - containerTop;

      if (childBottom > maxHeight) {
        // Move collapse point to the end of the previous block
        limitIdx = Math.max(1, i);
        exceeded = true;
        break;
      }
    }

    setVisibleCount(limitIdx);
    setExceedsLimit(exceeded);
  }, [item.content, maxHeight, contentBlocks.length]);

  const renderSingleBlock = (block: any, pIdx: number) => {
    const isNote = item.contentType === 'Note';
    if (block.type === 'heading') {
      const isAr = isArabicText(block.text);
      const textNode = parseInlineFormatting(block.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap);
      if (block.level === 1) {
        return (
          <h3 
            key={pIdx} 
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`text-stone-900 font-semibold my-2.5 ${
              isAr 
                ? (isNote ? 'font-arabic-handwritten text-right text-[15px] leading-loose' : 'font-arabic text-right text-[15px] leading-loose') 
                : (isNote ? 'font-handwritten text-left text-[16px] md:text-[18px]' : 'font-serif text-left text-[14px] tracking-tight')
            }`}
            style={isNote ? { fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } : undefined}
          >
            {textNode}
          </h3>
        );
      } else {
        return (
          <h4 
            key={pIdx} 
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`text-stone-850 font-medium my-2 ${
              isAr 
                ? (isNote ? 'font-arabic-handwritten text-right text-[13px] leading-loose' : 'font-arabic text-right text-[13px] leading-loose') 
                : (isNote ? 'font-handwritten text-left text-[14px] md:text-[16px]' : 'font-serif text-left text-[12px]')
            }`}
            style={isNote ? { fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } : undefined}
          >
            {textNode}
          </h4>
        );
      }
    }

    if (block.type === 'list') {
      const listItems = block.items.slice(0, 3).map((listItem: any, itemIdx: number) => {
        const isAr = isArabicText(listItem.text);
        const isChecklist = listItem.checked !== undefined;
        const textNode = parseInlineFormatting(listItem.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap);
        if (isChecklist) {
          return (
            <li 
              key={itemIdx} 
              className={`flex items-center gap-1.5 ${isAr ? 'justify-start flex-row-reverse text-right' : 'text-left'}`}
            >
              <input type="checkbox" checked={listItem.checked} disabled className="h-3 w-3 rounded text-Adjung-maroon cursor-default" />
              <span 
                className={`${listItem.checked ? 'line-through text-stone-400' : 'text-stone-600'} ${
                  isAr 
                    ? (isNote ? 'font-arabic-handwritten text-sm leading-loose' : 'font-arabic') 
                    : (isNote ? 'font-handwritten text-sm font-semibold' : 'font-serif')
                }`}
                style={isNote ? { fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } : undefined}
              >
                {textNode}
              </span>
            </li>
          );
        }
        return (
          <li 
            key={itemIdx} 
            className={`text-stone-650 ${
              isAr 
                ? (isNote ? 'font-arabic-handwritten text-right text-sm leading-loose' : 'font-arabic text-right text-[12px]') 
                : (isNote ? 'font-handwritten text-left text-sm font-semibold' : 'font-serif text-left text-[12px]')
            }`}
            style={isNote ? { fontFamily: isAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } : undefined}
          >
            {textNode}
          </li>
        );
      });

      const isChecklist = block.items.some((i: any) => i.checked !== undefined);
      const remainingCount = block.items.length - 3;

      return (
        <div key={pIdx} className="my-2 text-left">
          <ul className={`space-y-1 ${isChecklist ? 'list-none pl-0' : 'list-disc pl-4'}`}>
            {listItems}
          </ul>
          {remainingCount > 0 && (
            <span className="text-[10px] text-stone-400 italic block mt-1">
              ... and {remainingCount} more item{remainingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      );
    }

    if (block.type === 'table') {
      return (
        <div key={pIdx} className="my-3 overflow-x-auto border border-stone-200/50 rounded p-1 bg-stone-50/20 text-left">
          <span className="font-mono text-[9px] text-stone-400 uppercase">Table: {block.headers.join(' | ')}</span>
        </div>
      );
    }

    if (block.type === 'image') {
      return (
        <figure key={pIdx} className="my-3 text-center bg-transparent">
          <span className="inline-block text-[11px] text-stone-400 italic border border-stone-200/55 p-1 rounded font-serif bg-stone-50/10">
            📷 [Image: {block.alt || 'Untitled'}]
          </span>
        </figure>
      );
    }

    if (block.type === 'divider') {
      return <hr key={pIdx} className="my-4 border-t border-stone-200/40" />;
    }

    if (block.type === 'code-block') {
      return (
        <pre key={pIdx} className="p-2.5 bg-stone-50 border border-stone-200/60 rounded font-mono text-[10px] text-left overflow-x-auto text-stone-700 max-h-32">
          <code>{block.code}</code>
        </pre>
      );
    }

    if (block.type === 'latin-quote') {
      return (
        <blockquote key={pIdx} className="my-4 pl-4 border-l border-Adjung-maroon/20 text-left bg-transparent">
          <p className="font-serif italic text-stone-600 text-xs md:text-sm">
            {parseInlineFormatting(block.text, [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
          </p>
          {block.translation && (
            <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
              <p className="font-serif italic text-xs text-stone-500">
                {parseInlineFormatting(block.translation, [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
              </p>
            </div>
          )}
        </blockquote>
      );
    }

    if (block.type === 'arabic-quote') {
      return (
        <blockquote key={pIdx} className="my-4 pr-4 border-r border-Adjung-maroon/20 text-right bg-transparent">
          <p className="font-arabic text-sm md:text-base text-stone-850 leading-loose">
            {parseInlineFormatting(block.arabic, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
          </p>
          {block.translation && (
            <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
              <p className="font-serif italic text-xs text-stone-500">
                {parseInlineFormatting(block.translation, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
              </p>
            </div>
          )}
        </blockquote>
      );
    }

    const isParaAr = isArabicText(block.text);
    return (
      <p 
        key={pIdx}
        dir={isParaAr ? 'rtl' : 'ltr'}
        className={`leading-relaxed ${
          isParaAr 
            ? (isNote ? 'font-arabic-handwritten text-right text-stone-900 text-sm md:text-base leading-loose' : 'font-arabic text-right text-stone-900 text-sm md:text-base leading-loose') 
            : (isNote ? 'font-handwritten text-left text-sm md:text-base text-stone-900 font-medium' : 'font-serif text-left text-xs md:text-sm text-stone-650')
        }`}
        style={isNote ? { fontFamily: isParaAr ? 'var(--font-arabic-handwritten)' : 'var(--font-handwritten)' } : undefined}
      >
        {parseInlineFormatting(block.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
      </p>
    );
  };

  return (
    <div className="relative w-full">
      {/* Hidden measuring container to determine block heights under the exact layout rules */}
      <div 
        ref={measureContainerRef}
        className="absolute opacity-0 pointer-events-none select-none w-full"
        style={{ top: -9999, left: -9999 }}
      >
        {contentBlocks.map((block, idx) => renderSingleBlock(block, idx))}
      </div>

      {/* Main Visible Container */}
      <div className="space-y-3 mt-1.5">
        {isExpanded ? (
          <div className="space-y-3 animate-fade-in">
            {contentBlocks.map((block, idx) => renderSingleBlock(block, idx))}
            {item.citations && item.citations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-200/50 text-[10px] text-stone-500 font-sans text-left">
                <span className="font-semibold uppercase tracking-wider block mb-1">References & Bibliography:</span>
                <ul className="list-disc pl-4 space-y-1">
                  {item.citations.map((cit) => (
                    <li key={cit.id} className="text-left font-serif">
                      <strong className="font-sans font-medium text-stone-700">{cit.author}</strong> ({cit.year}). "{cit.title}." <em>{cit.publisher}</em>.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exceedsLimit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-[10px] font-mono tracking-wider uppercase text-Adjung-maroon hover:underline mt-2 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded transition cursor-pointer"
              >
                Show Less
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contentBlocks.slice(0, visibleCount).map((block, idx) => renderSingleBlock(block, idx))}
            {exceedsLimit && (
              item.contentType === 'Note' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="text-[10px] font-mono tracking-wider uppercase text-Adjung-maroon hover:underline mt-1.5 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  Read More ↓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenText) {
                      onOpenText();
                    } else {
                      onToggle();
                    }
                  }}
                  className="text-[10px] font-mono tracking-wider uppercase text-Adjung-maroon hover:underline mt-1.5 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded transition cursor-pointer font-semibold"
                >
                  Open Text →
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
