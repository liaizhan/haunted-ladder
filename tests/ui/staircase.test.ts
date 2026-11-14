// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, LABEL_COLOR, STEP_FILL } from '../../src/ui/staircase';
import { buildHeart } from '../../src/ui/heart';
import css from '../../src/styles.css?raw';
import { ghostsFromReading } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';
import { contrast, overlaps, partsOf, readingWith, textFitsCard, type Box } from './staircaseHelpers';

const RUNS = { numRuns: 100 };

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
        const svg = render(readingWith([block, 'b', 'c'], [fear]));
        const baseline = render(readingWith([plainBlock, 'b', 'c'], [plainFear]));

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
    const svg = render(readingWith(['Dad: no', 'b', 'c'], ['Laugh']));
    expect(svg.querySelectorAll('.cobweb').length).toBe(3);
    expect(svg.querySelectorAll('.ghost').length).toBe(1);
    expect(svg.querySelectorAll('.goal-light').length).toBe(1);
    expect(svg.querySelectorAll('.nearest').length).toBe(1);
    expect(svg.querySelectorAll('.moon').length).toBe(1);
  });

  it('says so when there are no ghosts', () => {
    const svg = render(readingWith(['a', 'b', 'c'], []));
    expect(svg.querySelectorAll('.ghost').length).toBe(0);
    expect(svg.textContent).toContain('No ghosts were found');
  });
});

// ---- Property 14 ----

const word = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => s.trim().length > 0);

describe('staircase readability', () => {
  // Feature: haunted-ladder, Property 14: Labels stay readable
  it('Property 14: every label sits in a solid card with AA contrast, away from the heart; ghost labels never overlap', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 1, maxLength: 5 }),
        (blocks, fears) => {
          const r = readingWith(blocks, fears);
          const ghosts = ghostsFromReading(r);
          const heart = buildHeart(ghosts);
          const svg = buildStaircase(r, ghosts);
          const stage = document.createElement('div');
          stage.className = 'stage';
          stage.append(heart.element, svg);
          heart.destroy();

          // The heart panel comes first in the stage and does not contain or cover the staircase.
          expect(heart.element.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
          expect(heart.element.contains(svg)).toBe(false);
          expect(css).toMatch(/\.stage \.staircase\s*\{[^}]*position:\s*relative[^}]*z-index:\s*1/);

          const parts = partsOf(svg);
          expect(parts.length).toBe(blocks.length + 2 + fears.length);
          for (const p of parts) {
            // Solid card fill, no transparency, label drawn after the card.
            expect(p.note.getAttribute('fill')).toBe(STEP_FILL);
            expect(p.note.getAttribute('fill-opacity')).toBeNull();
            expect(p.note.getAttribute('opacity')).toBeNull();
            expect(p.label.getAttribute('fill')).toBe(LABEL_COLOR);
            expect(contrast(STEP_FILL, LABEL_COLOR)).toBeGreaterThanOrEqual(4.5);
            expect(p.note.compareDocumentPosition(p.label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            expect(textFitsCard(p.label, p.note)).toBe(true);
          }
          // The big spirits stand in the sky band, each in its own slot, left to right,
          // and their step numbers never overlap.
          const vw = Number((svg.getAttribute('viewBox') ?? '').split(' ')[2]);
          const centers = Array.from(svg.querySelectorAll('.ghost')).map((g) => {
            const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.querySelector('.ghost-body')?.getAttribute('transform') ?? '');
            return { x: Number(m?.[1]), y: Number(m?.[2]) };
          });
          expect(centers.length).toBe(fears.length);
          centers.forEach((c, i) => {
            expect(c.x).toBeGreaterThan(0);
            expect(c.x).toBeLessThan(vw);
            const prev = centers[i - 1];
            if (prev) expect(c.x).toBeGreaterThan(prev.x);
          });
          const boxes: Box[] = Array.from(svg.querySelectorAll('.ghost-num')).map((n) => {
            const r = Number(n.getAttribute('r'));
            const x = Number(n.getAttribute('cx'));
            const y = Number(n.getAttribute('cy'));
            return { left: x - r, right: x + r, top: y - r, bottom: y + r };
          });
          for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
              const a = boxes[i];
              const b = boxes[j];
              if (a && b) expect(overlaps(a, b)).toBe(false);
            }
          }
        },
      ),
      RUNS,
    );
  });

  it('unfaded ghosts float with their own loop and phase; faded ones stop', () => {
    const r = readingWith(['a', 'b', 'c'], ['f1', 'f2', 'f3']);
    const svg = buildStaircase(r, [
      { fear: 'f1', step: '' },
      { fear: 'f2', step: '' },
      { fear: 'f3', step: 'done' },
    ]);
    const floats = Array.from(svg.querySelectorAll('.ghost-float'));
    const delays = floats.map((f) => /animation-delay:(-?[\d.]+)s/.exec(f.getAttribute('style') ?? '')?.[1]);
    const durations = floats.map((f) => Number(/animation-duration:([\d.]+)s/.exec(f.getAttribute('style') ?? '')?.[1]));
    expect(new Set(delays).size).toBe(3);
    for (const d of durations) {
      expect(d).toBeGreaterThanOrEqual(3);
      expect(d).toBeLessThanOrEqual(5);
    }
    expect(svg.querySelectorAll('.ghost.faded').length).toBe(1);
    expect(css).toMatch(/\.ghost:not\(\.faded\) \.ghost-float/);
  });
});
