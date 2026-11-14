// Kiro UserPromptSubmit hook: when a prompt touches money, health or the author's title,
// add the project rules to the agent's context (stdout is forwarded on exit 0).
import { readEvent } from './read-stdin.mjs';

const { prompt = '' } = await readEvent();
const rules = [];
if (/price|pricing|subscription|paywall|checkout|\$\s?\d|₸|цен|подписк|оплат/i.test(prompt))
  rules.push('No prices, payment forms or subscription offers anywhere in Haunted Ladder. The demo is free.');
if (/heal|cure|therapy|diagnos|лечени|вылеч|диагноз/i.test(prompt))
  rules.push('Never promise a health result. The reading is self-reflection, not treatment.');
if (/psycholog|психолог|therapist/i.test(prompt))
  rules.push('The author is "author of the Ladder method", never a psychologist or therapist.');
if (rules.length) console.log(`Project rules for this request:\n- ${rules.join('\n- ')}`);
process.exit(0);
