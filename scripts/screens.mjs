// Take screenshots of the main screens in English, for a computer and a phone.
// Run: npm run screens  (needs Google Chrome; set CHROME=/path/to/chrome if it is elsewhere)
// Output: screens/<width>-<name>.jpg. The analyze_ladder call is answered offline from
// tests/fixtures/real-reading.json, so nothing is sent to the server.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../screens/', import.meta.url).pathname;
const WIDTHS = [1280, 390];
const READING = readFileSync(new URL('../tests/fixtures/real-reading.json', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const server = await createServer({ server: { port: 5202, strictPort: false }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];

const port = 9400 + Math.floor(Math.random() * 50);
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'screens-'))}`, 'about:blank']);
await sleep(2500);
const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const waiting = new Map();
let hold = false;
const held = [];
const cors = [['Access-Control-Allow-Origin', '*'], ['Access-Control-Allow-Headers', '*'], ['Access-Control-Allow-Methods', 'POST, OPTIONS'], ['Content-Type', 'application/json']].map(([name, value]) => ({ name, value }));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); return; }
  if (m.method !== 'Fetch.requestPaused') return;
  const rid = m.params.requestId;
  if (m.params.request.method === 'OPTIONS') send('Fetch.fulfillRequest', { requestId: rid, responseCode: 204, responseHeaders: cors });
  else if (hold) held.push(rid);
  else send('Fetch.fulfillRequest', { requestId: rid, responseCode: 200, responseHeaders: cors, body: READING.toString('base64') });
});
const js = async (expression) => (await send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression })).result?.value;
const click = (selector) => js(`document.querySelector(${JSON.stringify(selector)})?.click()`);
const shot = async (width, name) => {
  const height = Math.min(await js('document.documentElement.scrollHeight'), 4000);
  const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: width < 500 ? 1 : 0.6 } });
  writeFileSync(join(OUT, `${width}-${name}.jpg`), Buffer.from(s.data, 'base64'));
  console.log(`screens/${width}-${name}.jpg`);
};

await send('Fetch.enable', { patterns: [{ urlPattern: '*/mcp*' }] });
for (const width of WIDTHS) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
  await send('Page.navigate', { url: base });
  await sleep(2000);
  await js(`localStorage.clear(); localStorage.setItem('haunted-ladder:lang', 'en'); location.reload()`);
  await sleep(3000);
  await shot(width, '1-intro');
  await send('Page.navigate', { url: `${base}?demo=1` });
  await sleep(9000);
  await shot(width, '3-reading');
  await click('.result .nav button.secondary');
  await sleep(1200);
  await shot(width, '2-form');
  for (let i = 0; i < 3; i++) { await click('.form .nav button:not(.secondary)'); await sleep(700); }
  hold = true;
  await click('.form .nav button:not(.secondary)');
  await sleep(2500);
  await shot(width, '2-waiting');
  hold = false;
  for (const rid of held.splice(0)) await send('Fetch.failRequest', { requestId: rid, errorReason: 'Aborted' });
}

ws.close();
chrome.kill();
await server.close();
process.exit(0);
