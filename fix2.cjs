const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
const target = `                  >
                    Sign In
            <div className="space-y-10 max-w-4xl mx-auto">`;

const replacement = `                  >
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
            <div className="space-y-10 max-w-4xl mx-auto">`;

app = app.replace(target, replacement);
fs.writeFileSync('src/App.tsx', app);
