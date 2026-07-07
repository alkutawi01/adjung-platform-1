const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
const target = fs.readFileSync('target.txt', 'utf8');
const replacement = `                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setLoginError('');
                    setShowLoginModal(true);
                  }}
                  className="px-1.5 py-1 text-xs font-mono tracking-wider text-white/80 hover:text-white font-semibold transition uppercase cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignUpWizard(true)}
                  className="px-1.5 py-1 text-xs font-mono tracking-wider text-white/80 hover:text-white font-semibold transition uppercase cursor-pointer ml-4"
                >
                  Apply for Membership
                </button>
              </>
            )}
        </div>
      </nav>
      {/* ==================== 2. PERSONAL SCHOLARLY MASTHEAD ==================== */}
      {(activeTab === 'folio' || activeTab === 'bio') && currentAuthor && (
        <header className="w-full pt-8 pb-3 px-4 md:px-8 bg-[#FDFDFD] z-10 select-none">
          <div className="max-w-6xl mx-auto text-center relative">
            `;
app = app.replace(target, replacement);
fs.writeFileSync('src/App.tsx', app);
