const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Use regex to find the entire block that got corrupted
const startIdx = app.indexOf('                  To view individual timelines');
const endIdx = app.indexOf('                {/* Writer Pen Name & Signature replacement');

if (startIdx > -1 && endIdx > -1) {
  const replacement = `                  To view individual timelines, articles, essays, and writer profiles, please select a registered writer from our directory or sign in if you are an editor.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  {hasPermission('viewDirectory') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('directory')}
                      className="bg-adjung-maroon hover:opacity-95 text-[#FDFDFD] font-mono text-xs uppercase tracking-wider px-6 py-3 rounded shadow transition cursor-pointer"
                    >
                      Browse Writers Directory
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError('');
                      setShowLoginModal(true);
                    }}
                    className="border border-stone-300 hover:border-adjung-maroon hover:text-adjung-maroon text-stone-700 font-mono text-xs uppercase tracking-wider px-6 py-3 rounded transition cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignUpWizard(true)}
                    className="border border-stone-300 hover:border-adjung-maroon hover:text-adjung-maroon text-stone-700 font-mono text-xs uppercase tracking-wider px-6 py-3 rounded transition cursor-pointer"
                  >
                    Apply for Membership
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 max-w-4xl mx-auto">
              {/* Writer Hero Block */}
              <div className="text-center md:text-left border-b border-stone-200/40 pb-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="space-y-3 max-w-2xl">
                  <h2 className="font-serif text-2xl md:text-[28px] font-normal tracking-tight text-[#111111] leading-tight">
                    {authorProfile?.heroTitle}
                  </h2>
                  <p className="font-serif italic text-[14px] md:text-[15px] text-stone-500 leading-relaxed max-w-xl">
                    {authorProfile?.heroSubtitle}
                  </p>
                </div>
`;
  app = app.substring(0, startIdx) + replacement + app.substring(endIdx);
  fs.writeFileSync('src/App.tsx', app);
}
