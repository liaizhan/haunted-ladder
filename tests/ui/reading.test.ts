// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { buildReading } from '../../src/ui/reading';
import { allFaded, applySavedSteps, ghostsFromReading, stepsRecord } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';

const RUNS = { numRuns: 100 };

function readingWith(fears: string[], url = 'https://108psy.com/x?utm_source=chatgpt_plugin&a=1'): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'Here' },
      { number: 2, zone: 'goal', zoneLabel: 'Goal', text: 'Goal' },
      ...fears.map((f, i) => ({ number: 3 + i, zone: 'fear' as const, zoneLabel: 'Fear', text: f })),
    ],
    nearestBlock: null,
    fearsAboveGoal: fears,
    insights: ['One <b>insight</b>'],
    questions: ['Q1?', 'Q2?'],
    fullDiagnostic: { text: 'Free diagnostic', url },
    author: 'a',
    disclaimer: 'Not therapy.',
  };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('reading', () => {
  // Feature: haunted-ladder, Property 6: Ghost fading
  it('Property 6: save is enabled exactly when every field has a non-space step', () => {
    const text = fc.string({ maxLength: 12 });
    fc.assert(
      fc.property(fc.array(text, { minLength: 1, maxLength: 5 }), (steps) => {
        const r = readingWith(steps.map((_, i) => `fear ${i}`));
        const ghosts = ghostsFromReading(r);
        const onChange = vi.fn();
        const root = buildReading(r, ghosts, { onStepsChange: onChange, onSave: () => {} });
        const inputs = root.querySelectorAll<HTMLInputElement>('.ghost-step input');
        expect(inputs.length).toBe(steps.length);
        inputs.forEach((inp, i) => type(inp, steps[i] ?? ''));
        const save = root.querySelector<HTMLButtonElement>('button.save');
        const expected = steps.every((s) => s.trim().length > 0);
        expect(save?.disabled).toBe(!expected);
        expect(allFaded(ghosts)).toBe(expected);
        expect(root.querySelector<HTMLElement>('.closing')?.hidden).toBe(!expected);
        expect(root.querySelectorAll('.ghost-step.faded').length).toBe(
          steps.filter((s) => s.trim().length > 0).length,
        );
      }),
      RUNS,
    );
  });

  // Feature: haunted-ladder, Property 8: UTM rewrite
  it('Property 8: the diagnostic link uses utm_source=haunted_ladder', () => {
    const r = readingWith(['f']);
    const root = buildReading(r, ghostsFromReading(r), { onStepsChange: () => {}, onSave: () => {} });
    const a = root.querySelector<HTMLAnchorElement>('a.diagnostic');
    expect(a?.getAttribute('href')).toBe('https://108psy.com/x?utm_source=haunted_ladder&a=1');
  });

  it('shows insights as text, questions, disclaimer, and clearing a step restores the ghost', () => {
    const r = readingWith(['f']);
    const ghosts = ghostsFromReading(r);
    const root = buildReading(r, ghosts, { onStepsChange: () => {}, onSave: () => {} });
    expect(root.querySelector('b')).toBeNull();
    expect(root.textContent).toContain('One <b>insight</b>');
    expect(root.textContent).toContain('Q2?');
    expect(root.querySelector('.disclaimer')?.textContent).toBe('Not therapy.');
    const input = root.querySelector<HTMLInputElement>('.ghost-step input');
    if (!input) throw new Error('no input');
    type(input, 'call a friend');
    expect(root.querySelector<HTMLButtonElement>('button.save')?.disabled).toBe(false);
    type(input, '   ');
    expect(root.querySelector<HTMLButtonElement>('button.save')?.disabled).toBe(true);
    expect(ghosts[0]?.step).toBe('   ');
  });

  it('saves steps and restores them by fear text', () => {
    const r = readingWith(['a', 'b']);
    const ghosts = ghostsFromReading(r);
    ghosts[1] = { fear: 'b', step: 'walk' };
    const rec = stepsRecord(ghosts);
    expect(rec).toEqual({ b: 'walk' });
    expect(applySavedSteps(ghostsFromReading(r), rec).map((g) => g.step)).toEqual(['', 'walk']);
  });
});
