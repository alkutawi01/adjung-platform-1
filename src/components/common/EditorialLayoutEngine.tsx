import React from 'react';
import { PublishedRepresentation, EntryLayoutVariant } from '../../types';
import { DocumentRepresentationPayload } from '../../utils/documentCompiler';

interface EditorialLayoutEngineProps {
  representation?: PublishedRepresentation;
  children?: React.ReactNode;
  className?: string;
  layoutVariant?: EntryLayoutVariant;
}

export function EditorialLayoutEngine({
  representation,
  children,
  className = '',
  layoutVariant
}: EditorialLayoutEngineProps) {
  // Legacy fallback rendering
  if (!representation || (representation.representationType !== 'note' && representation.representationType !== 'essay')) {
    return (
      <div className={`w-full relative group text-left ${className}`}>
        {children}
      </div>
    );
  }

  const payload = representation.representationData as DocumentRepresentationPayload;

  const surfaceClasses = {
    'laid-paper': 'bg-[#FDF4B3] border border-stone-200/60 rounded-lg shadow-sm',
    'deckled-white': 'bg-white border border-stone-200 rounded-lg shadow-sm'
  };

  const layoutConstraints = layoutVariant && layoutVariant !== 'penuh'
    ? 'flex flex-col h-full w-full'
    : 'w-full';

  return (
    <div className={`relative group text-left ${surfaceClasses[payload.surface]} ${layoutConstraints} ${className}`}>
      {/* 1. Header Region */}
      {payload.header && (
        <div className="shrink-0 w-full">
          <div className="w-full select-none flex items-baseline justify-between font-mono text-[9px]">
            <div className="flex-1 text-left">{payload.header.left}</div>
            <div className="flex-1 flex justify-end items-center">{payload.header.right}</div>
          </div>
          {payload.header.divider && (
            <div className="w-full border-b border-stone-200/90 mt-4" />
          )}
          <div className={payload.header.gapClass} />
        </div>
      )}

      {/* 2. Content Region */}
      <div className={`flex-grow w-full ${
        payload.content.alignment === 'center' ? 'flex flex-col items-center text-center' : 'text-left'
      } ${layoutVariant && layoutVariant !== 'penuh' ? '' : ''}`}>
        {payload.content.body}
      </div>

      {/* 3. Footer Region */}
      {payload.footer && (
        <div className="shrink-0 w-full mt-auto">
          <div className={payload.footer.gapClass} />
          {payload.footer.divider && (
            <div className="w-full border-t border-stone-200/90 mb-4" />
          )}
          <div className="w-full flex items-end justify-between select-none">
            <div className="flex-1 text-left">{payload.footer.left}</div>
            <div className="flex-1 flex justify-end">{payload.footer.right}</div>
          </div>
        </div>
      )}
    </div>
  );
}

