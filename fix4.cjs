const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('            )}\n        </div>\n      </nav>', '            )}\n          </div>\n        </div>\n      </nav>');
fs.writeFileSync('src/App.tsx', app);
