import React from 'react';
import { HeadingBlock, parseContentToBlocks, parseInlineFormatting } from '../../utils';

interface TableOfContentsProps {
  contentType: string;
  fullContent: string;
}

export function TableOfContents({ contentType, fullContent }: TableOfContentsProps) {
  if (contentType === 'Note') return null;

  const allBlocks = parseContentToBlocks(fullContent);
  // EntryRenderer's reading view assigns id="heading-{n}" using each
  // heading's position in the FULL block list (it renders every block,
  // headings included, from one content.split(/\n\n+/) pass) — not its
  // position among headings alone. Keeping the block's real index here,
  // rather than re-numbering just the filtered headings, is what makes
  // these links actually land on the right heading once a paragraph sits
  // between two of them.
  const headingEntries = allBlocks
    .map((block, blockIdx) => ({ block, blockIdx }))
    .filter((entry): entry is { block: HeadingBlock; blockIdx: number } => entry.block.type === 'heading');

  if (headingEntries.length === 0) return null;

  return (
    <div className="mb-8 border border-stone-200/90 p-4 rounded bg-stone-50/20 text-left font-sans text-xs">
      <details className="group" open>
        <summary className="font-mono text-[9px] uppercase tracking-wider text-adjung-maroon font-bold cursor-pointer list-none flex items-center justify-between">
          <span>Table of Contents Outline</span>
          <span className="print:hidden text-stone-400 group-open:hidden">show</span>
          <span className="print:hidden text-stone-400 hidden group-open:inline">hide</span>
        </summary>

        <ul className="mt-3.5 space-y-2 border-t border-stone-200/60 pt-3">
          {headingEntries.map(({ block: h, blockIdx }) => {
            const levelIndent = h.level === 1 ? '' : (h.level === 2 ? 'pl-4 border-l border-stone-200' : 'pl-8 border-l border-stone-200');
            const levelMarker = h.level === 1 ? '§' : (h.level === 2 ? '•' : '◦');

            return (
              <li key={`toc-${blockIdx}`} className={`${levelIndent} text-stone-600 hover:text-adjung-maroon font-sans`}>
                <a href={`#heading-${blockIdx}`} className="flex items-baseline gap-1.5 transition-colors">
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
