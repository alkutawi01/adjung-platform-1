const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const oldFooterRegex = /<footer className="w-full mt-12 pt-12 pb-8 border-t border-\[#EAE8E3\] bg-stone-50 select-none">[\s\S]*?<\/footer>/;
const newFooter = `<footer className="w-full mt-12 pt-12 pb-8 border-t border-[#EAE8E3] bg-stone-50 select-none">
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 lg:col-span-2">
              <h1 className="font-serif text-2xl font-semibold tracking-wider text-[#802334]">{BRAND.logoText}</h1>
              <p className="font-serif italic text-stone-600 text-sm max-w-sm">"{systemSettings.editorialPolicy}"</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Institutional Publications</h4>
              <ul className="space-y-2 font-sans text-sm text-stone-600">
                <li><button onClick={() => { setActiveTab('editorials'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editorial Notes</button></li>
                <li><button onClick={() => { setActiveTab('notices'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Notice Board</button></li>
                <li><span className="hover:text-[#802334] transition cursor-pointer">Publishing Policy</span></li>
                <li><span className="hover:text-[#802334] transition cursor-pointer">Version History</span></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Network</h4>
              <ul className="space-y-2 font-sans text-sm text-stone-600">
                <li><span className="hover:text-[#802334] transition cursor-pointer">About Adjung</span></li>
                <li><button onClick={() => { setActiveTab('directory'); window.scrollTo(0,0); }} className="hover:text-[#802334] transition">Editorial Board</button></li>
              </ul>
            </div>
          </div>
        </footer>`;

content = content.replace(oldFooterRegex, newFooter);

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated Footer.');
