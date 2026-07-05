const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Remove the Journal button from the primary public nav
content = content.replace(
  /if \(true\) \{\s*items\.push\(\{\s*id: 'journal',[\s\S]*?isActive: activeTab === 'journal'\s*\}\);\s*\}/,
  ""
);

// Remove the Journal button from the authenticated nav
content = content.replace(
  /items\.push\(\{\s*id: 'journal',[\s\S]*?isActive: activeTab === 'journal'\s*\}\);\s*/,
  ""
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully hid Journal buttons.');
