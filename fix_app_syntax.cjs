const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$').replace(/\\\\/g, '\\');
fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('Fixed escaped characters in App.tsx');
