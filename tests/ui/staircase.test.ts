// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, CHAR_W, LABEL_COLOR, STEP_FILL } from '../../src/ui/staircase';
import { buildHeart } from '../../src/ui/heart';
import css from '../../src/styles.css?raw';
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
    fearsAboveGoal: 1,
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

// ---- Property 14 ----

function lum(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
}

function contrast(a: string, b: string): number {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

type Box = { left: number; right: number; top: number; bottom: number };

/** Box of a ghost label from its x, y and wrapped line count (font size 11, line height 1.25). */
function labelBox(label: Element): Box {
  const x = Number(label.getAttribute('x'));
  const y = Number(label.getAttribute('y'));
  const lines = Array.from(label.querySelectorAll('tspan'));
  const widest = Math.max(...lines.map((t) => (t.textContent ?? '').length));
  const w = widest * CHAR_W;
  return {
    left: x - w / 2,
    right: x + w / 2,
    top: y - 11,
    bottom: y + (lines.length - 1) * 11 * 1.25 + 3,
  };
}

const overlaps = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const word = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter((s) => s.trim().length > 0);

function bigReading(blocks: string[], fears: string[]): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'Here' },
      ...blocks.map((b, i) => ({ number: 2 + i, zone: 'block' as const, zoneLabel: 'Block', text: b })),
      { number: 2 + blocks.length, zone: 'goal', zoneLabel: 'Goal', text: 'Goal' },
      ...fears.map((f, i) => ({
        number: 3 + blocks.length + i,
        zone: 'fear' as const,
        zoneLabel: 'Fear',
        text: f,
      })),
    ],
    nearestBlock: blocks[0] ?? null,
    fearsAboveGoal: fears.length,
    insights: [],
    questions: [],
    fullDiagnostic: { text: 't', url: 'https://108psy.com/' },
    author: 'a',
    disclaimer: 'd',
  };
}

describe('staircase readability', () => {
  // Feature: haunted-ladder, Property 14: Labels stay readable
  it('Property 14: step labels sit on solid fills above the heart; ghost labels never overlap', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 1, maxLength: 5 }),
        (blocks, fears) => {
          const r = bigReading(blocks, fears);
          const ghosts = ghostsFromReading(r);
          const heart = buildHeart(ghosts);
          const svg = buildStaircase(r, ghosts);
          const stage = document.createElement('div');
          stage.className = 'stage';
          stage.append(heart.element, svg);
          heart.destroy();

          // The heart comes first in the stage and the staircase is stacked above it.
          expect(
            heart.element.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING,
          ).toBeTruthy();
          expect(css).toMatch(/\.stage \.staircase\s*\{[^}]*position:\s*relative[^}]*z-index:\s*1/);

          // Every step label: drawn after a solid fill, with AA contrast against it.
          const stairs = Array.from(svg.querySelectorAll('.stair'));
          expect(stairs.length).toBe(blocks.length + 2);
          for (const stair of stairs) {
            const fill = stair.querySelector('rect.step-fill');
            const label = stair.querySelector('text.step-label');
            expect(fill).not.toBeNull();
            expect(label).not.toBeNull();
            if (!fill || !label) continue;
            expect(fill.getAttribute('fill-opacity')).toBeNull();
            expect(fill.getAttribute('opacity')).toBeNull();
            expect(fill.getAttribute('fill')).toBe(STEP_FILL);
            expect(label.getAttribute('fill')).toBe(LABEL_COLOR);
            expect(contrast(fill.getAttribute('fill') ?? '', label.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            expect(fill.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            const web = stair.querySelector('.cobweb');
            if (web) {
              expect(web.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            }
          }

          // Ghost labels: inside the picture, below their own ghost, and apart from each other.
          const ghostNodes = Array.from(svg.querySelectorAll('.ghost'));
          expect(ghostNodes.length).toBe(fears.length);
          const boxes: Box[] = [];
          for (const g of ghostNodes) {
            const label = g.querySelector('text.ghost-label');
            const body = g.querySelector('.ghost-body');
            expect(label).not.toBeNull();
            expect(body).not.toBeNull();
            if (!label || !body) continue;
            const box = labelBox(label);
            const t = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(body.getAttribute('transform') ?? '');
            const cy = Number(t?.[2]);
            expect(box.top).toBeGreaterThan(cy + 30); // below the ghost body
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(680);
            boxes.push(box);
          }
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
    const r = bigReading(['a', 'b', 'c'], ['f1', 'f2', 'f3']);
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
