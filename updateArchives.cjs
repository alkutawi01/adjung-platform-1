const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const archivesRender = `
        {/* ==================== INSTITUTIONAL ARCHIVES ==================== */}
        {activeTab === 'notices' && (
          <div className="max-w-4xl mx-auto py-12 px-4 select-none animate-fade-in min-h-screen">
            <div className="space-y-2 border-b border-stone-200 pb-6 mb-8 text-center">
              <h2 className="font-serif text-3xl font-light text-stone-900">Notice Board</h2>
              <p className="font-sans text-sm text-stone-500">Official announcements and operational notices from the Adjung Editorial Board.</p>
            </div>
            
            <div className="space-y-6">
              {entries
                .filter(e => e.contentType === 'Notice' && e.status === 'Published')
                .sort((a, b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())
                .map(notice => (
                  <div key={notice.id} className="p-6 bg-white border border-stone-200 rounded-sm hover:border-[#802334]/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#802334] bg-[#802334]/5 px-2 py-1 rounded-sm font-bold">
                        {notice.priority === 'High' ? 'High Priority Notice' : 'Notice'}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">
                        {new Date(notice.publishedDate || notice.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-medium text-stone-900 mb-2 hover:text-[#802334] cursor-pointer transition"
                        onClick={() => { setSelectedEntry(notice); setActiveTab('institutional-view'); }}>
                      {notice.title}
                    </h3>
                    <p className="font-sans text-sm text-stone-600 line-clamp-2 leading-relaxed">
                      {notice.excerpt || notice.content}
                    </p>
                  </div>
                ))}
                
              {entries.filter(e => e.contentType === 'Notice' && e.status === 'Published').length === 0 && (
                <div className="text-center py-12 text-stone-400 font-serif italic">
                  There are no notices published at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'editorials' && (
          <div className="max-w-4xl mx-auto py-12 px-4 select-none animate-fade-in min-h-screen">
            <div className="space-y-2 border-b border-stone-200 pb-6 mb-12 text-center">
              <h2 className="font-serif text-3xl font-light text-stone-900">Editorial Notes</h2>
              <p className="font-sans text-sm text-stone-500">Philosophical reflections, structural decisions, and the evolving direction of the archive.</p>
            </div>
            
            <div className="space-y-12">
              {entries
                .filter(e => e.contentType === "Editor's Note" && e.status === 'Published')
                .sort((a, b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())
                .map(ed => (
                  <div key={ed.id} className="group border-b border-stone-100 pb-12 last:border-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px w-8 bg-stone-300"></div>
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                        {ed.editorialCategory || 'Editorial Philosophy'}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl font-normal text-stone-900 mb-4 group-hover:text-[#802334] cursor-pointer transition leading-tight"
                        onClick={() => { setSelectedEntry(ed); setActiveTab('institutional-view'); }}>
                      {ed.title}
                    </h3>
                    <p className="font-serif italic text-stone-600 leading-relaxed mb-6">
                      {ed.excerpt || ed.content.substring(0, 300) + '...'}
                    </p>
                    <button 
                      onClick={() => { setSelectedEntry(ed); setActiveTab('institutional-view'); }}
                      className="font-mono text-[10px] uppercase tracking-widest text-stone-500 hover:text-[#802334] transition flex items-center gap-2 font-semibold"
                    >
                      Read Note <span>→</span>
                    </button>
                  </div>
                ))}
                
              {entries.filter(e => e.contentType === "Editor's Note" && e.status === 'Published').length === 0 && (
                <div className="text-center py-12 text-stone-400 font-serif italic">
                  There are no editorial notes published at this time.
                </div>
              )}
            </div>
          </div>
        )}
`;

content = content.replace(
  /(\{activeTab === 'institutional-view' && selectedEntry && \([\s\S]*?<\/div>\s*\)\})/,
  '$1\n' + archivesRender
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully injected Archives for Notices and Editorials.');
