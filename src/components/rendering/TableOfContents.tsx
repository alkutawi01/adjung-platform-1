import React from 'react';
import { HeadingBlock, parseContentToBlocks, parseInlineFormatting } from '../../utils';

interface TableOfContentsProps {
  contentType: string;
  fullContent: string;
}

export function TableOfContents({ contentType, fullContent }: TableOfContentsProps) {
  if (contentType === 'Note') return null;

  const allBlocks = parseContentToBlocks(fullContent);
  const headings = allBlocks.filter(b => b.type === 'heading') as HeadingBlock[];

  if (headings.length === 0) return null;

  return (
    <div className="mb-8 border border-stone-200/90 p-4 rounded bg-stone-50/20 text-left font-sans text-xs">
      <details className="group" open>
        <summary className="font-mono text-[9px] uppercase tracking-wider text-adjung-maroon font-bold cursor-pointer list-none flex items-center justify-between">
          <span>Table of Contents Outline</span>
          <span className="print:hidden text-stone-400 group-open:hidden">show</span>
          <span className="print:hidden text-stone-400 hidden group-open:inline">hide</span>
        </summary>

        <ul className="mt-3.5 space-y-2 border-t border-stone-200/60 pt-3">
          {headings.map((h, hIdx) => {
            const levelIndent = h.level === 1 ? '' : (h.level === 2 ? 'pl-4 border-l border-stone-200' : 'pl-8 border-l border-stone-200');
            const levelMarker = h.level === 1 ? '§' : (h.level === 2 ? '•' : '◦');

            return (
              <li key={`toc-${hIdx}`} className={`${levelIndent} text-stone-600 hover:text-adjung-maroon font-sans`}>
                <a href={`#heading-${hIdx}`} className="flex items-baseline gap-1.5 transition-colors">
                  <span className="font-mono text-[9px] text-adjung-maroon/60 select-none">{levelMarker}</span>
                  <span className="text-xs">{parseInlineFormatting(h.text)}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
