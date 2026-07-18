import React, { useState, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { EntryType, LayoutSettings } from '../../types';
import { computeReadingLayout } from '../../utils';

interface LayoutInspectorProps {
  contentType: EntryType;
  currentSettings: LayoutSettings | null;
  defaultSettings: LayoutSettings;
  onApply: (settings: LayoutSettings) => Promise<void>;
  onToggle?: (open: boolean) => void;
  // Fires on every pending edit (+/-, typing, alignment toggle) so the page
  // behind the panel can re-render live — this is a LOCAL, unsaved preview
  // only. Nothing is written to the database (and no other reader sees
  // anything) until Apply is clicked; closing the panel without Apply reverts
  // the page back to the last-saved layout (onPreview fires with null).
  onPreview?: (settings: LayoutSettings | null) => void;
}

// Rough characters-per-line estimate (~0.5em average char width), matching
// the same heuristic used throughout the Typography Constitution's Reading
// Measure section — not a precise metric, just a live directional signal.
function estimateCPL(columnWidth: number, bodySizePx: number): number {
  return Math.round(columnWidth / (bodySizePx * 0.5));
}

export function LayoutInspector({ contentType, currentSettings, defaultSettings, onApply, onToggle, onPreview }: LayoutInspectorProps) {
  const [open, setOpenState] = useState(false);
  const setOpen = (v: boolean) => {
    setOpenState(v);
    onToggle?.(v);
    if (!v) onPreview?.(null); // closing without Apply — revert the page to the last-saved layout
  };
  const [pending, setPending] = useState<LayoutSettings>(currentSettings || defaultSettings);
  const [saving, setSaving] = useState(false);
  // True only after the reader actually touches a control — opening the
  // panel must never, by itself, change what's rendered. Without this gate,
  // the very first render after opening would preview `defaultSettings`
  // (e.g. a 519px column) even when nothing had been edited yet, which could
  // visibly differ from whatever's actually live (e.g. essaySpec.ts's own
  // hardcoded 860px card) and make the page jump the instant the panel opens.
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    setPending(currentSettings || defaultSettings);
    setHasEdited(false);
  }, [currentSettings, defaultSettings]);

  // Live local preview — fires on every pending edit, but only once the
  // reader has actually changed something. Does not touch the database;
  // Apply is still the only thing that does.
  useEffect(() => {
    if (open && hasEdited) onPreview?.(pending);
  }, [pending, open, hasEdited]);

  const edit = (updater: (prev: LayoutSettings) => LayoutSettings) => {
    setHasEdited(true);
    setPending(updater);
  };

  const bodySizePx = contentType === 'Essay' || contentType === 'Note' ? 15 : 12;
  const cpl = estimateCPL(pending.columnWidth, bodySizePx);
  const cplTone = cpl < 55 ? 'text-amber-600' : cpl > 85 ? 'text-red-600' : 'text-emerald-600';
  const liveLayout = computeReadingLayout(contentType, pending.columnWidth, pending.marginNoteWidth, pending.padding);

  const handleApply = async () => {
    setSaving(true);
    try {
      await onApply(pending);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: number, onChange: (v: number) => void, opts?: { step?: number; min?: number; suffix?: string }) => {
    const step = opts?.step ?? 1;
    const min = opts?.min ?? 0;
    const clamp = (v: number) => Math.round((Math.max(min, v) / step)) * step;
    return (
    <div>
      <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1 font-semibold">{label}</label>
      <div className="relative flex items-stretch border border-stone-200 rounded overflow-hidden focus-within:border-adjung-maroon">
        <button
          type="button"
          onClick={() => onChange(Number((clamp(value - step)).toFixed(2)))}
          className="w-7 flex-shrink-0 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-adjung-maroon border-r border-stone-200 cursor-pointer select-none font-mono text-sm"
          tabIndex={-1}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return; // let the user clear the field mid-edit without it snapping back
            onChange(Number(raw));
          }}
          onBlur={(e) => {
            const raw = Number(e.target.value);
            if (e.target.value === '' || Number.isNaN(raw) || raw < min) onChange(min);
          }}
          className="w-full min-w-0 px-2 py-1.5 text-xs font-mono text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(Number((clamp(value + step)).toFixed(2)))}
          className="w-7 flex-shrink-0 flex items-center justify-center bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-adjung-maroon border-l border-stone-200 cursor-pointer select-none font-mono text-sm"
          tabIndex={-1}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
        {opts?.suffix && (
          <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[9px] text-stone-400 font-mono select-none pointer-events-none">{opts.suffix}</span>
        )}
      </div>
    </div>
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-stone-100 rounded-full pl-3 pr-4 py-2.5 shadow-xl hover:bg-stone-800 transition cursor-pointer"
        title="Layout Inspector (Chief Editor only)"
      >
        <Settings2 className="w-4 h-4" />
        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Layout</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[300px] bg-white border border-stone-200 rounded-lg shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 text-stone-100">
        <span className="font-mono text-[10px] uppercase tracking-widest font-semibold">Layout Inspector — {contentType}</span>
        <button type="button" onClick={() => setOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block font-mono uppercase text-[9px] text-stone-500 tracking-wider mb-1.5 font-semibold">Alignment</label>
          <div className="flex rounded border border-stone-200 overflow-hidden text-xs font-mono">
            {(['left', 'justify'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => edit(prev => ({ ...prev, alignment: a }))}
                className={`flex-1 py-1.5 uppercase tracking-wider transition cursor-pointer ${
                  pending.alignment === a ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('Column Width', pending.columnWidth, (v) => edit(prev => ({ ...prev, columnWidth: v })), { suffix: 'px', min: 200 })}
          {liveLayout.marginNoteWidthPx !== null
            ? field('Margin Note Width', pending.marginNoteWidth, (v) => edit(prev => ({ ...prev, marginNoteWidth: v })), { suffix: 'px', min: 80 })
            : <div />}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('Padding', pending.padding, (v) => edit(prev => ({ ...prev, padding: v })), { suffix: 'px', min: 16 })}
          {field('Card Width', liveLayout.cardWidthPx, (v) => {
            // rowWidth (column + margin note + gap) is whatever's left of the
            // CURRENT card after removing the current padding — solving for
            // it lets typing a new Card Width recompute Padding directly,
            // instead of Card Width being read-only. Column/Margin Note stay
            // exactly where they are; only Padding absorbs the change.
            const rowWidth = liveLayout.cardWidthPx - pending.padding * 2;
            const newPadding = (v - rowWidth) / 2;
            edit(prev => ({ ...prev, padding: Math.max(16, Math.round(newPadding)) }));
          }, { suffix: 'px', min: 200 })}
        </div>
        <p className="text-[9px] text-stone-400 -mt-2">Padding and Card Width are two views of the same gap — edit either one, the other follows. Column Width and Margin Note Width stay put.</p>

        {liveLayout.warning && (
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-2 leading-relaxed">
            ⚠ {liveLayout.warning}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {field('Spacing Before', pending.spacingBefore, (v) => edit(prev => ({ ...prev, spacingBefore: v })), { suffix: 'px' })}
          {field('Spacing After', pending.spacingAfter, (v) => edit(prev => ({ ...prev, spacingAfter: v })), { suffix: 'px' })}
        </div>

        {field('Line Height', pending.lineHeight, (v) => edit(prev => ({ ...prev, lineHeight: v })), { step: 0.05, min: 1 })}

        <div className="flex items-baseline justify-between border-t border-stone-100 pt-3">
          <span className="font-mono text-[9px] uppercase text-stone-400 tracking-wider">Estimated CPL</span>
          <span className={`font-mono text-sm font-semibold ${cplTone}`}>{cpl}</span>
        </div>
        <p className="text-[10px] text-stone-400 leading-relaxed">
          Ideal 60–75, never exceed 80. Changes only take effect after you click Apply — nothing updates while you type.
        </p>
      </div>

      <div className="flex gap-2 px-4 py-3 border-t border-stone-100 bg-stone-50">
        <button
          type="button"
          onClick={() => { setPending(currentSettings || defaultSettings); setHasEdited(false); }}
          disabled={saving}
          className="flex-1 border border-stone-200 text-stone-600 rounded text-[10px] uppercase font-mono tracking-wider py-2 hover:bg-white transition cursor-pointer disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={saving}
          className="flex-1 bg-adjung-maroon text-white rounded text-[10px] uppercase font-mono tracking-wider py-2 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
