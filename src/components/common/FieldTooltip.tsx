import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldTooltipProps {
  text: string;
  /** Custom trigger element (e.g. a Sparkles badge icon). Defaults to a HelpCircle "(?)" glyph. */
  children?: React.ReactNode;
  /** Extra classes on the trigger wrapper, for alignment in different contexts. */
  className?: string;
  /** Overrides the bubble's sizing/typography classes — base position/color/fade stay fixed. */
  bubbleClassName?: string;
}

const DEFAULT_BUBBLE = 'w-44 px-2.5 py-1.5 text-[9px] font-sans normal-case tracking-normal font-normal leading-relaxed';

// Shared hover/tap tooltip. Generalized (Design System v2.0 §15) from the
// original HelpCircle-only form-field tooltip so it can also wrap arbitrary
// triggers (e.g. the "AI Editorial Fellow" Sparkles badge previously
// hand-copied into BiographyView.tsx, Navbar.tsx, Directory.tsx, App.tsx).
// Supports both hover (desktop) and tap (mobile, via local state).
export function FieldTooltip({ text, children, className, bubbleClassName }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative group/tooltip inline-flex items-center select-none ${className || ''}`}
      onClick={(e) => {
        e.preventDefault();
        setOpen((prev) => !prev);
      }}
    >
      {children ?? (
        <HelpCircle className="w-3 h-3 text-stone-400 hover:text-adjung-maroon transition-colors cursor-help" />
      )}
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-900 text-stone-100 rounded shadow-md pointer-events-none z-50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        } group-hover/tooltip:opacity-100 ${bubbleClassName || DEFAULT_BUBBLE}`}
      >
        {text}
      </span>
    </span>
  );
}

export default FieldTooltip;
