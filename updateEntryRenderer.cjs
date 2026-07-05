const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'components', 'EntryRenderer.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const oldTopBlock = `<div className="mt-4 flex items-center gap-4 text-xs font-serif text-stone-600">
              <span className="font-mono text-\\[9px\\] uppercase tracking-widest text-stone-400">Published by<\\/span>
              <div className="flex items-center gap-1\\.5 h-10">
                <span className="font-sans font-medium text-stone-900 border-b border-stone-200 pb-0\\.5 mt-2">\\{authorName\\}<\\/span>
              <\\/div>
          <\\/div>`;

const newTopBlock = `{entry.isInstitutional ? (
              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-b border-stone-200 py-3 text-xs font-serif text-stone-600">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-[#802334] rounded-full"></span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[#802334]">Adjung Editorial Board</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400">
                  {entry.contentType === 'Notice' ? 'Official Notice' : 'Editorial Note'}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-4 text-xs font-serif text-stone-600">
                <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Published by</span>
                <div className="flex items-center gap-1.5 h-10">
                  <span className="font-sans font-medium text-stone-900 border-b border-stone-200 pb-0.5 mt-2">{authorName}</span>
                </div>
              </div>
            )}`;

content = content.replace(new RegExp(oldTopBlock, 'g'), newTopBlock);


const oldBottomBlockRegex = /\{\/\* Signature Closure \*\/\}\s*\{status === 'Published' && \(/;
const newBottomBlock = `{/* Signature Closure */}
        {status === 'Published' && entry.isInstitutional && (
          <div className="mt-16 pt-12 border-t border-stone-200 flex flex-col items-center justify-center relative pb-8 text-center animate-fade-in">
             <span className="w-2 h-2 bg-[#802334] rotate-45 mb-4"></span>
             <div className="font-serif text-stone-900 tracking-wide text-lg">Adjung Editorial Board</div>
             <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mt-2">
                Published {formatDate(entry.publishedDate || new Date().toISOString())}
             </div>
          </div>
        )}
        {status === 'Published' && !entry.isInstitutional && (`;

content = content.replace(oldBottomBlockRegex, newBottomBlock);


fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated EntryRenderer for Institutional publications.');
