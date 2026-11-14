// Kiro hook helper: every interface key must exist in en, ru and kk.
// Run: node scripts/kiro/check-locales.mjs  (exit 1 and a list when a key is missing)
import { readFileSync } from 'node:fs';

const LANGS = ['en', 'ru', 'kk'];
const keysOf = (lang) => {
  const src = readFileSync(new URL(`../../src/locales/${lang}.ts`, import.meta.url), 'utf8');
  return new Set(Array.from(src.matchAll(/^ {2}([A-Za-z][A-Za-z0-9_]*)\s*:/gm), (m) => m[1]));
};

const sets = Object.fromEntries(LANGS.map((l) => [l, keysOf(l)]));
const all = new Set(LANGS.flatMap((l) => [...sets[l]]));
const missing = [];
for (const key of all) for (const l of LANGS) if (!sets[l].has(key)) missing.push(`${l}.ts has no "${key}"`);

if (missing.length) {
  console.log(`Locales check failed: ${missing.length} missing\n${missing.join('\n')}`);
  process.exit(1);
}
console.log(`Locales check passed: ${all.size} keys in en, ru and kk`);
