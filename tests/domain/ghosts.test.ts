import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ghostsFromReading, isFaded, allFaded } from '../../src/domain/ghosts';
import type { Reading, Step } from '../../src/domain/server';

const RUNS = { numRuns: 100 };

const stepArb: fc.Arbitrary<Step> = fc.record({
  number: fc.integer({ min: 1, max: 50 }),
  zone: fc.constantFrom('current', 'block', 'goal', 'fear') as fc.Arbitrary<Step['zone']>,
  zoneLabel: fc.string(),
  text: fc.string(),
});

function readingOf(steps: Step[]): Reading {
  return {
    kind: 'reading',
    steps,
    nearestBlock: null,
    fearsAboveGoal: 0,
    insights: [],
    questions: [],
    fullDiagnostic: { text: 't', url: 'https://108psy.com/' },
    author: 'a',
    disclaimer: 'd',
  };
}

describe('ghosts domain', () => {
  // Feature: haunted-ladder, Property 6: Ghost fading
  it('Property 6: isFaded and allFaded follow the trimmed step', () => {
    const ghost = fc.record({ fear: fc.string(), step: fc.string() });
    fc.assert(
      fc.property(ghost, (g) => {
        expect(isFaded(g)).toBe(g.step.trim().length > 0);
      }),
      RUNS,
    );
    fc.assert(
      fc.property(fc.array(ghost), (gs) => {
        expect(allFaded(gs)).toBe(gs.every((g) => g.step.trim().length > 0));
      }),
      RUNS,
    );
    expect(allFaded([])).toBe(true);
    expect(isFaded({ fear: 'x', step: '   ' })).toBe(false);
  });

  // Feature: haunted-ladder, Property 7: One ghost per fear
  it('Property 7: one ghost per fear step, same order and words', () => {
    fc.assert(
      fc.property(fc.array(stepArb), (steps) => {
        const ghosts = ghostsFromReading(readingOf(steps));
        const fears = steps.filter((s) => s.zone === 'fear').map((s) => s.text);
        expect(ghosts.length).toBe(fears.length);
        expect(ghosts.map((g) => g.fear)).toEqual(fears);
        expect(ghosts.every((g) => !isFaded(g))).toBe(true);
      }),
      RUNS,
    );
  });
});
