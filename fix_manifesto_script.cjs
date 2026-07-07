const fs = require('fs');
let content = fs.readFileSync('update_manifesto.cjs', 'utf8');
content = content.replace("{\\/\\* Recently Curated selections list \\*\\/}", "{\\/\\* Footer navigation \\*\\/}");
content = content.replace("{/* Recently Curated selections list */}", "{/* Footer navigation */}");
fs.writeFileSync('update_manifesto.cjs', content, 'utf8');
