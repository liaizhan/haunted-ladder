// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { demoDraft, isDemo } from '../../src/domain/demo';
import { validateDraft } from '../../src/domain/ladder';
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

  it('loading the demo leaves a saved draft unchanged', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (goal) => {
        document.body.replaceChildren();
        const store = memoryStore();
        const raw = JSON.stringify({
          draft: { goal, me: 'me', blocks: ['a', 'b', 'c'], fears: [''] },
          steps: {},
        });
        store.setItem(STORAGE_KEY, raw);
        const root = document.createElement('div');
        document.body.append(root);
        mountApp(root, { store, search: '?demo=1' });
        const input = root.querySelector<HTMLInputElement>('input');
        if (input) {
          input.value = 'changed';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        expect(store.getItem(STORAGE_KEY)).toBe(raw);
        expect(root.textContent).toContain('Sample ladder. Clear it to write your own.');
        const clearBtn = Array.from(root.querySelectorAll('button')).find(
          (b) => b.textContent === 'Clear',
        );
        expect(clearBtn).toBeTruthy();
        clearBtn?.click();
        expect(root.textContent).not.toContain('Sample ladder');
        expect(store.getItem(STORAGE_KEY)).toBe(raw);
      }),
      { numRuns: 20 },
    );
  });
});
