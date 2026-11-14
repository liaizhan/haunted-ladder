// @vitest-environment jsdom
// Spec: .kiro/specs/perseids-starfall (Properties S1, S2, S3)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountApp } from '../../src/main';
import type { Answer } from '../../src/domain/server';
import css from '../../src/styles.css?raw';

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

function press(root: HTMLElement, label: string): void {
  const b = Array.from(root.querySelectorAll('button')).find((x) => x.textContent === label);
  if (!b) throw new Error(`No button "${label}"`);
  b.click();
}

function fill(root: HTMLElement, values: string[]): void {
  Array.from(root.querySelectorAll<HTMLInputElement>('input')).forEach((input, i) => {
    const v = values[i];
    if (v === undefined) return;
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function walkToSubmit(root: HTMLElement): void {
  press(root, 'Start');
  fill(root, ['Launch my course']);
  press(root, 'Next');
  fill(root, ['Lessons outlined']);
  press(root, 'Next');
  fill(root, ['Dad: nobody pays', 'Friend: market is full', 'Teacher: not an expert']);
  press(root, 'Next');
  fill(root, ['People will laugh']);
  press(root, 'Show my ladder');
}

describe('Perseids starfall', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.className = '';
    document.body.replaceChildren();
    root = document.createElement('main');
    document.body.append(root);
  });

  const mount = (analyze: () => Promise<Answer>) =>
    mountApp(root, { analyze: vi.fn(analyze), store: memoryStore(), createContext: vi.fn(() => null) });

  it('S1: the waiting screen has exactly 40 meteors, all inside .w-meteors', () => {
    mount(() => new Promise<Answer>(() => undefined));
    walkToSubmit(root);
    const meteors = root.querySelectorAll('.w-meteor');
    expect(meteors.length).toBe(40);
    expect(root.querySelectorAll('.w-meteors > .w-meteor').length).toBe(40);
    for (const m of Array.from(meteors)) {
      const s = (m as HTMLElement).style;
      expect(s.getPropertyValue('--x')).toMatch(/%$/);
      expect(s.getPropertyValue('--t')).toMatch(/s$/);
    }
  });

  it('S2: the crisis screen has no meteor', async () => {
    mount(async () => ({ kind: 'crisis', message: 'Please call now.', helpUrl: 'https://help.example/x' }));
    walkToSubmit(root);
    await vi.waitFor(() => expect(document.body.classList.contains('calm')).toBe(true));
    expect(document.querySelector('.w-meteor')).toBeNull();
  });

  it('S3: the fall animation runs only when motion is allowed', () => {
    const blocks = css.split('@media');
    const withFall = blocks.filter((b) => b.includes('animation: w-meteor-fall'));
    expect(withFall.length).toBeGreaterThan(0);
    for (const b of withFall) expect(b.trimStart().startsWith('(prefers-reduced-motion: no-preference)')).toBe(true);
    expect(css.split('@media')[0]).not.toContain('animation: w-meteor-fall');
  });
});
