const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  /\{\/\* ==================== 6\. ACADEMIC FOOTER ==================== \*\/\}/,
  `</main>\n\n      {/* ==================== 6. ACADEMIC FOOTER ==================== */}`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully added missing </main> tag.');
