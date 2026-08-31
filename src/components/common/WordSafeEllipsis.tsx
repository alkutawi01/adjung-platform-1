import React, { useEffect, useRef, useState } from 'react';

interface WordSafeEllipsisProps {
  text: string;
  className?: string;
  /** Applied to the truncated string only (e.g. parseInlineFormatting for markdown) — never to the full, untruncated text. */
  format?: (truncated: string) => React.ReactNode;
}

/**
 * Single-line truncation that measures actual rendered pixel width via
 * ResizeObserver, instead of guessing a fixed word budget. truncateAtWord()
 * in utils.tsx is a solid interim (never cuts mid-word) but isn't pixel-exact
 * at every viewport/column width — this is the rigorous version for narrow
 * table/row cells (Desk's list, Index's table) flagged in SPEC-028 §14.1.
 */
export function WordSafeEllipsis({ text, className = '', format }: WordSafeEllipsisProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const fit = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth === 0) return;

      measure.textContent = text;
      if (measure.scrollWidth <= containerWidth) {
        setDisplayText(text);
        return;
      }

      // Binary search the largest word count whose "words + …" still fits —
      // lo always fits (invariant starts true at 0 words), hi never does
      // (the full text already didn't fit above, and it's only longer).
      const words = text.split(' ');
      let lo = 0;
      let hi = words.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        measure.textContent = words.slice(0, mid).join(' ') + '…';
        if (measure.scrollWidth <= containerWidth) {
          lo = mid;
        } else {
          hi = mid - 1;
        }
      }

      if (lo > 0) {
        setDisplayText(words.slice(0, lo).join(' ') + '…');
        return;
      }

      // Not even one word fits — fall back to a character-level cut so an
      // extremely narrow column still shows something instead of nothing.
      const firstWord = words[0] || '';
      let charLo = 0;
      let charHi = firstWord.length;
      while (charLo < charHi) {
        const mid = Math.ceil((charLo + charHi) / 2);
        measure.textContent = firstWord.slice(0, mid) + '…';
        if (measure.scrollWidth <= containerWidth) {
          charLo = mid;
        } else {
          charHi = mid - 1;
        }
      }
      setDisplayText(charLo > 0 ? firstWord.slice(0, charLo) + '…' : '…');
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={containerRef} className={`block whitespace-nowrap overflow-hidden ${className}`}>
      {format ? format(displayText) : displayText}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none', top: -9999, left: -9999 }}
      />
    </span>
  );
}
