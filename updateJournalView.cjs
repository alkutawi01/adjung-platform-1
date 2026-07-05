const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const journalBlock = `
        {/* ACTIVE MODULE 3.5: JOURNAL (By discipline) */}
        {activeTab === 'journal' && (
          <div className="max-w-6xl mx-auto space-y-16 py-12 px-4 select-none animate-fade-in min-h-[70vh]">
            <div className="space-y-4 border-b border-stone-200 pb-8 text-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400">Scholarly Index</span>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-stone-900">Journal</h2>
              <p className="font-sans text-sm text-stone-500 max-w-2xl mx-auto">
                An organized repository of all published scholarly works, categorized by their primary discipline and field of study.
              </p>
            </div>
            
            <div className="space-y-24">
              {(() => {
                const scholarlyEntries = entries.filter(e => e.status === 'Published' && !e.isInstitutional);
                const grouped = {};
                
                scholarlyEntries.forEach(e => {
                  const discipline = e.discipline || (e.tags && e.tags.length > 0 ? e.tags[0] : 'Uncategorized');
                  if (!grouped[discipline]) grouped[discipline] = [];
                  grouped[discipline].push(e);
                });
                
                const disciplines = Object.keys(grouped).sort();
                
                if (disciplines.length === 0) {
                  return <div className="text-center italic text-stone-400 font-serif">No journal entries published yet.</div>;
                }
                
                return disciplines.map(disc => (
                  <div key={disc} className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h3 className="font-serif text-2xl text-stone-800">{disc}</h3>
                      <div className="h-px w-full bg-stone-200 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {grouped[disc].map(item => {
                        const author = users.find(u => u.id === item.authorId);
                        return (
                          <div 
                            key={item.id} 
                            className="group cursor-pointer border border-stone-100 hover:border-stone-300 p-6 rounded-sm bg-white shadow-sm hover:shadow transition flex flex-col"
                            onClick={() => {
                              setSelectedEntry(item);
                              setSelectedAuthorId(item.authorId);
                              setActiveTab('folio');
                            }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#802334] bg-[#802334]/5 border border-[#802334]/10 px-2 py-1 rounded-sm">
                                {item.contentType}
                              </span>
                              <span className="font-mono text-[9px] text-stone-400">
                                {new Date(item.publishedDate || item.createdDate).getFullYear()}
                              </span>
                            </div>
                            <h4 className="font-serif text-lg font-medium text-stone-900 group-hover:text-[#802334] transition line-clamp-2 leading-tight mb-3">
                              {item.title || item.content.slice(0, 40) + '...'}
                            </h4>
                            <div className="mt-auto pt-4 border-t border-stone-100">
                              <span className="font-sans text-[11px] text-stone-600 font-medium">
                                {author?.penName || 'Scholar'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ACTIVE MODULE 4: INDEX (Editor/Admin only dynamically generated published entries list) */}`;

content = content.replace(
  /\{\/\* ACTIVE MODULE 4: INDEX \(Editor\/Admin only dynamically generated published entries list\) \*\/\}/,
  journalBlock
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully injected Journal View.');
