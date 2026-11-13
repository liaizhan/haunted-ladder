import type { LadderDraft } from './ladder';

export type Saved = { draft: LadderDraft; steps: Record<string, string> };

export const STORAGE_KEY = 'haunted-ladder:v1';

function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && (v as unknown[]).every((x) => typeof x === 'string');
}

/** Saves the draft and steps. Never throws: if storage fails the app keeps working in memory. */
export function save(s: Saved, store: Storage): void {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // private mode or quota: ignore
  }
}

/** Returns the saved state, or null when missing, broken or the wrong shape. Never throws. */
export function load(store: Storage): Saved | null {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
    const o = v as Record<string, unknown>;
    const d = o['draft'];
    const st = o['steps'];
    if (typeof d !== 'object' || d === null || Array.isArray(d)) return null;
    if (typeof st !== 'object' || st === null || Array.isArray(st)) return null;
    const dr = d as Record<string, unknown>;
    const goal = dr['goal'];
    const me = dr['me'];
    const blocks = dr['blocks'];
    const fears = dr['fears'];
    if (typeof goal !== 'string' || typeof me !== 'string') return null;
    if (!isStrArray(blocks) || !isStrArray(fears)) return null;
    const entries = Object.entries(st as Record<string, unknown>);
    if (!entries.every(([, val]) => typeof val === 'string')) return null;
    return {
      draft: { goal, me, blocks, fears },
      steps: Object.fromEntries(entries as [string, string][]),
    };
  } catch {
    return null;
  }
}

/** Removes the saved state. Never throws. */
export function clear(store: Storage): void {
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
