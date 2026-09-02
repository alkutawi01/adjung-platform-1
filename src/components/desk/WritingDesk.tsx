import React, { useState, useEffect, useRef } from 'react';
import { PenTool, ChevronLeft, Edit3, Lock, Globe } from 'lucide-react';
import { Entry, User, EntryType } from '../../types';
import { EntryRenderer } from '../rendering/EntryRenderer';
import { parseInlineFormatting, stripMarkdown, getVisualModeUnsupportedBlockTypes } from '../../utils';
import { useAppContext } from '../../context/AppContext';
import { resolveDigitalSignature } from '../../utils/signatureResolvers';
import { WordSafeEllipsis } from '../common/WordSafeEllipsis';

interface WritingDeskProps {
  entry?: Entry | null;
  onSave?: (entry: Entry) => void;
  onClose?: () => void;
  mode?: 'production' | 'laboratory';
  viewModeOverride?: 'preview' | 'editor';
  authorName?: string;
  authorSignature?: string;
  authorSignatureFont?: string;
}

export function WritingDesk({
  entry,
  onSave,
  onClose,
  mode = 'production',
  viewModeOverride,
  authorName,
  authorSignature,
  authorSignatureFont
}: WritingDeskProps = {}) {
  const {
    currentUser,
    entries,
    identities,
    editingEntry: contextEditingEntry,
    setEditingEntry: contextSetEditingEntry,
    refreshDbState,
    createNewEntry,
    saveEntry: contextSaveEntry,
    deleteEntry: contextDeleteEntry,
  } = useAppContext();

  const activeEntry = mode === 'laboratory' ? entry : contextEditingEntry;

  // Desk's own entries were never explicitly sorted — filter().map() just
  // returned whatever order the DB fetch happened to come back in, not
  // newest-first as the list visually implied.
  const ownedEntries = entries.filter(e => {
    const isOwner = e.authorId === currentUser?.id;
    const isInst = e.publicationClass === 'Institutional' && (currentUser?.role === 'Chief Editor' || currentUser?.role === 'Editor');
    return isOwner || isInst;
  });
  const draftEntries = ownedEntries
    .filter(e => e.status === 'Draft')
    .sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
  const publishedEntries = ownedEntries
    .filter(e => e.status === 'Published')
    .sort((a, b) => new Date(b.publishedDate || b.updatedDate).getTime() - new Date(a.publishedDate || a.updatedDate).getTime());

  const [viewMode, setViewMode] = useState<'preview' | 'editor'>(viewModeOverride || 'preview');
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    if (viewModeOverride) {
      setViewMode(viewModeOverride);
    }
  }, [viewModeOverride]);

  // Visual mode's contentEditable canvas cannot round-trip tables, images,
  // lists, code fences, XML quote/callout blocks, or dividers — opening one
  // of these in Visual mode and making any edit silently destroys the
  // block the moment the canvas re-serializes (htmlToMarkdown strips any
  // tag it doesn't recognize). Until Visual mode actually supports these
  // block types, pin affected entries to Source mode so nobody loses a
  // table/image/quote without realizing it.
  const unsupportedVisualBlockTypes = activeEntry ? getVisualModeUnsupportedBlockTypes(activeEntry.content) : [];
  const visualModeBlocked = unsupportedVisualBlockTypes.length > 0;

  useEffect(() => {
    if (activeEntry && mode !== 'laboratory') {
      setViewMode(getVisualModeUnsupportedBlockTypes(activeEntry.content).length > 0 ? 'editor' : 'preview');
    }
  }, [activeEntry?.id, mode]);

  useEffect(() => {
    if (visualModeBlocked && viewMode === 'preview') {
      setViewMode('editor');
    }
  }, [visualModeBlocked, viewMode]);

  const handleSave = (updatedEntry: Entry) => {
    if (mode === 'laboratory') {
      if (onSave) onSave(updatedEntry);
    } else {
      contextSaveEntry(updatedEntry);
    }
  };

  const handleDelete = (id: string) => {
    if (mode === 'laboratory') {
      // no op
    } else {
      contextDeleteEntry(id);
    }
  };

  const handleClose = () => {
    if (mode === 'laboratory') {
      if (onClose) onClose();
    } else {
      contextSetEditingEntry(null);
      refreshDbState();
    }
  };

  const renderComposer = () => {
    if (!activeEntry) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-[#111111]/5 p-2 border border-[#111111]/10 rounded">
          {mode !== 'laboratory' ? (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1 text-[#111111]/60 hover:text-adjung-maroon font-mono text-xs uppercase cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Close Composer
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#111111]/40">View</span>
            <div className="flex items-center border border-[#111111]/10 rounded overflow-hidden bg-white p-0.5 shadow-sm">
              <button
                type="button"
                disabled={visualModeBlocked}
                onClick={() => {
                  if (visualModeBlocked) return;
                  lastScrollY.current = window.scrollY;
                  setViewMode('preview');
                  setTimeout(() => {
                    window.scrollTo({
                      top: lastScrollY.current,
                      behavior: 'auto'
                    });
                  }, 0);
                }}
                title={visualModeBlocked ? `Visual mode can't yet edit this entry's ${unsupportedVisualBlockTypes.join(', ')} content without losing it — use Source mode` : undefined}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition rounded-sm ${
                  visualModeBlocked
                    ? 'text-[#111111]/25 cursor-not-allowed'
                    : viewMode === 'preview'
                    ? 'bg-stone-800 text-white font-medium shadow-sm cursor-pointer'
                    : 'text-[#111111]/60 hover:text-adjung-maroon cursor-pointer'
                }`}
              >
                ● Visual
              </button>
              <button
                type="button"
                onClick={() => {
                  lastScrollY.current = window.scrollY;
                  setViewMode('editor');
                  setTimeout(() => {
                    window.scrollTo({
                      top: lastScrollY.current,
                      behavior: 'auto'
                    });
                  }, 0);
                }}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition rounded-sm cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-stone-800 text-white font-medium shadow-sm'
                    : 'text-[#111111]/60 hover:text-adjung-maroon'
                }`}
              >
                ○ Source
              </button>
            </div>
          </div>
        </div>

        {visualModeBlocked && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-800">
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold shrink-0">Source mode only —</span>
            <span>
              This entry has {unsupportedVisualBlockTypes.join(', ')} content that Visual mode would corrupt if edited here. Editing is locked to Source mode until Visual mode supports {unsupportedVisualBlockTypes.length > 1 ? 'these block types' : 'this block type'}.
            </span>
          </div>
        )}

        <EntryRenderer
          entry={activeEntry}
          mode="edit"
          viewMode={viewMode}
          onSave={handleSave}
          onDelete={handleDelete}
          authorName={authorName || currentUser.penName}
          authorSignature={authorSignature || ''}
          authorSignatureFont={authorSignatureFont || undefined}
          authorDigitalSignature={(() => {
            if (mode === 'laboratory' && authorName) {
              return {
                id: 'sig-sandbox',
                label: 'Sandbox Signature',
                accountId: activeEntry?.authorId || '',
                type: 'typed',
                fontFamily: authorSignatureFont || 'Mrs Saint Delafield',
                typedText: authorSignature || '',
                status: 'Default',
                strokes: [],
                createdAt: new Date().toISOString()
              };
            }
            return resolveDigitalSignature(currentUser.id, identities, activeEntry);
          })()}
        />
      </div>
    );
  };

  if (!currentUser) return null;

  if (mode === 'laboratory') {
    return renderComposer();
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#111111]/10 pb-5">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-light text-[#111111] flex items-center gap-2">
            <PenTool className="w-5 h-5 text-adjung-maroon" />
            Desk
          </h2>
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#111111]/40">
            Write, edit and manage your publications.
          </p>
        </div>

        {!contextEditingEntry && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => createNewEntry('Note')}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 uppercase text-[10px] tracking-wider font-sans font-medium hover:bg-stone-100 transition cursor-pointer"
            >
              + Note
            </button>
            <button
              type="button"
              onClick={() => createNewEntry('Essay')}
              className="px-3 py-1.5 bg-stone-800 text-white uppercase text-[10px] tracking-wider font-sans font-medium hover:bg-stone-700 transition cursor-pointer"
            >
              + Essay
            </button>
          </div>
        )}
      </div>

      {activeEntry ? (
        renderComposer()
      ) : (
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Drafts & Published Lists */}
          <div className="space-y-10">

            {/* Drafts list — newest-updated first */}
            <div className="space-y-3">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/60 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Drafts</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {draftEntries.length}
                </span>
              </h3>

              {draftEntries.length === 0 ? (
                <p className="text-xs text-[#111111]/40 py-3">No pending drafts.</p>
              ) : (
                <div className="border border-stone-200 rounded overflow-hidden bg-white">
                  {draftEntries.map(draft => (
                    <div
                      key={draft.id}
                      onClick={() => contextSetEditingEntry(draft)}
                      className="grid grid-cols-[52px_1fr_68px_28px] md:grid-cols-[80px_1fr_100px_28px] items-center gap-2 md:gap-4 px-4 py-2.5 border-b border-stone-100 last:border-0 hover:bg-[#FDFDFD] cursor-pointer group transition-colors"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-adjung-maroon">
                        {draft.contentType}
                      </span>
                      <h4 title={draft.title || draft.content || 'Empty note...'} className="min-w-0">
                        <WordSafeEllipsis
                          text={draft.title || draft.content || 'Empty note...'}
                          className="font-serif text-[15px] text-[#111111] group-hover:text-adjung-maroon transition-colors"
                          format={draft.title ? (t => parseInlineFormatting(t)) : undefined}
                        />
                      </h4>
                      <span className="font-mono text-[10px] text-[#111111]/40 text-right tabular-nums">
                        {new Date(draft.updatedDate).toLocaleDateString()}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-[#111111]/40 group-hover:text-adjung-maroon justify-self-end" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published list — newest-published first */}
            <div className="space-y-3">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/60 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Published</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {publishedEntries.length}
                </span>
              </h3>

              {publishedEntries.length === 0 ? (
                <p className="text-xs text-[#111111]/40 py-3">No published records on file.</p>
              ) : (
                <div className="border border-stone-200 rounded overflow-hidden bg-white">
                  {publishedEntries.map(pub => (
                    <div
                      key={pub.id}
                      onClick={() => contextSetEditingEntry(pub)}
                      className="grid grid-cols-[52px_1fr_68px_50px] md:grid-cols-[80px_1fr_100px_50px] items-center gap-2 md:gap-4 px-4 py-2.5 border-b border-stone-100 last:border-0 hover:bg-[#FDFDFD] cursor-pointer group transition-colors"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-adjung-maroon">
                        {pub.contentType}
                      </span>
                      <h4 title={pub.title || pub.content || 'Empty note...'} className="min-w-0">
                        <WordSafeEllipsis
                          text={pub.title || pub.content || 'Empty note...'}
                          className="font-serif text-[15px] text-[#111111] group-hover:text-adjung-maroon transition-colors"
                          format={pub.title ? (t => parseInlineFormatting(t)) : undefined}
                        />
                      </h4>
                      <span className="font-mono text-[10px] text-[#111111]/40 text-right tabular-nums">
                        {pub.publishedDate ? new Date(pub.publishedDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <div className="flex items-center gap-2.5 text-stone-400 justify-self-end">
                        {pub.visibility === 'Private' ? (
                          <Lock className="w-3.5 h-3.5 text-red-600" title="Private" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-stone-400" title="Public" />
                        )}
                        <Edit3 className="w-3.5 h-3.5 group-hover:text-adjung-maroon" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
