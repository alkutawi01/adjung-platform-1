const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<'landing' \| 'frontpage' \| 'folio' \| 'bio' \| 'directory' \| 'desk' \| 'index' \| 'editorium' \| 'notices' \| 'editorials' \| 'institutional-view'>\('landing'\);/,
  `const [activeTab, setActiveTab] = useState<'landing' | 'frontpage' | 'folio' | 'bio' | 'directory' | 'desk' | 'index' | 'editorium' | 'notices' | 'editorials' | 'institutional-view' | 'journal'>('landing');

  // Frontpage Carousel State
  const [frontpageCarouselIndex, setFrontpageCarouselIndex] = useState(0);

  useEffect(() => {
    if (activeTab === 'frontpage') {
      const interval = setInterval(() => {
        setFrontpageCarouselIndex((prev) => prev + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);`
);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully injected Carousel state and journal tab.');
