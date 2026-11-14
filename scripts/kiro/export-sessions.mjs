// Exports this project's Kiro chat sessions (IDE v3 and kiro-cli) to kiro-sessions/*.md.
// Keeps prompts, Kiro's answers, tool calls (one line each) and hook runs.
// Drops hidden reasoning, tool output and anything outside this repo. Home paths and emails are masked.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

const repo = resolve(process.cwd());
const root = join(homedir(), '.kiro', 'sessions');
const out = join(repo, 'kiro-sessions');
mkdirSync(out, { recursive: true });

const mask = (s) =>
  String(s ?? '')
    .split(repo).join('.')
    .split(homedir()).join('~')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]');
const slug = (s) => mask(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'session';
const short = (s, n = 160) => { const t = mask(s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + ' ...' : t; };
const lines = (f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const sessions = [];

// Kiro IDE (v3) sessions: <root>/<hash>/sess_*/{session.json,messages.jsonl}
for (const bucket of existsSync(root) ? readdirSync(root) : []) {
  if (bucket === 'cli') continue;
  const dir = join(root, bucket);
  for (const id of readdirSync(dir).filter((d) => d.startsWith('sess_'))) {
    const metaFile = join(dir, id, 'session.json');
    const msgFile = join(dir, id, 'messages.jsonl');
    if (!existsSync(metaFile) || !existsSync(msgFile)) continue;
    const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
    if (!(meta.workspacePaths || []).includes(repo)) continue;
    const body = []; const hooks = {}; let tools = 0; let credits = 0;
    for (const { payload: p } of lines(msgFile)) {
      if (!p) continue;
      if (p.type === 'user') body.push(`## Prompt\n\n${mask(p.content).trim()}\n`);
      else if (p.type === 'assistant' && p.operationType === 'Say' && p.content?.trim()) body.push(`## Kiro\n\n${mask(p.content).trim()}\n`);
      else if (p.type === 'tool_call') { tools++; body.push(`- tool \`${p.toolName}\`: ${short(p.title || '')} ${short(JSON.stringify(p.args || {}), 120)}`); }
      else if (p.type === 'ContextualHookInvoked') { const k = `${p.name} (${p.status})`; hooks[k] = (hooks[k] || 0) + 1; }
      else if (p.type === 'steering_inclusion') {
        const docs = (p.documents || []).map((d) => String(typeof d === 'string' ? d : d?.uri ?? d?.path ?? d?.name ?? '').split('/').pop()).filter(Boolean);
        if (docs.length) body.push(`- steering: ${docs.join(', ')}`);
      }
      else if (p.type === 'usage_summary') for (const t of p.promptTurnSummaries || []) credits += t.usage || 0;
    }
    sessions.push({ id, title: meta.title || id, created: meta.createdAt, agent: meta.agentMode, kind: 'Kiro IDE', body, hooks, tools, credits });
  }
}

// kiro-cli sessions: <root>/cli/<id>.json + <id>.jsonl
const cliDir = join(root, 'cli');
for (const f of existsSync(cliDir) ? readdirSync(cliDir).filter((x) => x.endsWith('.json')) : []) {
  const meta = JSON.parse(readFileSync(join(cliDir, f), 'utf8'));
  if (resolve(meta.cwd || '') !== repo) continue;
  const jl = join(cliDir, f.replace(/\.json$/, '.jsonl'));
  if (!existsSync(jl)) continue;
  const body = []; let tools = 0;
  for (const o of lines(jl)) {
    const parts = o.data?.content || [];
    const text = parts.filter((c) => c.kind === 'text').map((c) => c.data).join('\n').trim();
    if (o.kind === 'Prompt' && text) body.push(`## Prompt\n\n${mask(text)}\n`);
    else if (o.kind === 'AssistantMessage') {
      if (text) body.push(`## Kiro\n\n${mask(text)}\n`);
      for (const c of parts.filter((c) => c.kind === 'toolUse')) { tools++; body.push(`- tool \`${c.data?.name}\`: ${short(JSON.stringify(c.data?.input || {}), 120)}`); }
    }
  }
  sessions.push({ id: meta.session_id, title: meta.title || meta.session_id, created: meta.created_at, agent: 'kiro-cli', kind: 'kiro-cli', body, hooks: {}, tools, credits: 0 });
}

// Login smoke tests ("Reply with exactly: OK") are not project work.
const kept = sessions.filter((s) => !/^Reply with exactly/i.test(s.title));
kept.sort((a, b) => String(a.created).localeCompare(String(b.created)));
const index = ['# Kiro sessions', '', `Exported by \`npm run export:sessions\` from ${kept.length} Kiro chats in this repo. Each file keeps the prompts, Kiro's answers, every tool call (one line) and the hooks that fired. Hidden reasoning and tool output are left out; home paths and emails are masked.`, ''];
kept.forEach((s, i) => {
  const name = `${String(i + 1).padStart(2, '0')}-${slug(s.title)}.md`;
  const hookLines = Object.entries(s.hooks).map(([k, v]) => `- ${k}: ${v}`);
  const head = [`# ${mask(s.title)}`, '', `- Source: ${s.kind}`, `- Agent: ${s.agent || 'default'}`, `- Started: ${s.created}`, `- Tool calls: ${s.tools}`];
  if (s.credits) head.push(`- Credits: ${s.credits.toFixed(2)}`);
  if (hookLines.length) head.push('', '## Hooks that fired', '', ...hookLines);
  writeFileSync(join(out, name), [...head, '', ...s.body, ''].join('\n'));
  index.push(`${i + 1}. [${mask(s.title)}](${name}): ${s.kind}, ${s.tools} tool calls${Object.keys(s.hooks).length ? `, hooks ${Object.values(s.hooks).reduce((a, b) => a + b, 0)}` : ''}`);
});
writeFileSync(join(out, 'README.md'), index.join('\n') + '\n');
console.log(`Exported ${kept.length} sessions to kiro-sessions/`);
