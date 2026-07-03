import React, { useState, useLayoutEffect, useRef } from 'react';
import { Entry } from '../types';
import { parseContentToBlocks, isArabicText, parseInlineFormatting } from '../utils';

interface TimelineEntryCollapseRendererProps {
  item: Entry;
  isExpanded: boolean;
  onToggle: () => void;
  maxHeight?: number;
}

export function TimelineEntryCollapseRenderer({
  item,
  isExpanded,
  onToggle,
  maxHeight = 220,
}: TimelineEntryCollapseRendererProps) {
  const [visibleCount, setVisibleCount] = useState<number>(9999);
  const [exceedsLimit, setExceedsLimit] = useState<boolean>(false);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);

  const contentBlocks = parseContentToBlocks(item.content);

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
    if (block.type === 'latin-quote') {
      return (
        <blockquote key={pIdx} className="my-4 pl-4 border-l border-adjung-maroon/20 text-left bg-transparent">
          <p className="font-serif italic text-stone-600 text-xs md:text-sm">
            {parseInlineFormatting(block.text)}
          </p>
        </blockquote>
      );
    }
    if (block.type === 'arabic-quote') {
      return (
        <blockquote key={pIdx} className="my-4 pr-4 border-r border-adjung-maroon/20 text-right bg-transparent">
          <p className="font-arabic text-sm md:text-base text-stone-850 leading-loose">
            {parseInlineFormatting(block.arabic)}
          </p>
          {block.translation && (
            <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
              <p className="font-serif italic text-xs text-stone-500">
                {parseInlineFormatting(block.translation)}
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
        className={`${
          isParaAr 
            ? 'font-arabic text-right text-stone-900 leading-loose text-sm md:text-base' 
            : 'font-serif text-left text-xs md:text-sm text-stone-650 leading-relaxed'
        }`}
      >
        {parseInlineFormatting(block.text)}
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
            {exceedsLimit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-[10px] font-mono tracking-wider uppercase text-adjung-maroon hover:underline mt-2 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded transition"
              >
                Show Less
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contentBlocks.slice(0, visibleCount).map((block, idx) => renderSingleBlock(block, idx))}
            {exceedsLimit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-[10px] font-mono tracking-wider uppercase text-adjung-maroon hover:underline mt-1.5 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded transition"
              >
                Read More ↓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
