const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'types.ts');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  /export interface Entry \{[\s\S]*?isInstitutional\?: boolean;\s*\}/g,
  (match) => {
    return match.replace(/isInstitutional\?: boolean;\s*\}/, "isInstitutional?: boolean;\n  discipline?: string;\n}");
  }
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated Entry with discipline.');
