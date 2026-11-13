// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountApp } from '../../src/main';
import { STORAGE_KEY } from '../../src/domain/storage';
import { SPOOKY_SELECTOR } from '../../src/ui/calm';
import type { Answer, Reading } from '../../src/domain/server';
import type { LadderDraft } from '../../src/domain/ladder';

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

const READING: Reading = {
  kind: 'reading',
  steps: [
    { number: 1, zone: 'current', zoneLabel: 'I', text: 'Lessons outlined' },
    { number: 2, zone: 'block', zoneLabel: 'Obstacle', text: 'Dad: nobody pays' },
    { number: 3, zone: 'block', zoneLabel: 'Obstacle', text: 'Friend: market is full' },
    { number: 4, zone: 'block', zoneLabel: 'Obstacle', text: 'Teacher: not an expert' },
    { number: 5, zone: 'goal', zoneLabel: 'Goal', text: 'Launch my course' },
    { number: 6, zone: 'fear', zoneLabel: 'Fear', text: 'People will laugh' },
  ],
  nearestBlock: 'Dad: nobody pays',
  fearsAboveGoal: 1,
  insights: ['An insight'],
  questions: ['Q1?', 'Q2?'],
  fullDiagnostic: { text: 'Free diagnostic', url: 'https://108psy.com/x?utm_source=chatgpt_plugin' },
  author: 'Aizhan Li',
  disclaimer: 'Not therapy.',
};

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function press(root: HTMLElement, label: string): void {
  const b = Array.from(root.querySelectorAll('button')).find((x) => x.textContent === label);
  if (!b) throw new Error(`No button "${label}"`);
  b.click();
}

function fill(root: HTMLElement, values: string[]): void {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input'));
  values.forEach((v, i) => {
    const input = inputs[i];
    if (input) type(input, v);
  });
}

/** Intro -> form -> answers all four questions -> "Show my ladder". */
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

describe('app walk-through', () => {
  let root: HTMLElement;
  let store: Storage;

  beforeEach(() => {
    document.body.className = '';
    document.body.replaceChildren();
    root = document.createElement('main');
    document.body.append(root);
    store = memoryStore();
  });

  const mount = (answer: Answer) => {
    const analyze = vi.fn(async (_draft: LadderDraft) => answer);
    const createContext = vi.fn(() => null);
    mountApp(root, { analyze, store, createContext });
    return { analyze, createContext };
  };

  it('goes intro, form, result with a reading', async () => {
    const { analyze, createContext } = mount(READING);
    expect(root.querySelector('h1')?.textContent).toBe('Haunted Ladder');
    walkToSubmit(root);
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(analyze.mock.calls[0]?.[0].goal).toBe('Launch my course');
    expect(store.getItem(STORAGE_KEY)).not.toBeNull();

    await vi.waitFor(() => expect(root.querySelector('.staircase')).not.toBeNull());
    expect(root.querySelectorAll('.ghost').length).toBe(1);
    expect(root.querySelector('.heart')).not.toBeNull();
    expect(root.querySelector('.night-sound')?.getAttribute('aria-pressed')).toBe('false');
    expect(createContext).not.toHaveBeenCalled();
    expect(document.body.classList.contains('calm')).toBe(false);

    const save = root.querySelector<HTMLButtonElement>('button.save');
    expect(save?.disabled).toBe(true);
    type(root.querySelector<HTMLInputElement>('.ghost-step input') as HTMLInputElement, 'Record one video');
    expect(save?.disabled).toBe(false);
    expect(root.querySelector('.ghost.faded')).not.toBeNull();
    expect(store.getItem(STORAGE_KEY)).toContain('Record one video');
  });

  it('shows only the message and the way back on crisis, and clears the draft', async () => {
    const { createContext } = mount({ kind: 'crisis', message: 'Please call now.', helpUrl: 'https://help.example/x' });
    walkToSubmit(root);
    await vi.waitFor(() => expect(document.body.classList.contains('calm')).toBe(true));
    expect(root.querySelector(SPOOKY_SELECTOR)).toBeNull();
    expect(document.querySelector(SPOOKY_SELECTOR)).toBeNull();
    expect(root.textContent).toContain('Please call now.');
    const buttons = Array.from(root.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons).toEqual(['Back to the start']);
    expect(store.getItem(STORAGE_KEY)).toBeNull();
    expect(createContext).not.toHaveBeenCalled();

    press(root, 'Back to the start');
    expect(document.body.classList.contains('calm')).toBe(false);
    expect(Array.from(root.querySelectorAll('button')).map((b) => b.textContent)).toEqual(['Start']);
  });

  it('shows the health message without ghosts and lets the person edit', async () => {
    mount({ kind: 'health', message: 'We do not analyze health details.' });
    walkToSubmit(root);
    await vi.waitFor(() => expect(document.body.classList.contains('calm')).toBe(true));
    expect(document.querySelector(SPOOKY_SELECTOR)).toBeNull();
    expect(root.textContent).toContain('We do not analyze health details.');
    press(root, 'Edit answers');
    expect(document.body.classList.contains('calm')).toBe(false);
    expect(root.querySelector('h2')?.textContent).toBe('What is your goal?');
    expect(root.querySelector<HTMLInputElement>('input')?.value).toBe('Launch my course');
  });

  it('shows an error with "Try again" that sends the same draft again', async () => {
    const analyze = vi
      .fn<(d: unknown) => Promise<Answer>>()
      .mockResolvedValueOnce({ kind: 'error', reason: 'network' })
      .mockResolvedValueOnce(READING);
    mountApp(root, { analyze, store, createContext: () => null });
    walkToSubmit(root);
    await vi.waitFor(() => expect(document.body.classList.contains('calm')).toBe(true));
    expect(document.querySelector(SPOOKY_SELECTOR)).toBeNull();
    press(root, 'Try again');
    await vi.waitFor(() => expect(root.querySelector('.staircase')).not.toBeNull());
    expect(analyze).toHaveBeenCalledTimes(2);
    expect(analyze.mock.calls[1]?.[0]).toEqual(analyze.mock.calls[0]?.[0]);
  });
});
