const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'db', 'mockDb.ts');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  /export const INITIAL_SYSTEM_SETTINGS: SystemSettings = \{([\s\S]*?)allowSelfRegistration: false,/,
  `export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {$1allowSelfRegistration: false,\n  editorialSelectionIds: ['entry-1', 'entry-2', 'entry-3'],`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated mockDb with editorialSelectionIds.');
