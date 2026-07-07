const fs = require('fs');
const appPath = './src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

// I will just restore the file again and apply a more precise replacement!
