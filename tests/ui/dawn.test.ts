// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import css from '../../src/styles.css?raw';
import { buildDawn, isDawn, setDawn, DAWN_LINE } from '../../src/ui/dawn';
import { buildReading } from '../../src/ui/reading';
import { buildStaircase } from '../../src/ui/staircase';
import { buildExportSvg } from '../../src/ui/exportImage';
import { buildCalm } from '../../src/ui/calm';
import type { Ghost } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';

const RUNS = { numRuns: 100 };

function readingFor(fears: string[]): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'start' },
      { number: 2, zone: 'block', zoneLabel: 'Block', text: 'b1' },
      { number: 3, zone: 'goal', zoneLabel: 'Goal', text: 'goal' },
      ...fears.map((f, i) => ({
        number: 4 + i,
        zone: 'fear' as const,
        zoneLabel: 'Fear',
        text: f,
      })),
    ],
    nearestBlock: 'b1',
    fearsAboveGoal: fears.length,
    insights: [],
    questions: [],
    fullDiagnostic: { text: 'Full', url: 'https://108psy.com/x?utm_source=chatgpt_plugin' },
    author: 'Aizhan Li',
    disclaimer: 'Not therapy.',
  };
}

const stepText = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.string({ maxLength: 20 }),
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
);

describe('Property 16: Dawn comes only with every step', () => {
  it('isDawn is true exactly when there is a ghost and every step is non-empty after trimming', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ fear: fc.string({ minLength: 1, maxLength: 10 }), step: stepText }), {
          maxLength: 5,
        }),
        (ghosts: Ghost[]) => {
          const expected = ghosts.length > 0 && ghosts.every((g) => g.step.trim().length > 0);
          expect(isDawn(ghosts)).toBe(expected);
        },
      ),
      RUNS,
    );
  });

  it('setting and clearing steps in any order keeps the stage class equal to isDawn', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        fc.array(fc.tuple(fc.nat(4), stepText), { maxLength: 25 }),
        (count, ops) => {
          const fears = Array.from({ length: count }, (_, i) => `fear ${i}`);
          const ghosts: Ghost[] = fears.map((fear) => ({ fear, step: '' }));
          const stage = document.createElement('div');
          stage.className = 'stage';
          const dawn = buildDawn();
          stage.append(dawn.sky, dawn.line);
          setDawn(stage, isDawn(ghosts));
          expect(stage.classList.contains('dawn')).toBe(false);

          const view = buildReading(readingFor(fears), ghosts, {
            onStepsChange: (gs) => setDawn(stage, isDawn(gs)),
            onSave: () => undefined,
          });
          document.body.replaceChildren(stage, view);
          const inputs = Array.from(view.querySelectorAll<HTMLInputElement>('.ghost-step input'));
          expect(inputs).toHaveLength(count);

          for (const [i, text] of ops) {
            const input = inputs[i % Math.max(1, count)];
            if (!input) continue; // no ghosts: nothing to type into
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            expect(stage.classList.contains('dawn')).toBe(isDawn(ghosts));
          }
          expect(stage.classList.contains('dawn')).toBe(isDawn(ghosts));
        },
      ),
      RUNS,
    );
  });

  it('with no ghosts there is no dawn, whatever else happens', () => {
    const stage = document.createElement('div');
    setDawn(stage, isDawn([]));
    expect(stage.classList.contains('dawn')).toBe(false);
  });
});

describe('Dawn: the saved picture and the calm screens (13.5, 13.6)', () => {
  it('the saved picture has the dawn line and no moon only when every ghost has a step', () => {
    fc.assert(
      fc.property(fc.array(stepText, { minLength: 1, maxLength: 5 }), (steps) => {
        const fears = steps.map((_, i) => `fear ${i}`);
        const ghosts: Ghost[] = fears.map((fear, i) => ({ fear, step: steps[i] ?? '' }));
        const svg = buildStaircase(readingFor(fears), ghosts);
        const copy = buildExportSvg(svg, ghosts);
        const texts = Array.from(copy.querySelectorAll('text')).map((t) => t.textContent);
        const dawn = isDawn(ghosts);
        expect(texts.includes(DAWN_LINE)).toBe(dawn);
        expect(copy.querySelector('.moon') === null).toBe(dawn);
        expect(copy.querySelector('.sun') !== null).toBe(dawn);
        expect(copy.firstElementChild?.tagName.toLowerCase()).toBe('rect');
      }),
      RUNS,
    );
  });

  it('calm screens contain no dawn element and the CSS hides them', () => {
    for (const answer of [
      { kind: 'crisis' as const, message: 'm', helpUrl: 'https://example.org/help' },
      { kind: 'health' as const, message: 'm' },
      { kind: 'error' as const, reason: 'network' as const },
    ]) {
      const node = buildCalm(answer, { onBack: () => undefined, onRetry: () => undefined });
      expect(node.querySelector('[class*="dawn"]')).toBeNull();
    }
    expect(css).toMatch(/body\.calm \.dawn-sky,\s*body\.calm \.dawn-line\s*\{\s*display:\s*none/);
  });
});
