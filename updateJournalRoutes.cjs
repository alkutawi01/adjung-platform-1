const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add Hash parsing for journal
content = content.replace(
  /else if \(route === 'index'\) \{[\s\S]*?\} else if \(route === 'notices'\)/,
  `else if (route === 'index') {
          setActiveTab('index');
          setSelectedEntry(null);
          setEditingEntry(null);
        } else if (route === 'journal') {
          setActiveTab('journal');
          setSelectedEntry(null);
          setEditingEntry(null);
        } else if (route === 'notices')`
);
content = content.replace(
  /else if \(activeTab === 'index'\) newHash = '#\/index';/,
  `else if (activeTab === 'index') newHash = '#/index';
        else if (activeTab === 'journal') newHash = '#/journal';`
);

// 2. Add Journal button to primary nav
content = content.replace(
  /if \(hasPermission\('viewDirectory'\)\) \{/,
  `if (true) {
          items.push({
            id: 'journal',
            label: 'Journal',
            action: () => {
              setActiveTab('journal');
              setSelectedEntry(null);
              setEditingEntry(null);
            },
            isActive: activeTab === 'journal'
          });
        }
        if (hasPermission('viewDirectory')) {`
);

// 3. Add Journal button to mobile/logged-in nav
content = content.replace(
  /if \(hasPermission\('viewIndex'\)\) \{[\s\S]*?id: 'index',/,
  `items.push({
          id: 'journal',
          label: 'Journal',
          action: () => {
            setActiveTab('journal');
            setSelectedEntry(null);
            setEditingEntry(null);
          },
          isActive: activeTab === 'journal'
        });

        if (hasPermission('viewIndex')) {
          items.push({
            id: 'index',`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully injected Journal routes.');
