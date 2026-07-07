const fs = require('fs');
const html = fs.readFileSync('SignUpWizard.txt', 'utf8');
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyMatch) {
  fs.writeFileSync('body_content.html', bodyMatch[1]);
  console.log("Body extracted to body_content.html");
}
