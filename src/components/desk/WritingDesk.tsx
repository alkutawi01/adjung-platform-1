import React, { useState, useEffect, useRef } from 'react';
import { PenTool, ChevronLeft, Edit3, Lock, Globe } from 'lucide-react';
import { Entry, User, EntryType } from '../../types';
import { EntryRenderer } from '../rendering/EntryRenderer';
import { parseInlineFormatting, stripMarkdown, getVisualModeUnsupportedBlockTypes } from '../../utils';
import { useAppContext } from '../../context/AppContext';
import { resolveDigitalSignature } from '../../utils/signatureResolvers';

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
          authorSignature={authorSignature || currentUser.signature}
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
            
            {/* Drafts list */}
            <div className="space-y-4">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/60 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Drafts</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {entries.filter(e => {
                    const isOwner = e.authorId === currentUser.id;
                    const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                    return (isOwner || isInst) && e.status === 'Draft';
                  }).length}
                </span>
              </h3>

              {entries.filter(e => {
                const isOwner = e.authorId === currentUser.id;
                const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                return (isOwner || isInst) && e.status === 'Draft';
              }).length === 0 ? (
                <p className="text-xs text-[#111111]/40 italic py-3">No pending drafts. Your mind is quiet.</p>
              ) : (
                <div className="space-y-3">
                  {entries.filter(e => {
                    const isOwner = e.authorId === currentUser.id;
                    const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                    return (isOwner || isInst) && e.status === 'Draft';
                  }).map(draft => (
                    <div
                      key={draft.id}
                      onClick={() => contextSetEditingEntry(draft)}
                      className="bg-white hover:bg-[#FDFDFD] border border-stone-200 p-4 rounded flex items-center justify-between cursor-pointer group transition-colors shadow-sm"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#111111]/40">
                          <span className="text-adjung-maroon font-semibold">{draft.contentType}</span>
                          <span>•</span>
                          <span>Updated {new Date(draft.updatedDate).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-[#111111] text-base group-hover:text-adjung-maroon transition-colors text-left">
                          {parseInlineFormatting(draft.title)}
                        </h4>
                      </div>
                      <Edit3 className="w-4 h-4 text-[#111111]/40 group-hover:text-adjung-maroon flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published list */}
            <div className="space-y-4">
              <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[#111111]/60 flex items-center justify-between border-b border-[#111111]/10 pb-2">
                <span>Published</span>
                <span className="bg-[#111111]/5 text-[#111111] px-2 py-0.5 rounded text-[10px]">
                  {entries.filter(e => {
                    const isOwner = e.authorId === currentUser.id;
                    const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                    return (isOwner || isInst) && e.status === 'Published';
                  }).length}
                </span>
              </h3>

              {entries.filter(e => {
                const isOwner = e.authorId === currentUser.id;
                const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                return (isOwner || isInst) && e.status === 'Published';
              }).length === 0 ? (
                <p className="text-xs text-[#111111]/40 italic py-3">No published records on file.</p>
              ) : (
                <div className="space-y-3">
                  {entries.filter(e => {
                    const isOwner = e.authorId === currentUser.id;
                    const isInst = e.publicationClass === 'Institutional' && (currentUser.role === 'Chief Editor' || currentUser.role === 'Editor');
                    return (isOwner || isInst) && e.status === 'Published';
                  }).map(pub => (
                    <div 
                      key={pub.id} 
                      onClick={() => contextSetEditingEntry(pub)}
                      className="bg-white hover:bg-[#FDFDFD] border border-stone-200 p-4 rounded flex items-center justify-between cursor-pointer group transition-colors shadow-sm"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#111111]/40">
                          <span className="text-adjung-maroon font-semibold">{pub.contentType}</span>
                          <span>•</span>
                          <span>Published {pub.publishedDate ? new Date(pub.publishedDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <h4 className="font-serif font-semibold text-[#111111] text-base group-hover:text-adjung-maroon transition-colors text-left">
                          {parseInlineFormatting(pub.title)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-stone-400 flex-shrink-0">
                        {pub.visibility === 'Private' ? (
                          <Lock className="w-3.5 h-3.5 text-red-600" title="Private" />
                        ) : (
                          <Globe className="w-3.5 h-3.5 text-stone-400" title="Public" />
                        )}
                        <Edit3 className="w-4 h-4 group-hover:text-adjung-maroon" />
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
