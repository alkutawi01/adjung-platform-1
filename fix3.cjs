const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('</div>        </div>      </nav>\n      </nav>', '</div>        </div>      </nav>');
fs.writeFileSync('src/App.tsx', app);
