import { Entry, PublicationRepresentation, PublicationLayer } from '../types';

export function compilePublication(
  entries: Entry[],
  template: 'focus' | 'magazine' | 'journal' | 'compact' | 'channel'
): PublicationRepresentation {
  const sorted = [...entries].sort((a, b) => {
    const da = new Date(a.publishedDate || a.createdDate).getTime();
    const db = new Date(b.publishedDate || b.createdDate).getTime();
    return db - da;
  });

  const layers: PublicationLayer[] = [];
  let index = 0;
  let layerCounter = 1;

  const nextId = () => `layer-${layerCounter++}`;

  if (template === 'focus') {
    const essaysAndArticles = sorted.filter(e => e.contentType === 'Essay' || e.contentType === 'Article');
    const notes = sorted.filter(e => e.contentType === 'Note');
    const others = sorted.filter(e => e.contentType !== 'Essay' && e.contentType !== 'Article' && e.contentType !== 'Note');
    
    // 1. Add all essays/articles as single-column layers
    essaysAndArticles.forEach(item => {
      layers.push({
        id: nextId(),
        layout: 'single-column',
        gaps: { top: 'pt-8', bottom: 'pb-8', between: 'gap-0' },
        divider: 'dashed-rule',
        entries: [{ id: item.id, span: 1 }]
      });
    });
    
    // 2. Add notes (pair narrow ones, render wide ones full width)
    let noteIdx = 0;
    while (noteIdx < notes.length) {
      const firstNote = notes[noteIdx++];
      const firstVar = firstNote.layoutVariant || 'melintang';
      if (firstVar === 'melintang' || firstVar === 'penuh') {
        layers.push({
          id: nextId(),
          layout: 'single-column',
          gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-0' },
          divider: 'none',
          entries: [{ id: firstNote.id, span: 1 }]
        });
      } else {
        // Narrow note (kompak or menegak), try to pair with another narrow note
        if (noteIdx < notes.length && notes[noteIdx].layoutVariant !== 'melintang' && notes[noteIdx].layoutVariant !== 'penuh') {
          const secondNote = notes[noteIdx++];
          layers.push({
            id: nextId(),
            layout: 'two-column',
            gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-6' },
            divider: 'none',
            entries: [
              { id: firstNote.id, span: 1 },
              { id: secondNote.id, span: 1 }
            ]
          });
        } else {
          layers.push({
            id: nextId(),
            layout: 'single-column',
            gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-0' },
            divider: 'none',
            entries: [{ id: firstNote.id, span: 1 }]
          });
        }
      }
    }
    
    // 3. Add other item types
    others.forEach(item => {
      layers.push({
        id: nextId(),
        layout: 'single-column',
        gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-0' },
        divider: 'dashed-rule',
        entries: [{ id: item.id, span: 1 }]
      });
    });
  } else if (template === 'magazine') {
    while (index < sorted.length) {
      const step = layers.length % 3;
      if (step === 0 && index < sorted.length) {
        const essayIdx = sorted.findIndex((e, i) => i >= index && (e.contentType === 'Essay' || e.contentType === 'Article'));
        const noteIdx = sorted.findIndex((e, i) => i >= index && e.contentType === 'Note');
        if (essayIdx !== -1 && noteIdx !== -1) {
          const firstIdx = Math.min(essayIdx, noteIdx);
          const secondIdx = Math.max(essayIdx, noteIdx);
          const [second] = sorted.splice(secondIdx, 1);
          const [first] = sorted.splice(firstIdx, 1);
          layers.push({
            id: nextId(),
            layout: 'asymmetric-split',
            gaps: { top: 'pt-8', bottom: 'pb-8', between: 'gap-8' },
            divider: 'horizontal-rule',
            entries: [
              { id: first.id, span: 2 },
              { id: second.id, span: 1 }
            ]
          });
        } else {
          const count = Math.min(2, sorted.length - index);
          const chunk = sorted.slice(index, index + count);
          index += count;
          layers.push({
            id: nextId(),
            layout: chunk.length === 2 ? 'two-column' : 'single-column',
            gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-6' },
            divider: 'dashed-rule',
            entries: chunk.map(c => ({ id: c.id, span: 1 }))
          });
        }
      } else if (step === 1 && index < sorted.length) {
        const item = sorted[index++];
        layers.push({
          id: nextId(),
          layout: 'single-column',
          gaps: { top: 'pt-10', bottom: 'pb-10', between: 'gap-0' },
          divider: 'horizontal-rule',
          entries: [{ id: item.id, span: 1 }]
        });
      } else {
        const count = Math.min(2, sorted.length - index);
        const chunk = sorted.slice(index, index + count);
        index += count;
        layers.push({
          id: nextId(),
          layout: chunk.length === 2 ? 'two-column' : 'single-column',
          gaps: { top: 'pt-6', bottom: 'pb-6', between: 'gap-6' },
          divider: 'none',
          entries: chunk.map(c => ({ id: c.id, span: 1 }))
        });
      }
    }
  } else if (template === 'journal') {
    while (index < sorted.length) {
      const item = sorted[index++];
      layers.push({
        id: nextId(),
        layout: 'single-column',
        gaps: { top: 'pt-8', bottom: 'pb-8', between: 'gap-0' },
        divider: 'horizontal-rule',
        entries: [{ id: item.id, span: 1 }]
      });
    }
  } else if (template === 'compact') {
    while (index < sorted.length) {
      const count = Math.min(3, sorted.length - index);
      const chunk = sorted.slice(index, index + count);
      index += count;
      layers.push({
        id: nextId(),
        layout: chunk.length === 3 ? 'three-column' : chunk.length === 2 ? 'two-column' : 'single-column',
        gaps: { top: 'pt-4', bottom: 'pb-4', between: 'gap-4' },
        divider: 'none',
        entries: chunk.map(c => ({ id: c.id, span: 1 }))
      });
    }
  } else {
    while (index < sorted.length) {
      const item = sorted[index++];
      layers.push({
        id: nextId(),
        layout: 'single-column',
        gaps: { top: 'pt-4', bottom: 'pb-4', between: 'gap-0' },
        divider: 'dashed-rule',
        entries: [{ id: item.id, span: 1 }]
      });
    }
  }

  return {
    id: `pub-rep-${template}-${Date.now()}`,
    template,
    layers,
    metadata: {
      compiledAt: new Date().toISOString(),
      sourceTemplate: `${template.toUpperCase()} Template`
    }
  };
}
