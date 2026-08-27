import React, { useState, useEffect } from 'react';

interface ElasticMarginRowProps {
  key?: React.Key;
  children: React.ReactNode;
  noteLabel?: string;
  noteContent?: React.ReactNode;
  noteIndexRoman?: string;
  isRtl?: boolean;
  proseFont?: string;
  spacingBefore?: number; // px — overrides the default py-3 top spacing when provided
  spacingAfter?: number;  // px — overrides the default py-3 bottom spacing when provided
  columnWidthPx?: number; // px — explicit reading-column width (desktop). Falls back to the 8/12 grid ratio when omitted.
  marginWidthPx?: number; // px — explicit margin-note-column width (desktop). Falls back to the 8/12 grid ratio when omitted.
  editMode?: boolean;     // Layout Inspector is open — show Photoshop-style dashed outlines
  showEditLabels?: boolean; // show the "COLUMN" / "MARGIN NOTE" tag once (first paragraph only)
}

export function ElasticMarginRow({
  children,
  noteLabel,
  noteContent,
  noteIndexRoman,
  isRtl = false,
  proseFont = 'font-sans',
  spacingBefore,
  spacingAfter,
  columnWidthPx,
  marginWidthPx,
  editMode = false,
  showEditLabels = false
}: ElasticMarginRowProps) {
  const spacingStyle = (spacingBefore !== undefined || spacingAfter !== undefined)
    ? { paddingTop: spacingBefore ?? 12, paddingBottom: spacingAfter ?? 12 }
    : undefined;
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint in Tailwind is 1024px
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop layout (always visible split-screen, perfectly aligned paragraphs)
  if (!isMobile) {
    const gridStyle = (columnWidthPx !== undefined && marginWidthPx !== undefined)
      ? { gridTemplateColumns: `${columnWidthPx}px ${marginWidthPx}px`, columnGap: 32 }
      : undefined;
    return (
      <div className={`w-full border-b border-stone-100/40 last:border-0 ${spacingStyle ? '' : 'py-3'}`} style={spacingStyle}>
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className={gridStyle ? 'grid items-start' : 'grid grid-cols-12 gap-8 items-start'}
          style={gridStyle}
        >
          {/* Main content column */}
          <div className={`relative text-[#111111] leading-relaxed select-text ${gridStyle ? '' : 'col-span-8'} ${editMode ? 'outline outline-2 outline-dashed outline-blue-400 outline-offset-4' : ''}`}>
            {editMode && showEditLabels && (
              <span className="absolute -top-5 left-0 font-mono text-[8px] uppercase tracking-wider text-blue-500 bg-white px-1 select-none">Column</span>
            )}
            {children}
          </div>

          {/* Margin note column — always rendered + outlined in edit mode, even when empty, so the reserved space is visible */}
          <div className={`relative select-text ${gridStyle ? '' : 'col-span-4'} ${isRtl ? 'pr-6 text-right' : 'pl-6 text-left'} ${editMode ? 'outline outline-2 outline-dashed outline-amber-400 outline-offset-4 min-h-[2em]' : ''}`}>
            {editMode && showEditLabels && (
              <span className="absolute -top-5 left-0 font-mono text-[8px] uppercase tracking-wider text-amber-500 bg-white px-1 select-none">Margin Note</span>
            )}
            {noteContent ? (
              <div className={isRtl ? "border-r-2 border-adjung-maroon/30 py-0.5 pr-4" : "border-l-2 border-adjung-maroon/30 py-0.5 pl-4"}>
                <div className="flex items-center gap-1.5 mb-1">
                  {noteIndexRoman && (
                    <span className="font-mono text-[10px] font-semibold text-adjung-maroon">
                      ({noteIndexRoman})
                    </span>
                  )}
                  {noteLabel && (
                    <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 font-bold">
                      {noteLabel}
                    </span>
                  )}
                </div>
                <div className={`text-stone-500 text-[13px] md:text-[13.5px] leading-relaxed ${proseFont}`}>
                  {noteContent}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Mobile / Tablet layout — same arrangement as desktop (margin note
  // visible on the right, not hidden behind a swipe/drag gesture); only the
  // column proportions differ, since a phone screen can't fit desktop's
  // fixed pixel widths. Desktop's branch above is untouched.
  if (!noteContent) {
    return <div className="py-2 select-text">{children}</div>;
  }

  return (
    <div className="w-full border-b border-stone-100/40 last:border-0 py-3">
      <div dir={isRtl ? 'rtl' : 'ltr'} className="grid grid-cols-3 gap-3 items-start">
        {/* Main content column — same 2/3 share regardless of direction */}
        <div className={`col-span-2 relative text-[#111111] leading-relaxed select-text`}>
          {children}
        </div>

        {/* Margin note column — always visible, right-hand third */}
        <div className={`relative select-text ${isRtl ? 'pr-3 text-right' : 'pl-3 text-left'}`}>
          <div className={isRtl ? "border-r-2 border-adjung-maroon/30 py-0.5 pr-3" : "border-l-2 border-adjung-maroon/30 py-0.5 pl-3"}>
            <div className="flex items-center gap-1.5 mb-1">
              {noteIndexRoman && (
                <span className="font-mono text-[9px] font-semibold text-adjung-maroon">
                  ({noteIndexRoman})
                </span>
              )}
              {noteLabel && (
                <span className="block font-mono text-[7px] uppercase tracking-wider text-stone-400 font-bold">
                  {noteLabel}
                </span>
              )}
            </div>
            <div className={`text-stone-500 text-[11px] leading-snug ${proseFont}`}>
              {noteContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
