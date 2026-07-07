with open("src/App.tsx", "r") as f:
    content = f.read()

target = "<PhilosophyCarousel />            </motion.div>"
replacement = """<PhilosophyCarousel />
            </motion.div>

            {/* FASA 1.5: FEATURED ENTRY HERO */}
            {(() => {
              const featuredEntry = entries.find(e => e.id === systemSettings.featuredEntryId && e.status === 'Published');
              if (!featuredEntry) return null;
              return (
                <div className="py-12 text-center group cursor-pointer max-w-3xl mx-auto" onClick={() => {
                  setSelectedEntry(featuredEntry);
                  setSelectedAuthorId(featuredEntry.authorId);
                  setActiveTab('folio');
                }}>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-12 bg-stone-200"></div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#802334] font-bold">Featured Entry</span>
                    <div className="h-px w-12 bg-stone-200"></div>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 leading-tight mb-6 group-hover:text-[#802334] transition-colors px-4">
                    {parseInlineFormatting(featuredEntry.title)}
                  </h2>
                  <p className="font-serif text-stone-500 italic max-w-2xl mx-auto leading-relaxed">
                    {featuredEntry.excerpt || featuredEntry.content.substring(0, 200) + '...'}
                  </p>
                </div>
              );
            })()}"""

content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
