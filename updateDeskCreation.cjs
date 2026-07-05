const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update handleCreateNewEntry content default
content = content.replace(
  /: 'A concise scholarly note or philosophical fragment\. Supports right-to-left formatting for Arabic or Jawi script\.';/,
  `: type === 'Notice' ? 'Official notice regarding platform operations or schedule updates.'
        : type === "Editor's Note" ? 'Official reflections from the Editorial Board regarding the structural direction of the platform.'
        : 'A concise scholarly note or philosophical fragment. Supports right-to-left formatting for Arabic or Jawi script.';`
);

// 2. Update newEntry creation in handleCreateNewEntry
content = content.replace(
  /canonicalUrl: \`https:\/\/Adjung\.com\/\$\{entrySlug\}\`,(\s*)content: defaultContent,/,
  `canonicalUrl: \`https://Adjung.com/\${entrySlug}\`,$1content: defaultContent,$1isInstitutional: type === 'Notice' || type === "Editor's Note",`
);

// 3. Inject new buttons in Desk
const buttonsRegex = /(<button[\s\S]*?onClick=\{\(\) => handleCreateNewEntry\('Article'\)\}[\s\S]*?<\/button>)/;
const newButtons = `$1
                    {(currentUser.role === 'Chief Editor' || currentUser.role === 'Editor') && (
                      <>
                        <div className="w-px h-6 bg-stone-300 mx-1 self-center" />
                        <button
                          type="button"
                          onClick={() => handleCreateNewEntry('Notice')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-stone-300 hover:bg-stone-100 text-stone-700 rounded text-xs font-mono tracking-wider uppercase transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Notice
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateNewEntry("Editor's Note")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FDFDFD] border border-stone-300 hover:bg-stone-100 text-stone-700 rounded text-xs font-mono tracking-wider uppercase transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ed. Note
                        </button>
                      </>
                    )}`;

content = content.replace(buttonsRegex, newButtons);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated Desk for Institutional publication creation.');
