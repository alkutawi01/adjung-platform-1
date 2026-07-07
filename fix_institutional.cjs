const fs = require('fs');
const appPath = './src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const instViewRegex = /\{\/\* ACTIVE MODULE 5: EDITORIUM \(Editor settings and administrative workspace\) \*\/\}[\s\S]*?\{activeTab === 'institutional-view' && selectedEntry && \([\s\S]*?<\/div>[\s\S]*?\)\}/;
content = content.replace(instViewRegex, '{/* ACTIVE MODULE 5: EDITORIUM (Editor settings and administrative workspace) */}');

fs.writeFileSync(appPath, content, 'utf8');
console.log('Removed dead institutional-view block.');
