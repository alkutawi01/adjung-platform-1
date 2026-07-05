const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Update Tab State
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<.*?>\('landing'\);/,
  "const [activeTab, setActiveTab] = useState<'landing' | 'frontpage' | 'folio' | 'bio' | 'directory' | 'desk' | 'index' | 'editorium' | 'notices' | 'editorials' | 'institutional-view'>('landing');"
);

// 2. Hash to State Logic
const hashStateRegex = /else if \(activeTab === 'bio'\) newHash = `#\/bio\/\$\{selectedAuthorId \|\| ''\}`;/;
content = content.replace(hashStateRegex, `else if (activeTab === 'bio') newHash = \`#/bio/\${selectedAuthorId || ''}\`;
        else if (activeTab === 'notices') newHash = '#/notices';
        else if (activeTab === 'editorials') newHash = '#/editorials';
        else if (activeTab === 'institutional-view' && selectedEntry) {
          if (selectedEntry.contentType === 'Notice') newHash = \`#/notice/\${selectedEntry.slug}\`;
          else newHash = \`#/editorial/\${selectedEntry.slug}\`;
        }`);

// 3. State to Hash Logic
const routeIndexRegex = /\} else if \(route === 'index'\) \{\s*setActiveTab\('index'\);\s*setSelectedEntry\(null\);\s*setEditingEntry\(null\);/;
content = content.replace(routeIndexRegex, `} else if (route === 'index') {
          setActiveTab('index');
          setSelectedEntry(null);
          setEditingEntry(null);
        } else if (route === 'notices') {
          setActiveTab('notices');
          setSelectedEntry(null);
          setEditingEntry(null);
        } else if (route === 'editorials') {
          setActiveTab('editorials');
          setSelectedEntry(null);
          setEditingEntry(null);
        } else if (route === 'notice' || route === 'editorial') {
          setActiveTab('institutional-view');
          setEditingEntry(null);
          // Wait for useEffect below to find the entry since entries might not be loaded yet
          // Actually, App.tsx router uses parts[1] for slug.
          if (parts[1]) {
             // We set a temporary selectedEntry so the view can load it later, or App handles it.
             // Due to closure, entries here might be stale, so we rely on another effect or just set a dummy
             // We'll let a separate useEffect sync it, or just use App's selectedEntry logic.
             // Let's modify the folio entry slug sync logic instead.
          }`);

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.tsx route injection applied.');
