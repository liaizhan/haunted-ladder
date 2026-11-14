// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { demoDraft, isDemo } from '../../src/domain/demo';
import { validateDraft, type LadderDraft } from '../../src/domain/ladder';
import type { Answer, Reading } from '../../src/domain/server';
import { mountApp } from '../../src/main';
import { STORAGE_KEY } from '../../src/domain/storage';

function memoryStore(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => Array.from(m.keys())[i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, v),
  };
}

describe('Property 13: The demo is honest', () => {
  it('isDemo is true exactly when the query has demo=1', () => {
    const key = fc.constantFrom('demo', 'other', 'x');
    const value = fc.constantFrom('1', '0', '', 'true', '11');
    fc.assert(
      fc.property(fc.array(fc.tuple(key, value), { maxLength: 5 }), fc.boolean(), (pairs, q) => {
        const qs = pairs.map(([k, v]) => `${k}=${v}`).join('&');
        const expected = pairs.some(([k, v]) => k === 'demo' && v === '1');
        expect(isDemo(q ? `?${qs}` : qs)).toBe(expected);
      }),
    );
    expect(isDemo('')).toBe(false);
    expect(isDemo('?demo=1')).toBe(true);
  });

  it('demoDraft passes validateDraft and has 3 fears', () => {
    const d = demoDraft();
    expect(validateDraft(d).ok).toBe(true);
    expect(d.fears).toEqual([
      'People will laugh at my videos',
      'I will spend the money and sell nothing',
      'My family will see me fail',
    ]);
  });

  it('the sample goes straight to the server, shows the result, and leaves storage alone', async () => {
    const reading: Reading = {
      kind: 'reading',
      steps: [
        { number: 1, zone: 'current', zoneLabel: 'I', text: 'a' },
        { number: 2, zone: 'block', zoneLabel: 'O', text: 'b' },
        { number: 3, zone: 'goal', zoneLabel: 'G', text: 'c' },
        { number: 4, zone: 'fear', zoneLabel: 'F', text: 'd' },
      ],
      nearestBlock: null,
      fearsAboveGoal: 1,
      insights: ['i'],
      questions: ['q1', 'q2'],
      fullDiagnostic: { text: 't', url: 'https://108psy.com/x?utm_source=chatgpt_plugin' },
      author: 'Aizhan Li',
      disclaimer: 'Not therapy.',
    };
    for (const goal of ['my goal', 'x', 'Launch']) {
      document.body.replaceChildren();
      const store = memoryStore();
      const raw = JSON.stringify({
        draft: { goal, me: 'me', blocks: ['a', 'b', 'c'], fears: [''] },
        steps: {},
      });
      store.setItem(STORAGE_KEY, raw);
      const root = document.createElement('div');
      document.body.append(root);
      const analyze = vi.fn(async (_d: LadderDraft): Promise<Answer> => reading);
      mountApp(root, { store, search: '?demo=1', analyze, createContext: () => null });
      expect(analyze).toHaveBeenCalledTimes(1);
      expect(analyze.mock.calls[0]?.[0]).toEqual(demoDraft());
      await vi.waitFor(() => expect(root.textContent).toContain('Sample ladder.'));
      expect(store.getItem(STORAGE_KEY)).toBe(raw);
      const own = Array.from(root.querySelectorAll('button')).find(
        (b) => b.textContent === 'Write my own',
      );
      expect(own).toBeTruthy();
      own?.click();
      expect(root.textContent).not.toContain('Sample ladder');
      expect(root.querySelector('h2')?.textContent).toBeTruthy();
      expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('');
      expect(store.getItem(STORAGE_KEY)).toBe(raw);
    }
  });
});
