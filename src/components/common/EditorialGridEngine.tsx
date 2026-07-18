import React from 'react';
import { PublicationRepresentation } from '../../types';

interface EditorialGridEngineProps {
  representation: PublicationRepresentation;
  renderEntry: (id: string) => React.ReactNode;
}

export function EditorialGridEngine({
  representation,
  renderEntry
}: EditorialGridEngineProps) {
  return (
    <div className="w-full">
      {representation.layers.map((layer) => {
        const layoutClasses = {
          'single-column': 'grid grid-cols-1',
          'two-column': 'grid grid-cols-1 md:grid-cols-2',
          'three-column': 'grid grid-cols-1 md:grid-cols-3',
          'asymmetric-split': 'grid grid-cols-1 md:grid-cols-3'
        };

        return (
          <div key={layer.id} className="w-full relative">
            <div className={`${layoutClasses[layer.layout]} ${layer.gaps.between} ${layer.gaps.top} ${layer.gaps.bottom}`}>
              {layer.entries.map((ent) => {
                const spanClass = layer.layout === 'asymmetric-split'
                  ? (ent.span === 2 ? 'md:col-span-2' : 'md:col-span-1')
                  : '';

                return (
                  <div key={ent.id} className={`${spanClass} w-full h-full flex flex-col`}>
                    {renderEntry(ent.id)}
                  </div>
                );
              })}
            </div>
            {layer.divider && layer.divider !== 'none' && (
              <div className={`w-full ${
                layer.divider === 'horizontal-rule' 
                  ? 'border-b border-stone-200/90' 
                  : 'border-b border-dashed border-stone-200/90'
              } mt-4`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
