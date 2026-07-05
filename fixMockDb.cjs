const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'db', 'mockDb.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// Replace the loadedEntries logic
content = content.replace(
  'const loadedEntries = JSON.parse(storedEntries);',
  `let loadedEntries = JSON.parse(storedEntries);
        // Force merge INITIAL_ENTRIES if the mock entries are missing from local storage
        if (loadedEntries.length < 15) {
          loadedEntries = [...INITIAL_ENTRIES];
        }`
);

fs.writeFileSync(dbPath, content, 'utf8');
console.log('Successfully updated loadedEntries logic in mockDb.ts');
