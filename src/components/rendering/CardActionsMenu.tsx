import React, { useRef, useState } from 'react';
import { Entry } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { supabaseService } from '../../utils/supabaseService';

interface CardActionsMenuProps {
  entry: Entry;
  authorName: string;
  /** Called when the reader picks an action that leaves the list. */
  onNavigateAway?: () => void;
}

/**
 * The (...) menu on a list card (Content, Folio). A trimmed copy of the
 * canonical EntryActionsMenu: the card sits inside a list, so Print and
 * Export PDF (which act on the whole window) are left out, and a Note has
 * no URL of its own, so Copy Link and Citation only appear on an Essay.
 *
 * The card itself is a click target (open / expand), so every click in
 * here stops propagation — otherwise picking "Copy Link" would also open
 * the essay underneath.
 */
export function CardActionsMenu({ entry, authorName, onNavigateAway }: CardActionsMenuProps) {
  const { currentUser, showToast, setEditingEntry, setSelectedEntry, setActiveTab, requestConfirm, refreshDbState } = useAppContext();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isOwner = !!currentUser && currentUser.id === entry.authorId;
  const hasUrl = entry.contentType !== 'Note' && !!entry.canonicalUrl;
  const title = entry.title || 'Untitled';

  const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };

  // The card itself carries data-export-card so this can find its own
  // container regardless of which surface rendered it (Content, Folio).
  // Everything marked data-card-menu (this component's own root) is
  // excluded from the capture — otherwise a screenshot of a Note would
  // include its own open dropdown.
  const saveAsImage = async () => {
    setOpen(false);
    const cardEl = rootRef.current?.closest('[data-export-card]') as HTMLElement | null;
    if (!cardEl) {
      showToast('Could not find the card to export.', 'error');
      return;
    }
    setIsExporting(true);
    try {
      // html-to-image's own toPng()/toCanvas() hung indefinitely on this
      // card — no error, no timeout, confirmed by isolating each of its
      // internal steps by hand: its toSvg() resolves in a few seconds, and
      // loading that same SVG into a plain <img> resolves immediately too,
      // but toPng() combining the two never settled. Rather than depend on
      // whatever toCanvas() does differently internally, this does the two
      // proven-working steps itself: get the SVG, load it into an Image,
      // draw that to a canvas.
      //
      // skipFonts is deliberately NOT used here: it was tried first as a
      // fix for the hang (692 registered @font-face rules from the
      // signature font picker looked like the obvious cause), and it
      // measurably breaks output quality — checked side by side, the
      // signature's cursive font silently falls back to a generic serif
      // in the exported image when fonts are skipped, on a platform whose
      // whole identity system is the signature. It also turned out not to
      // be the actual cause of the hang (removing it alone didn't fix
      // anything, isolating the two library calls did), so there's no
      // longer a reason to keep the trade-off.
      const { toSvg } = await import('html-to-image');
      const exportTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out generating the image.')), 20000)
      );
      const svgDataUrl = await Promise.race([
        toSvg(cardEl, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-card-menu')),
        }),
        exportTimeout,
      ]);

      const pixelRatio = 2;
      const rect = cardEl.getBoundingClientRect();
      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Could not load the rendered card image.'));
      });
      img.src = svgDataUrl;
      await Promise.race([loaded, exportTimeout]);

      const canvas = document.createElement('canvas');
      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create a drawing surface for the image.');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');

      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'adjung-entry';
      const link = document.createElement('a');
      link.download = `${safeTitle}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Image saved — check your downloads.', 'success');
    } catch (err) {
      console.error('Failed to export card image:', err);
      showToast('Could not generate the image. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(entry.canonicalUrl)
      .then(() => showToast('Canonical link copied to clipboard!', 'success'))
      .catch(() => showToast('Could not copy the link — your browser blocked clipboard access.', 'error'));
    setOpen(false);
  };

  const copyCitation = () => {
    const year = new Date(entry.publishedDate || entry.createdDate).getFullYear();
    const cite = `${authorName}. (${year}). ${title}. Adjung. Retrieved from ${entry.canonicalUrl}`;
    navigator.clipboard.writeText(cite)
      .then(() => showToast('Citation copied to clipboard (APA Format)!', 'success'))
      .catch(() => showToast('Could not copy the citation — your browser blocked clipboard access.', 'error'));
    setOpen(false);
  };

  const edit = () => {
    setEditingEntry(entry);
    setSelectedEntry(null);
    setActiveTab('desk');
    setOpen(false);
    onNavigateAway?.();
  };

  const report = () => {
    setOpen(false);
    requestConfirm(
      'Are you sure you want to report this writing for review by the Editorial Board?',
      () => {
        supabaseService.saveEntry({ ...entry, underReview: true })
          .then(() => {
            if (currentUser) {
              supabaseService.logAction(`Reported entry "${entry.title}" (ID: ${entry.id}) for moderation.`, currentUser).then(() => refreshDbState());
            } else {
              refreshDbState();
            }
            showToast('Report sent. The article is now under review by the Editorial Board.', 'info');
          })
          .catch(err => {
            console.error('Failed to report entry:', err);
            showToast('Could not send the report. Please try again.', 'error');
          });
      },
      { confirmLabel: 'Report', danger: false }
    );
  };

  const itemClass = 'w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition duration-150 cursor-pointer border-0 bg-transparent font-sans';

  const items: React.ReactNode[] = [
    // Works for both Essay and Note — an image doesn't need a canonical
    // URL, which is the constraint that keeps Copy Link and Citation off
    // a Note's menu. First item: it's the one every card can offer.
    <button key="image" type="button" disabled={isExporting} onClick={(e) => { stop(e); saveAsImage(); }} className={`${itemClass} disabled:opacity-50 disabled:cursor-wait`}>
      {isExporting ? 'Generating…' : 'Save as Image'}
    </button>
  ];
  if (hasUrl) {
    items.push(<button key="link" type="button" onClick={(e) => { stop(e); copyLink(); }} className={itemClass}>Copy Link</button>);
    items.push(<button key="cite" type="button" onClick={(e) => { stop(e); copyCitation(); }} className={itemClass}>Citation</button>);
  }
  if (isOwner) {
    items.push(<button key="edit" type="button" onClick={(e) => { stop(e); edit(); }} className={`${itemClass} font-medium text-adjung-maroon`}>Edit</button>);
  }
  if (!isOwner && !entry.underReview) {
    items.push(<button key="report" type="button" onClick={(e) => { stop(e); report(); }} className={`${itemClass} text-amber-700 hover:bg-amber-50`}>Report</button>);
  }

  return (
    <div ref={rootRef} data-card-menu="true" className="relative normal-case tracking-normal" onMouseLeave={() => setOpen(false)} onClick={stop}>
      <button
        type="button"
        onClick={(e) => { stop(e); setOpen(!open); }}
        className="text-stone-400 hover:text-adjung-maroon font-bold text-sm tracking-widest px-1.5 py-0.5 -my-0.5 transition-colors cursor-pointer select-none bg-transparent border-0 font-sans leading-none"
        title="Actions Menu"
        aria-label="Entry actions menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-stone-200 rounded shadow-md py-1 z-50 text-left">
          {items}
        </div>
      )}
    </div>
  );
}
