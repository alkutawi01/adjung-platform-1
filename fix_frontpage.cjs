const fs = require('fs');
const appPath = './src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const frontpageRegex = /\{\/\* ACTIVE MODULE 0B: CURATED FRONTPAGE[\s\S]*?\}\)\(\)\}/;

const newFrontpageBlock = `{/* ACTIVE MODULE 0B: CURATED FRONTPAGE (Platform public index of publications & scholars) */}
        {activeTab === 'frontpage' && !selectedEntry && (() => {
          const featuredEntry = entries.find(e => e.id === systemSettings.featuredEntryId && e.status === 'Published');
          
          const notice = entries
            .filter(e => e.contentType === 'Notice' && e.status === 'Published')
            .sort((a, b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())[0];
            
          const editorNote = entries
            .filter(e => e.contentType === "Editor's Note" && e.status === 'Published')
            .sort((a, b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())[0];
            
          const editorialSelections = entries.filter(e => systemSettings.editorialSelectionIds?.includes(e.id) && e.status === 'Published');
          
          const latestEntries = entries
            .filter(e => e.status === 'Published' && !e.isInstitutional && e.id !== featuredEntry?.id)
            .sort((a, b) => new Date(b.publishedDate || b.createdDate).getTime() - new Date(a.publishedDate || a.createdDate).getTime())
            .slice(0, 10);
            
          const currentLatestEntry = latestEntries.length > 0 ? latestEntries[frontpageCarouselIndex % latestEntries.length] : null;

          return (
            <div className="max-w-4xl mx-auto select-none animate-fade-in space-y-24 py-16 px-4">
              
              {/* 1. Logo / Identiti Adjung */}
              <div className="text-center pt-8">
                <h1 className="font-serif text-5xl md:text-6xl font-light text-[#802334] tracking-tight mb-4">{BRAND.logoText}</h1>
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-[0.3em]">{BRAND.tagline}</span>
              </div>

              {/* Institutional Notice */}
              {notice && (
                <div className="px-5 py-4 bg-stone-50/80 border border-[#802334]/20 rounded-sm flex flex-col md:flex-row items-start gap-4 text-left shadow-sm hover:bg-[#802334]/5 transition-colors cursor-pointer group" onClick={() => {
                  setSelectedEntry(notice);
                  setActiveTab('notices');
                }}>
                  <span className="font-mono text-[9px] text-[#802334] font-bold uppercase tracking-widest bg-[#802334]/5 border border-[#802334]/20 px-2 py-1 rounded-sm flex-shrink-0">
                    Notice
                  </span>
                  <div className="font-sans text-sm text-stone-700 leading-relaxed flex-1">
                    <strong className="block font-serif text-base text-[#802334] mb-1 group-hover:underline">{notice.title}</strong>
                    <p className="line-clamp-2">{notice.excerpt || notice.content.substring(0, 150) + '...'}</p>
                  </div>
                </div>
              )}

              {/* 2. Featured Entry */}
              {featuredEntry && (
                <div className="text-center group cursor-pointer" onClick={() => {
                  setSelectedEntry(featuredEntry);
                  setSelectedAuthorId(featuredEntry.authorId);
                  setActiveTab('folio');
                }}>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-12 bg-stone-200"></div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#802334] font-bold">Featured Entry</span>
                    <div className="h-px w-12 bg-stone-200"></div>
                  </div>
                  <h2 className="font-serif text-3xl md:text-5xl font-light text-stone-900 leading-tight mb-6 group-hover:text-[#802334] transition-colors px-4">
                    {parseInlineFormatting(featuredEntry.title)}
                  </h2>
                  <p className="font-serif text-stone-500 italic max-w-2xl mx-auto leading-relaxed">
                    {featuredEntry.excerpt || featuredEntry.content.substring(0, 200) + '...'}
                  </p>
                </div>
              )}

              {/* 3. Editor's Note */}
              {editorNote && (
                <div className="border-t border-b border-stone-200 py-12 text-center animate-fade-in group cursor-pointer" onClick={() => {
                  setSelectedEntry(editorNote);
                  setActiveTab('editorial');
                }}>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-[#802334] font-semibold mb-3">
                    From the Editorial Board
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl font-light text-stone-900 mb-4 group-hover:text-[#802334] transition">
                    {parseInlineFormatting(editorNote.title)}
                  </h3>
                  <p className="font-serif text-stone-600 italic max-w-2xl mx-auto leading-relaxed line-clamp-3">
                    {editorNote.excerpt || editorNote.content.substring(0, 250) + '...'}
                  </p>
                  <span className="inline-block mt-6 text-[#802334] group-hover:underline font-mono text-[10px] uppercase tracking-wider font-semibold">
                    Continue Reading →
                  </span>
                </div>
              )}

              {/* 4. Editorial Selection */}
              {editorialSelections.length > 0 && (
                <div className="pt-8">
                  <div className="flex items-center gap-4 mb-12">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 flex-shrink-0">Editorial Selection</span>
                    <div className="h-px w-full bg-stone-100"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    {editorialSelections.map(item => {
                      const author = users.find(u => u.id === item.authorId);
                      return (
                        <div key={item.id} className="group cursor-pointer text-left" onClick={() => {
                          setSelectedEntry(item);
                          setSelectedAuthorId(item.authorId);
                          setActiveTab('folio');
                        }}>
                          <span className="block font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-2">{item.contentType}</span>
                          <h4 className="font-serif text-xl text-stone-900 group-hover:text-[#802334] transition leading-tight mb-2">
                            {parseInlineFormatting(item.title)}
                          </h4>
                          <span className="font-sans text-[11px] text-stone-500">{author?.penName || 'Writer'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 5. Latest Entries (Auto-Rotate) */}
              {currentLatestEntry && (
                <div className="bg-stone-50/50 border border-stone-200/50 p-12 text-center rounded-sm">
                  <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-8">Latest Transmissions</span>
                  <div className="h-24 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentLatestEntry.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.5 }}
                        className="cursor-pointer group"
                        onClick={() => {
                          setSelectedEntry(currentLatestEntry);
                          setSelectedAuthorId(currentLatestEntry.authorId);
                          setActiveTab('folio');
                        }}
                      >
                        <h4 className="font-serif text-2xl text-stone-900 group-hover:text-[#802334] transition mb-3">
                          {parseInlineFormatting(currentLatestEntry.title)}
                        </h4>
                        <div className="flex items-center justify-center gap-3">
                          <span className="font-sans text-[11px] text-stone-500">
                            {users.find(u => u.id === currentLatestEntry.authorId)?.penName || 'Writer'}
                          </span>
                          <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">{currentLatestEntry.contentType}</span>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          );
        })()}`;

content = content.replace(frontpageRegex, newFrontpageBlock);
fs.writeFileSync(appPath, content, 'utf8');
console.log('Frontpage layout correctly updated to avoid double-rendering and safely handle notice visibility.');
