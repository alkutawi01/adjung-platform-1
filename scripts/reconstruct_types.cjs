const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\alkut\\.gemini\\antigravity-ide\\brain\\62a10732-b250-467b-b5c6-447746d633e2\\.system_generated\\logs\\transcript_full.jsonl';

const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

let code = null;

function applyReplacement(args) {
  if (args.TargetContent && args.ReplacementContent) {
    if (!code.includes(args.TargetContent)) {
      throw new Error(`TargetContent not found in code for step!`);
    }
    code = code.replace(args.TargetContent, args.ReplacementContent);
  } else if (args.ReplacementChunks) {
    for (const chunk of args.ReplacementChunks) {
      if (!code.includes(chunk.TargetContent)) {
        throw new Error(`TargetContent not found in chunk for step!`);
      }
      code = code.replace(chunk.TargetContent, chunk.ReplacementContent);
    }
  }
}

for (const line of lines) {
  const step = JSON.parse(line);
  if (step.tool_calls) {
    for (const call of step.tool_calls) {
      if (call.name === 'write_to_file' && call.args.TargetFile.endsWith('types.ts')) {
        code = call.args.CodeContent;
        console.log(`Step ${step.step_index}: Full write applied.`);
      }
      
      // Apply replacements to types.ts up to the end of the log
      if ((call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') && call.args.TargetFile.endsWith('types.ts')) {
        try {
          applyReplacement(call.args);
          console.log(`Step ${step.step_index}: Replacement applied.`);
        } catch (e) {
          console.error(`Error applying replacement at step ${step.step_index}:`, e.message);
        }
      }
    }
  }
}

if (code) {
  const targetPath = path.join(__dirname, '../src/types.ts');
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log('Successfully reconstructed types.ts and saved to:', targetPath);
} else {
  console.log('No types.ts writes found in log, reading original from git...');
}
