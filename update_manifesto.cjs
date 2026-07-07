const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div id="platform-description-block" className="manifesto-container[\s\S]*?\{\/\* Footer navigation \*\/\}/;

const replacement = `<div id="platform-description-block" className="manifesto-container max-w-6xl mx-auto pt-16 pb-36 px-4 md:px-8 text-left mt-12 border-t border-stone-200/60 space-y-20">
                  
                  {/* FASA 2: THE MANIFESTO */}
                  <div className="space-y-12 font-serif">
                    <span className="block font-sans text-[10px] uppercase tracking-[0.3em] text-[#802334] font-bold">
                      Why Adjung Exists
                    </span>
                    
                    <h3 className="text-3xl md:text-4xl lg:text-[42px] font-light text-stone-800 leading-[1.2] max-w-2xl">
                      Knowledge was never meant to compete for attention.
                    </h3>
                    
                    <div className="h-px w-24 bg-stone-200 my-10" />

                    <div className="space-y-16">
                      {paragraphs.map((p, idx) => {
                        const noteKey = \`mn-\${idx + 1}\`;
                        const noteRaw = mnData[noteKey] || '';
                        const noteParts = noteRaw.split('\\n');
                        const noteLabel = noteParts[0] || '';
                        const noteContent = noteParts.slice(1).join('\\n') || '';
                        const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v'];
                        const roman = romanNumerals[idx] || (idx + 1);

                        return (
                          <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start py-2">
                            <div className="lg:col-span-7 text-stone-700 text-[17px] md:text-[18px] leading-[1.8]">
                              {renderManifestoParagraph(p, idx)}
                            </div>
                            <div className="lg:col-span-5 lg:pl-10 text-left pt-2">
                              {noteContent && (
                                <div className="border-l border-stone-200 pl-5 space-y-1">
                                  <span className="block font-sans text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2 flex items-center gap-1.5 leading-none">
                                    <span className="text-[#802334]">({roman})</span> {noteLabel}
                                  </span>
                                  <p className="text-stone-500 italic text-[15px] leading-[1.6] font-serif">
                                    {noteContent}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footnotes */}
                    {fnData.length > 0 && (
                      <div className="pt-24 pb-8">
                        <div className="border-t border-stone-200 w-32 mb-12" />
                        <div className="space-y-10 max-w-3xl pl-4 md:pl-12">
                          {fnData.map((fn, idx) => (
                            <div key={fn.id} className="text-left flex items-start gap-5 md:gap-8 font-serif">
                              <span className="font-sans text-[#802334] font-bold text-[12px] pt-[3px] leading-none">({idx + 1})</span>
                              <div className="flex-1">
                                {fn.label && (
                                  <span className="text-stone-500 block font-sans text-[11px] uppercase tracking-widest font-bold mb-2 leading-none">
                                    {fn.label}
                                  </span>
                                )}
                                <p className="block text-stone-700 text-[16px] leading-[1.7]">{fn.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FASA 3: THE FIRST PROOF */}
                  <div className="space-y-16 pt-12 border-t border-stone-200/60">
                    <div className="space-y-2 pb-4">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-[#802334] font-bold">
                        Editorial Selections
                      </span>
                      <span className="block font-sans text-xs text-stone-400 italic">
                        Selected by the Editorial Board
                      </span>
                    </div>

                    {/* Featured Publication */}
                    {featuredEntry && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                          <div className="lg:col-span-8 space-y-4 text-left font-serif">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                                {featuredEntry.contentType}
                              </span>
                              <span className="font-mono text-[9px] text-[#802334] font-semibold uppercase tracking-wider">
                                Featured Publication
                              </span>
                            </div>
                            
                            <h4 className="text-2xl md:text-3xl font-light text-stone-900 leading-tight">
                              {featuredEntry.title}
                            </h4>
                            
                            <span className="block font-sans text-xs text-stone-500 font-medium">
                              By {users.find(u => u.id === featuredEntry.authorId)?.penName || 'Unknown Scholar'}
                            </span>
                            
                            <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                              {featuredEntry.excerpt || featuredEntry.content.replace(/<[^>]*>/g, '').slice(0, 220) + '...'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs font-mono text-stone-400 pt-2">
                              <span>{Math.max(1, Math.ceil(featuredEntry.content.split(/\\s+/).length / 200))} min read</span>
                              <span>•</span>
                              <span>
                                {featuredEntry.publishedDate 
                                   ? new Date(featuredEntry.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
                                   : ''}
                              </span>
                            </div>
                            
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEntry(featuredEntry);
                                  setActiveTab('frontpage');
                                }}
                                className="inline-block text-[#802334] hover:text-[#9c2c41] font-mono text-xs uppercase tracking-wider font-bold cursor-pointer hover:underline"
                              >
                                Read Publication →
                              </button>
                            </div>
                          </div>

                          {/* Margin note for featured entry */}
                          <div className="lg:col-span-4 lg:pl-8 text-left">
                            <div className="border-t border-stone-200/60 pt-3 mt-1 space-y-1">
                              <span className="block font-mono text-[8px] uppercase tracking-wider text-[#802334] font-semibold">
                                EDITOR'S CHOICE
                              </span>
                              <p className="text-stone-500 italic text-xs leading-relaxed font-serif">
                                Selected for its lasting value and contribution to platform research.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer navigation */}`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log('Update App.tsx successfully');
} else {
    console.log('Failed to find regex match in App.tsx');
}
