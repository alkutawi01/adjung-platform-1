const fs = require('fs');
const html = fs.readFileSync('SignUpWizard.txt', 'utf8');

let cleaned = html.replace(/style="[^"]*"/g, '');
cleaned = cleaned.replace(/data-template-id="[^"]*"/g, '');
cleaned = cleaned.replace(/class="canva-text/g, 'className="');
cleaned = cleaned.replace(/class="canva-button/g, 'className="');
cleaned = cleaned.replace(/class="/g, 'className="');
cleaned = cleaned.replace(/onclick="[^"]*"/g, '');
cleaned = cleaned.replace(/onchange="[^"]*"/g, '');
cleaned = cleaned.replace(/onsubmit="[^"]*"/g, '');
cleaned = cleaned.replace(/oninput="[^"]*"/g, '');

fs.writeFileSync('cleaned.html', cleaned);
console.log("Done");
