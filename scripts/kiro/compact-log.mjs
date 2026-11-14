// Kiro PreCompact / PostCompact hook: keep a short local log of context compactions,
// so a long build session can be traced later. The log is git-ignored (*.log).
import { appendFileSync } from 'node:fs';
import { readEvent } from './read-stdin.mjs';

const event = await readEvent();
const name = event.hook_event_name ?? process.argv[2] ?? 'Compact';
const line = [new Date().toISOString(), name, event.transcript_path ?? '', event.summary_path ?? ''].filter(Boolean).join(' ');
appendFileSync(new URL('../../.kiro/hook-runs.log', import.meta.url), `${line}\n`);
process.exit(0);
