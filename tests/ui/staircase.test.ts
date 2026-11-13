// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase } from '../../src/ui/staircase';
import { ghostsFromReading } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';

const RUNS = { numRuns: 100 };

function readingWith(block: string, fear: string): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'Here' },
      { number: 2, zone: 'block', zoneLabel: 'Block', text: block },
      { number: 3, zone: 'goal', zoneLabel: 'Goal', text: 'Goal' },
      { number: 4, zone: 'fear', zoneLabel: 'Fear', text: fear },
    ],
    nearestBlock: block,
    fearsAboveGoal: [fear],
    insights: [],
    questions: [],
    fullDiagnostic: { text: 't', url: 'https://108psy.com/' },
    author: 'a',
    disclaimer: 'd',
  };
}

function render(r: Reading): SVGSVGElement {
  return buildStaircase(r, ghostsFromReading(r));
}

describe('staircase', () => {
  // Feature: haunted-ladder, Property 10: Text is never HTML
  it('Property 10: phrases with < > & are text and add no elements', () => {
    const phrase = fc
      .array(fc.constantFrom('<', '>', '&', 'a', 'b', '/', '"', "'", ';'), {
        minLength: 1,
        maxLength: 40,
      })
      .map((cs) => cs.join(''));
    fc.assert(
      fc.property(phrase, phrase, (block, fear) => {
        const plainBlock = 'x'.repeat(block.length);
        const plainFear = 'x'.repeat(fear.length);
        const svg = render(readingWith(block, fear));
        const baseline = render(readingWith(plainBlock, plainFear));

        expect(svg.querySelectorAll('*').length).toBe(baseline.querySelectorAll('*').length);
        expect(svg.querySelector('script, img, b, i, svg svg')).toBeNull();

        const text = svg.textContent ?? '';
        expect(text).toContain(block);
        expect(text).toContain(fear);
        const ghostTitle = svg.querySelector('.ghost title');
        expect(ghostTitle?.textContent).toBe(fear);
      }),
      RUNS,
    );
  });

  it('draws cobwebs, ghosts, a lit goal and the nearest block', () => {
    const svg = render(readingWith('Dad: no', 'Laugh'));
    expect(svg.querySelectorAll('.cobweb').length).toBe(1);
    expect(svg.querySelectorAll('.ghost').length).toBe(1);
    expect(svg.querySelectorAll('.goal-light').length).toBe(1);
    expect(svg.querySelectorAll('.nearest').length).toBe(1);
  });

  it('says so when there are no ghosts', () => {
    const r = readingWith('b', 'f');
    r.steps = r.steps.filter((s) => s.zone !== 'fear');
    const svg = render(r);
    expect(svg.querySelectorAll('.ghost').length).toBe(0);
    expect(svg.textContent).toContain('No ghosts were found');
  });
});
