const fs = require('fs');
const appPath = './src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

let scriptContent = fs.readFileSync('update_manifesto.cjs', 'utf8');
const replacementMatch = scriptContent.match(/const replacement = `([\s\S]*?)`;/);
if (!replacementMatch) {
  console.error("Replacement not found in script");
  process.exit(1);
}
let newBlock = replacementMatch[1];

// Fix the trailing block in newBlock
newBlock = newBlock.replace("{/* Recently Curated selections list */}", "{/* Footer navigation */}");

const targetRegex = /<div id="platform-description-block"[\s\S]*?\{\/\* Footer navigation \*\/\}/;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, newBlock);
  fs.writeFileSync(appPath, content, 'utf8');
  console.log("Successfully forced manifesto update!");
} else {
  console.log("Target regex not found in App.tsx!");
}
