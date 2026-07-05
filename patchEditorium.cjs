const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'components', 'Editorium.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add state
const target1 = `const [featuredEntryId, setFeaturedEntryId] = useState<string>(`;
const idx1 = content.indexOf(target1);
if (idx1 === -1) {
  console.error("Could not find state target1!");
  process.exit(1);
}
// Find the closing ); of this state
const endIdx1 = content.indexOf(');', idx1);
const stateInjection = `\n  const [editorialSelectionIds, setEditorialSelectionIds] = useState<string[]>(\n    systemSettings.editorialSelectionIds || []\n  );`;
content = content.substring(0, endIdx1 + 2) + stateInjection + content.substring(endIdx1 + 2);

// 2. Add useEffect sync
const syncTarget = `if (systemSettings.featuredEntryId) setFeaturedEntryId(systemSettings.featuredEntryId);`;
const idx2 = content.indexOf(syncTarget);
if (idx2 === -1) {
  console.error("Could not find useEffect sync target!");
  process.exit(1);
}
const syncInjection = `\n    if (systemSettings.editorialSelectionIds) setEditorialSelectionIds(systemSettings.editorialSelectionIds);`;
content = content.substring(0, idx2 + syncTarget.length) + syncInjection + content.substring(idx2 + syncTarget.length);

// 3. Add to handleSaveCuration
const handleSaveCurationTarget = `const handleSaveCuration = () => {`;
const startSaveCurationIdx = content.indexOf(handleSaveCurationTarget);
if (startSaveCurationIdx === -1) {
  console.error("Could not find handleSaveCuration target!");
  process.exit(1);
}

const saveTarget = `featuredScholarId,`;
const idx3 = content.indexOf(saveTarget, startSaveCurationIdx);
if (idx3 === -1) {
  console.error("Could not find save target inside handleSaveCuration!");
  process.exit(1);
}
const nextFeaturedEntryId = content.indexOf('featuredEntryId,', idx3);
content = content.substring(0, nextFeaturedEntryId + 16) + `\n        editorialSelectionIds,` + content.substring(nextFeaturedEntryId + 16);

// 4. Add UI for Editorial Selection
const idx4 = content.indexOf(`Apex Pinned Publication of the Week`);
if (idx4 === -1) {
  console.error("Could not find UI target!");
  process.exit(1);
}
// Find the containing div start
const divStart = content.lastIndexOf('<div', idx4);

const uiInsert = `{/* Editorial Selection (8-10 works) */}
                <div className="pt-4 border-t border-stone-200">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-2">Editorial Selections (Max 10)</label>
                  
                  <div className="flex gap-2 mb-2">
                    <select
                      id="editorial-selection-add"
                      className="flex-1 border border-stone-200 p-2 rounded bg-white font-serif text-sm focus:outline-none focus:border-Adjung-maroon"
                    >
                      <option value="">-- Add an entry --</option>
                      {publishedEntries
                        .filter(e => !editorialSelectionIds.includes(e.id))
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.title || e.content.slice(0,30)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const selectEl = document.getElementById('editorial-selection-add');
                        const val = selectEl ? (selectEl as HTMLSelectElement).value : '';
                        if (val && editorialSelectionIds.length < 10) {
                          setEditorialSelectionIds([...editorialSelectionIds, val]);
                          if (selectEl) (selectEl as HTMLSelectElement).value = '';
                        }
                      }}
                      className="px-3 py-2 bg-stone-100 border border-stone-300 rounded text-xs font-mono uppercase hover:bg-stone-200 transition"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    {editorialSelectionIds.map((id, idx) => {
                      const ent = publishedEntries.find(e => e.id === id);
                      if (!ent) return null;
                      return (
                        <div key={id} className="flex items-center justify-between bg-stone-50 p-2 rounded border border-stone-200/50">
                          <span className="font-serif text-sm text-stone-800 line-clamp-1">{ent.title || ent.content.slice(0,30)}</span>
                          <button
                            type="button"
                            onClick={() => setEditorialSelectionIds(editorialSelectionIds.filter(x => x !== id))}
                            className="text-red-500 text-xs font-mono uppercase hover:underline ml-2 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <span className="text-stone-400 text-[9px] font-mono mt-2 block">Curated entries displayed on the Frontpage under "Editorial Selection". Order is preserved.</span>
                </div>

                `;

content = content.substring(0, divStart) + uiInsert + content.substring(divStart);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully patched Editorium.tsx safely.');
