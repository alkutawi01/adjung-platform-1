const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update State Type
content = content.replace(
  /const \[indexTypeFilter, setIndexTypeFilter\] = useState<'All' \| 'Article' \| 'Essay' \| 'Note'>\('All'\);/,
  "const [indexTypeFilter, setIndexTypeFilter] = useState<'All' | 'Article' | 'Essay' | 'Note' | 'Institutional'>('All');"
);

// 2. Update filter mapping buttons
content = content.replace(
  /\{?\['All', 'Article', 'Essay', 'Note'\]\.map\(\(type\) => \(/,
  "{['All', 'Article', 'Essay', 'Note', 'Institutional'].map((type) => ("
);

// 3. Update the filter logic
const filterLogicRegex = /const matchesType = indexTypeFilter === 'All' \|\| e\.contentType === indexTypeFilter;/;
content = content.replace(filterLogicRegex, `const matchesType = 
                          indexTypeFilter === 'All' ? !e.isInstitutional :
                          indexTypeFilter === 'Institutional' ? e.isInstitutional :
                          e.contentType === indexTypeFilter;`);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated Index type filters.');
