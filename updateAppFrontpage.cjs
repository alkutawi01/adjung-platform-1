const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Frontpage Notice Logic
const noticeBlock = `
              {/* Institutional Notice (Pinned) */}
              {(() => {
                const notice = entries.find(e => e.contentType === 'Notice' && e.status === 'Published' && e.isPinned);
                if (!notice) return null;
                return (
                  <div className="px-5 py-4 bg-stone-50/80 border border-[#802334]/20 rounded-sm flex flex-col md:flex-row items-start gap-4 text-left animate-fade-in shadow-sm">
                    <span className="font-mono text-[9px] text-[#802334] font-bold uppercase tracking-widest bg-[#802334]/5 border border-[#802334]/20 px-2 py-1 rounded-sm flex-shrink-0">
                      Notice
                    </span>
                    <div className="font-sans text-sm text-stone-700 leading-relaxed flex-1">
                      <strong className="block font-serif text-base text-[#802334] mb-1">{notice.title}</strong>
                      <p>{notice.excerpt || notice.content.substring(0, 150) + '...'}</p>
                      <button 
                        onClick={() => {
                          setSelectedEntry(notice);
                          setActiveTab('institutional-view');
                        }}
                        className="mt-2 text-xs font-mono uppercase tracking-wider text-[#802334] hover:underline font-semibold"
                      >
                        Read Full Notice →
                      </button>
                    </div>
                  </div>
                );
              })()}
`;

content = content.replace(
  /\{systemSettings\.announcementBanner &&.*?\{systemSettings\.announcementBanner\}.*?<\/div>.*?<\/div>\s*\)\}/s,
  noticeBlock
);

// 2. Editor's Note Excerpt logic
const editorialBlock = `
              {/* Editor's Note Excerpt */}
              {(() => {
                const edNote = entries.find(e => e.contentType === "Editor's Note" && e.status === 'Published' && e.isPinned);
                if (!edNote) return null;
                return (
                  <div className="border-t border-b border-stone-200 py-8 text-center animate-fade-in">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#802334] font-semibold mb-3">
                      From the Editorial Board
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl font-light text-stone-900 mb-4">{edNote.title}</h3>
                    <p className="font-serif text-stone-600 italic max-w-2xl mx-auto leading-relaxed mb-6">
                      {edNote.excerpt || edNote.content.substring(0, 250) + '...'}
                    </p>
                    <button 
                      onClick={() => {
                        setSelectedEntry(edNote);
                        setActiveTab('institutional-view');
                      }}
                      className="px-6 py-2 border border-stone-300 hover:border-[#802334] text-stone-700 hover:text-[#802334] font-mono text-[10px] uppercase tracking-widest transition"
                    >
                      Continue Reading →
                    </button>
                  </div>
                );
              })()}
`;

// Insert Editor's Note right after Featured Entry
content = content.replace(
  /(<h3 className="font-mono text-\[10px\] uppercase tracking-\[0\.25em\] text-stone-400 mb-6 font-bold">[\s\S]*?Latest Entries[\s\S]*?<\/h3>)/,
  editorialBlock + '\n\n                $1'
);

// 3. New Tabs rendering
const newTabs = `
        {activeTab === 'institutional-view' && selectedEntry && (
          <div className="py-12">
            <EntryRenderer 
              entry={selectedEntry} 
              onClose={() => setActiveTab('frontpage')} 
              author={users.find(u => u.id === selectedEntry.authorId)}
              systemSettings={systemSettings}
            />
          </div>
        )}
`;

content = content.replace(
  /\{activeTab === 'editorium' && currentUser && hasPermission\('curateFrontpage'\) && \(/,
  newTabs + '\n        {activeTab === \'editorium\' && currentUser && hasPermission(\'curateFrontpage\') && ('
);

// 4. Update Footer
const newFooter = `
     <footer className="w-full mt-12 pt-12 pb-8 border-t border-[#EAE8E3] bg-stone-50 select-none">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h1 className="font-serif text-2xl font-semibold tracking-wider text-[#802334]">{BRAND.logoText}</h1>
            <p className="font-serif italic text-stone-600 text-sm max-w-sm">"{systemSettings.editorialPolicy}"</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Institutional Publications</h4>
            <ul className="space-y-2 font-sans text-sm text-stone-600">
              <li><button onClick={() => { setActiveTab('editorials'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editorial Notes</button></li>
              <li><button onClick={() => { setActiveTab('notices'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Notice Board</button></li>
              <li><span className="hover:text-[#802334] transition cursor-pointer">Publishing Policy</span></li>
              <li><span className="hover:text-[#802334] transition cursor-pointer">Version History</span></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Network</h4>
            <ul className="space-y-2 font-sans text-sm text-stone-600">
              <li><button onClick={() => { setActiveTab('directory'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editorial Board</button></li>
              <li><button onClick={() => { setActiveTab('index'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Scholarly Index</button></li>
              <li><span className="hover:text-[#802334] transition cursor-pointer">About Adjung</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono uppercase tracking-widest text-[9px] text-stone-400">{BRAND.copyright}</p>
          <div className="flex gap-4">
            <span className="font-mono text-[9px] text-stone-400 uppercase">ISSN 1234-5678</span>
          </div>
        </div>
      </footer>
`;

content = content.replace(
  /<footer className="w-full mt-12 pt-8 pb-0 border-t border-\[#EAE8E3\].*?<\/footer>/s,
  newFooter
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated Frontpage, Footer, and routing renderers.');
