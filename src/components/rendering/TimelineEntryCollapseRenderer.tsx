import React, { useState, useLayoutEffect, useRef } from 'react';
import { Entry, EntryLayoutVariant } from '../../types';
import { parseContentToBlocks, isArabicText, parseInlineFormatting, getFootnotesReadingOrderMap, getMarginNotesReadingOrderMap } from '../../utils';
import { PresentationSpec, getPresentationSpec } from '../../presentation';

interface TimelineEntryCollapseRendererProps {
  item: Entry;
  isExpanded: boolean;
  onToggle?: () => void;
  maxHeight?: number;
  onOpenText?: () => void;
  presentationSpec?: PresentationSpec;
  showInlineToggle?: boolean;
  onLimitExceeded?: (exceeded: boolean) => void;
  layoutVariant?: EntryLayoutVariant;
  // Bolds + tints the first WORD of the first paragraph in maroon, but only
  // when that paragraph is Arabic. Latin excerpts get an actual floating
  // drop cap instead (CSS `::first-letter` on the wrapping element in the
  // caller — that only ever grabs one character, which is fine for Latin's
  // drop-cap convention but not for Arabic, hence real markup here instead
  // of relying on the pseudo-element for the whole word).
  accentFirstWord?: boolean;
  // Overrides the layoutVariant-derived truncation budget. Needed because
  // the default 'melintang' budget (maxLines=6/maxChars=500/maxWords=100)
  // is word-safe internally but produces far more text than a 2-line card
  // excerpt has room for — the caller was then relying on CSS
  // `line-clamp-2` to visually clip the overflow, which clips at a pixel
  // boundary with no notion of word boundaries (hence "menja...").
  // Passing a tight word/char budget here means THIS function's own
  // word-safe cut is what actually determines where the text ends.
  maxWordsOverride?: number;
  maxCharsOverride?: number;
}

// truncatePreviewContent below cuts by raw words/chars with no notion of
// XML block boundaries (<quote>, <callout>). An entry that opens with one
// of these (a common structure for classical/religious texts quoting a
// hadith or verse before the author's own prose) would get its closing
// tag cut off mid-truncation — parseContentToBlocks then fails to match
// the now-unclosed tag and falls through to plain-paragraph parsing,
// leaking the raw <arabic>/<quote> markup as visible text in the card
// preview. Flattening these blocks to plain text before truncation means
// the cut always lands on real words; the full (untruncated) reading view
// is unaffected since it parses item.content directly, never this
// preview-only flattened copy.
function flattenXmlBlocksForPreview(content: string): string {
  return content
    .replace(/<quote[^>]*>([\s\S]*?)<\/quote>/g, (_match, inner: string) =>
      inner
        .replace(/<\/?(arabic|text|translation)>/g, '\n')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .join(' — ')
    )
    .replace(/<callout[^>]*>([\s\S]*?)<\/callout>/g, '$1');
}

function truncatePreviewContent(
  content: string,
  maxLinesLimit: number,
  maxCharsLimit: number,
  maxWordsLimit: number
): { text: string; exceeded: boolean } {
  if (!content) return { text: '', exceeded: false };

  const flattenedContent = flattenXmlBlocksForPreview(content);
  const rawLines = flattenedContent.split('\n');
  let charCount = 0;
  let wordCount = 0;
  let lineCount = 0;
  let finalLines: string[] = [];
  let exceeded = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (lineCount >= maxLinesLimit) {
      exceeded = true;
      break;
    }

    if (line.trim() === '') {
      if (charCount + 1 > maxCharsLimit) {
        exceeded = true;
        break;
      }
      finalLines.push('');
      charCount += 1;
      lineCount++;
      continue;
    }

    const words = line.split(/(\s+)/);
    let reconstructedLine = '';

    for (let word of words) {
      if (word === '') continue;

      const isWhitespace = /^\s+$/.test(word);
      if (isWhitespace) {
        if (charCount + word.length > maxCharsLimit) {
          exceeded = true;
          break;
        }
        reconstructedLine += word;
        charCount += word.length;
      } else {
        if (wordCount >= maxWordsLimit) {
          exceeded = true;
          break;
        }
        if (charCount + word.length > maxCharsLimit) {
          exceeded = true;
          break;
        }
        reconstructedLine += word;
        charCount += word.length;
        wordCount++;
      }
    }

    finalLines.push(reconstructedLine);
    lineCount++;

    if (exceeded) {
      break;
    }

    if (i < rawLines.length - 1) {
      if (charCount + 1 > maxCharsLimit) {
        exceeded = true;
        break;
      }
      charCount += 1;
    }
  }

  let truncatedText = finalLines.join('\n');
  if (exceeded || truncatedText.length < flattenedContent.length) {
    exceeded = true;
    truncatedText = truncatedText.trim();
  }

  return { text: truncatedText, exceeded };
}

export function TimelineEntryCollapseRenderer({
  item,
  isExpanded,
  onToggle,
  onOpenText,
  presentationSpec,
  showInlineToggle = true,
  onLimitExceeded,
  layoutVariant: propLayoutVariant,
  accentFirstWord = false,
  maxWordsOverride,
  maxCharsOverride,
}: TimelineEntryCollapseRendererProps) {
  const activeSpec = presentationSpec || getPresentationSpec(item.contentType);
  const isVoiceEntry = item.contentType === 'Note' || item.contentType === 'Essay';
  const proseFont = isVoiceEntry ? 'font-serif' : 'font-sans';
  const [exceedsLimit, setExceedsLimit] = useState<boolean>(false);
  const measureContainerRef = useRef<HTMLDivElement | null>(null);

  const layoutVariant = propLayoutVariant || item.layoutVariant || 'melintang';

  let maxLines = 6;
  let maxChars = 500;
  let maxWords = 100;
  let defaultMaxHeight = 220;

  if (layoutVariant === 'menegak') {
    maxLines = 13;
    maxChars = 1000;
    maxWords = 200;
    defaultMaxHeight = 440;
  } else if (layoutVariant === 'penuh') {
    maxLines = 99999;
    maxChars = 999999;
    maxWords = 999999;
    defaultMaxHeight = 99999;
  }

  if (maxWordsOverride !== undefined) maxWords = maxWordsOverride;
  if (maxCharsOverride !== undefined) maxChars = maxCharsOverride;

  const [clampLines, setClampLines] = useState<number>(maxLines);
  const prevContentRef = useRef<string>(item.content);
  const prevVariantRef = useRef<string>(layoutVariant);

  useLayoutEffect(() => {
    if (prevContentRef.current !== item.content || prevVariantRef.current !== layoutVariant) {
      setClampLines(maxLines);
      prevContentRef.current = item.content;
      prevVariantRef.current = layoutVariant;
    }
  }, [item.content, layoutVariant, maxLines]);

  const { text: truncatedContent, exceeded: contentExceeded } = truncatePreviewContent(
    item.content,
    clampLines,
    maxChars,
    maxWords
  );

  const fullContentBlocks = parseContentToBlocks(item.content);
  const previewContentBlocks = parseContentToBlocks(truncatedContent);

  const fMap = getFootnotesReadingOrderMap(item.content).map;
  const mMap = getMarginNotesReadingOrderMap(item.content).map;

  useLayoutEffect(() => {
    if (isExpanded || layoutVariant === 'penuh') return;

    const measureContainer = measureContainerRef.current;
    if (!measureContainer) return;

    let cardRoot = measureContainer.parentElement;
    while (cardRoot) {
      const className = cardRoot.className || '';
      if (
        className.includes('laid-paper') ||
        className.includes('deckled-white') ||
        className.includes('flex-grow')
      ) {
        break;
      }
      cardRoot = cardRoot.parentElement;
    }

    if (!cardRoot) return;

    let timerId: any = null;

    const check = () => {
      if (cardRoot.clientHeight <= 100) return;
      const cardOverflows = cardRoot.scrollHeight > cardRoot.clientHeight;
      if (cardOverflows && clampLines > 1) {
        setClampLines(prev => prev - 1);
        setExceedsLimit(true);
      } else if (!cardOverflows && clampLines < maxLines && (cardRoot.clientHeight - cardRoot.scrollHeight > 30)) {
        setClampLines(prev => prev + 1);
      } else {
        const visuallyClamped = measureContainer.scrollHeight > measureContainer.clientHeight;
        const exceeded = contentExceeded || visuallyClamped || clampLines < maxLines;
        setExceedsLimit(exceeded);

        if (onLimitExceeded) {
          timerId = setTimeout(() => {
            onLimitExceeded(exceeded);
          }, 0);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      check();
    });
    observer.observe(cardRoot);
    observer.observe(measureContainer);

    check();

    return () => {
      observer.disconnect();
      if (timerId) clearTimeout(timerId);
    };
  }, [clampLines, contentExceeded, onLimitExceeded, isExpanded, layoutVariant, maxLines]);

  const renderSingleBlock = (block: any, pIdx: number) => {
    if (block.type === 'heading') {
      const isAr = isArabicText(block.text);
      const textNode = parseInlineFormatting(block.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap);
      if (block.level === 1) {
        return (
          <h3 
            key={pIdx} 
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`${proseFont} text-stone-900 font-semibold my-2.5 ${
              isAr ? 'text-right text-[15px] font-arabic leading-loose' : 'text-left text-[14px] tracking-tight'
            }`}
          >
            {textNode}
          </h3>
        );
      } else {
        return (
          <h4 
            key={pIdx} 
            dir={isAr ? 'rtl' : 'ltr'} 
            className={`${proseFont} text-stone-800 font-medium my-2 ${
              isAr ? 'text-right text-[13px] font-arabic leading-loose' : 'text-left text-[12px]'
            }`}
          >
            {textNode}
          </h4>
        );
      }
    }

    if (block.type === 'list') {
      const listItems = block.items.slice(0, 3).map((item: any, itemIdx: number) => {
        const isAr = isArabicText(item.text);
        const isChecklist = item.checked !== undefined;
        const textNode = parseInlineFormatting(item.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap);
        if (isChecklist) {
          return (
            <li 
              key={itemIdx} 
              className={`flex items-center gap-1.5 ${isAr ? 'justify-start flex-row-reverse text-right' : 'text-left'}`}
            >
              <input type="checkbox" checked={item.checked} disabled className="h-3 w-3 rounded text-adjung-maroon cursor-default" />
              <span className={`text-[12px] ${item.checked ? 'line-through text-stone-400' : 'text-stone-600'} ${isAr ? 'font-arabic' : proseFont}`}>
                {textNode}
              </span>
            </li>
          );
        }
        return (
          <li key={itemIdx} className={`text-[12px] text-stone-600 ${isAr ? 'font-arabic text-right' : `${proseFont} text-left`}`}>
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
        <div key={pIdx} className="my-3 overflow-x-auto border border-stone-200/60 rounded p-1 bg-stone-50/20 text-left">
          <span className="font-mono text-[9px] text-stone-400 uppercase">Table: {block.headers.join(' | ')}</span>
        </div>
      );
    }

    if (block.type === 'image') {
      return (
        <figure key={pIdx} className="my-3 text-center bg-transparent">
          <span className={`inline-block text-[11px] text-stone-400 italic border border-stone-200/60 p-1 rounded ${proseFont} bg-stone-50/10`}>
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
        <blockquote key={pIdx} className="my-4 pl-4 border-l border-adjung-maroon/20 text-left bg-transparent">
          <p className={`${proseFont} italic text-stone-600 text-xs md:text-sm`}>
            {parseInlineFormatting(block.text, [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
          </p>
          {block.translation && (
            <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
              <p className={`${proseFont} italic text-xs text-stone-500`}>
                {parseInlineFormatting(block.translation, [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
              </p>
            </div>
          )}
        </blockquote>
      );
    }

    if (block.type === 'arabic-quote') {
      return (
        <blockquote key={pIdx} className="my-4 pr-4 border-r border-adjung-maroon/20 text-right bg-transparent">
          <p className="font-arabic text-sm md:text-base text-stone-800 leading-loose">
            {parseInlineFormatting(block.arabic, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
          </p>
          {block.translation && (
            <div dir="ltr" className="mt-2 pt-2 border-t border-stone-200/40 text-left">
              <p className={`${proseFont} italic text-xs text-stone-500`}>
                {parseInlineFormatting(block.translation, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
              </p>
            </div>
          )}
        </blockquote>
      );
    }

    const isParaAr = isArabicText(block.text);
    const isLastBlock = pIdx === previewContentBlocks.length - 1;
    const isFirstBlock = pIdx === 0;

    let bodyContent: React.ReactNode;
    if (accentFirstWord && isParaAr && isFirstBlock) {
      // Real markup, not ::first-letter — CSS's pseudo-element can only ever
      // grab one character, which can't express "bold the whole first word."
      const spaceIdx = block.text.indexOf(' ');
      const firstWord = spaceIdx === -1 ? block.text : block.text.slice(0, spaceIdx);
      const rest = spaceIdx === -1 ? '' : block.text.slice(spaceIdx);
      bodyContent = (
        <>
          <span className="font-bold text-adjung-maroon">
            {parseInlineFormatting(firstWord, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
          </span>
          {parseInlineFormatting(rest, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap)}
        </>
      );
    } else {
      bodyContent = parseInlineFormatting(block.text, item.citations || [], 'alphabetical', {}, fMap, undefined, undefined, mMap);
    }

    return (
      <p
        key={pIdx}
        dir={isParaAr ? 'rtl' : 'ltr'}
        className={`${
          isParaAr
            ? 'font-arabic text-right text-stone-900 leading-loose text-[18.5px]'
            : item.contentType === 'Note'
              ? 'font-handwritten text-left text-[18.5px] text-black leading-relaxed'
              : `${proseFont} font-light text-left text-[14px] leading-relaxed text-stone-600`
        }`}
      >
        {bodyContent}
        {!isExpanded && exceedsLimit && isLastBlock && (
          <span className="text-adjung-maroon font-bold ml-1 mr-1 select-none" style={{ pointerEvents: 'none' }}>...</span>
        )}
      </p>
    );
  };

  return (
    <div className="relative w-full">
      <div 
        ref={measureContainerRef}
        className="absolute opacity-0 pointer-events-none select-none w-full"
        style={{ 
          top: -9999, 
          left: -9999,
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {previewContentBlocks.map((block, idx) => renderSingleBlock(block, idx))}
      </div>

      {/* Main Visible Container */}
      <div className="space-y-3 mt-1.5">
        {isExpanded ? (
          <div className="space-y-3 animate-fade-in">
            {fullContentBlocks.map((block, idx) => renderSingleBlock(block, idx))}
            {activeSpec.visibility.showCitations && item.citations && item.citations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-stone-200/60 text-[10px] text-stone-500 font-sans text-left">
                <span className="font-semibold uppercase tracking-wider block mb-1">References & Bibliography:</span>
                <ul className="list-disc pl-4 space-y-1">
                  {item.citations.map((cit) => (
                    <li key={cit.id} className={`text-left ${proseFont}`}>
                      <strong className="font-sans font-medium text-stone-700">{cit.author}</strong> ({cit.year}). "{cit.title}." <em>{cit.publisher}</em>.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {exceedsLimit && showInlineToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-[10px] font-mono tracking-wider uppercase text-adjung-maroon hover:underline mt-2 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/90 px-2 py-0.5 rounded transition cursor-pointer"
              >
                Show Less
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-3">
              {previewContentBlocks.map((block, idx) => renderSingleBlock(block, idx))}
            </div>
            {exceedsLimit && showInlineToggle && (
              item.contentType === 'Note' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="text-[10px] font-mono tracking-wider uppercase text-adjung-maroon hover:underline mt-1.5 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/90 px-2 py-0.5 rounded transition cursor-pointer"
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
                  className="text-[10px] font-mono tracking-wider uppercase text-adjung-maroon hover:underline mt-1.5 flex items-center gap-1 bg-stone-100 hover:bg-stone-200/90 px-2.5 py-1 rounded transition cursor-pointer font-semibold"
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
