import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { beatsPerMinute, secondsPerBeat } from '../../src/domain/pulse';

const RUNS = { numRuns: 100 };

describe('pulse', () => {
  // Feature: haunted-ladder, Property 11: Calmer with every step
  it('Property 11: more unfaded ghosts never means a slower heart, always 60..120', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 }), (x, y) => {
        const a = Math.min(x, y);
        const b = Math.max(x, y);
        expect(beatsPerMinute(a)).toBeLessThanOrEqual(beatsPerMinute(b));
        expect(beatsPerMinute(a)).toBeGreaterThanOrEqual(60);
        expect(beatsPerMinute(b)).toBeLessThanOrEqual(120);
      }),
      RUNS,
    );
    expect(beatsPerMinute(0)).toBe(60);
    expect(beatsPerMinute(1)).toBe(72);
    expect(beatsPerMinute(5)).toBe(120);
  });

  it('secondsPerBeat is 60 / bpm', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 120 }), (bpm) => {
        expect(secondsPerBeat(bpm)).toBeCloseTo(60 / bpm, 10);
      }),
      RUNS,
    );
  });
});
