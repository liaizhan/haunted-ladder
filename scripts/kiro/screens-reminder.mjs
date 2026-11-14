// Kiro Stop hook: if the agent changed anything in src, remind it to refresh screenshots and README.
import { execSync } from 'node:child_process';

let changed = '';
try { changed = execSync('git status --short src', { encoding: 'utf8' }).trim(); } catch { process.exit(0); }
if (changed) {
  const files = changed.split('\n').length;
  console.log(`${files} file(s) in src changed. Run the "Take screenshots" hook (npm run screens) and check that README pictures still match.`);
}
process.exit(0);
