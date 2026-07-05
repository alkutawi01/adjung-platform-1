const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Exclude from authorPublishedEntries (Folio Timeline)
content = content.replace(
  /const authorPublishedEntries = selectedAuthorId \? entries\.filter\(e => e\.authorId === selectedAuthorId && e\.status === 'Published' && e\.visibility === 'Public'\) : \[\];/,
  "const authorPublishedEntries = selectedAuthorId ? entries.filter(e => e.authorId === selectedAuthorId && e.status === 'Published' && e.visibility === 'Public' && !e.isInstitutional) : [];"
);

// 2. Exclude from Directory Pub count
content = content.replace(
  /const pubCount = entries\.filter\(e => e\.authorId === u\.id && e\.status === 'Published'\)\.length;/,
  "const pubCount = entries.filter(e => e.authorId === u.id && e.status === 'Published' && !e.isInstitutional).length;"
);

// Also exclude from desk "Published" counts if we want, but let's keep it in Desk so the Editor can manage them.
// Wait, the specification says: "Notice and Editor's Note are institutional publications... do NOT appear in personal timelines. do NOT belong to individual authors."
// It might be confusing if the Chief Editor's desk shows them as personal publications. 
// However, right now the Editorium doesn't have an "Institutional" tab for managing these, so they HAVE to be managed via the Desk.
// So keeping them in the Desk is necessary for now.

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully excluded Institutional entries from Folio and Directory.');
