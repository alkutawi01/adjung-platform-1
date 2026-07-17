import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldTooltipProps {
  text: string;
}

// Small shared "(?)" tooltip for form field labels — extends the ad-hoc
// hover-tooltip pattern already used in BiographyView.tsx into a reusable
// component. Supports both hover (desktop) and tap (mobile, via local state).
export function FieldTooltip({ text }: FieldTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative group/tooltip inline-flex items-center select-none"
      onClick={(e) => {
        e.preventDefault();
        setOpen((prev) => !prev);
      }}
    >
      <HelpCircle className="w-3 h-3 text-stone-400 hover:text-adjung-maroon transition-colors cursor-help" />
      <span
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 px-2.5 py-1.5 bg-stone-900 text-stone-100 text-[9px] font-sans normal-case tracking-normal font-normal leading-relaxed rounded shadow-md pointer-events-none z-50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        } group-hover/tooltip:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}

export default FieldTooltip;
