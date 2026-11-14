// Kiro PreToolUse hook: stop the agent from pushing. Publishing waits for the author's yes.
// Exit 2 blocks the tool call, and Kiro shows stderr to the agent.
import { readEvent } from './read-stdin.mjs';

const event = await readEvent();
const input = JSON.stringify(event.tool_input ?? '');
if (/\bgit\b[^"]*\bpush\b/.test(input) || /\bgh\s+(pr\s+create|repo\s+create|release\s+create)\b/.test(input)) {
  console.error('Blocked: pushing or publishing waits for the author\'s explicit yes. Show what will be published and ask first.');
  process.exit(2);
}
process.exit(0);
