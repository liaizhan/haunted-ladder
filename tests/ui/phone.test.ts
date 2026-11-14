// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  buildStaircase,
  charWidth,
  LABEL_COLOR,
  NARROW_FONT,
  NARROW_MAX,
  STEP_FILL,
} from '../../src/ui/staircase';
import { buildReading } from '../../src/ui/reading';
import { ghostsFromReading, type Ghost } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';
import css from '../../src/styles.css?raw';

const RUNS = { numRuns: 100 };
const PHONE = 375;

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

function reading(blocks: string[], fears: string[]): Reading {
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
    insights: ['one'],
    questions: ['q1', 'q2'],
    fullDiagnostic: { text: 't', url: 'https://108psy.com/?utm_source=chatgpt_plugin' },
    author: 'a',
    disclaimer: 'd',
  };
}

const word = fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0);

type Box = { left: number; right: number; top: number; bottom: number };
const overlaps = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

function lines(label: Element): string[] {
  return Array.from(label.querySelectorAll('tspan')).map((t) => t.textContent ?? '');
}

describe('staircase on a phone', () => {
  // Feature: haunted-ladder, Property 15: Readable on a phone
  it('Property 15: labels render at 13 px or more, fit their slots and never overlap', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 1, maxLength: 5 }),
        (blocks, fears) => {
          const r = reading(blocks, fears);
          const svg = buildStaircase(r, ghostsFromReading(r), { width: PHONE });
          expect(svg.getAttribute('data-layout')).toBe('narrow');
          const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
          const vw = vb[2] ?? 0;
          const vh = vb[3] ?? 0;
          const scale = PHONE / vw; // the svg is width 100% of the container
          expect(svg.getAttribute('width')).toBe('100%');

          // Step labels: size, solid fill under them, AA contrast, inside their row.
          const stairs = Array.from(svg.querySelectorAll('.stair'));
          expect(stairs.length).toBe(blocks.length + 2);
          for (const stair of stairs) {
            const fill = stair.querySelector('rect.step-fill');
            const label = stair.querySelector('text.step-label');
            expect(fill).not.toBeNull();
            expect(label).not.toBeNull();
            if (!fill || !label) continue;
            const size = Number(label.getAttribute('font-size'));
            expect(size * scale).toBeGreaterThanOrEqual(13);
            expect(fill.getAttribute('fill')).toBe(STEP_FILL);
            expect(label.getAttribute('fill')).toBe(LABEL_COLOR);
            expect(contrast(STEP_FILL, LABEL_COLOR)).toBeGreaterThanOrEqual(4.5);
            expect(fill.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            const web = stair.querySelector('.cobweb');
            if (web) {
              expect(web.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
            }
            const rx = Number(fill.getAttribute('x'));
            const ry = Number(fill.getAttribute('y'));
            const rw = Number(fill.getAttribute('width'));
            const rh = Number(fill.getAttribute('height'));
            const lx = Number(label.getAttribute('x'));
            const ly = Number(label.getAttribute('y'));
            const ls = lines(label);
            expect(ls.length).toBeLessThanOrEqual(3);
            for (const line of ls) {
              expect(lx + line.length * charWidth(size)).toBeLessThanOrEqual(rx + rw);
            }
            expect(ly + (ls.length - 1) * size * 1.25 + 3).toBeLessThanOrEqual(ry + rh);
            expect(rx + rw).toBeLessThanOrEqual(vw);
            expect(ry + rh).toBeLessThanOrEqual(vh);
          }

          // Ghost labels: size, inside the picture, clear of the ghost body and of each other.
          const boxes: Box[] = [];
          for (const g of Array.from(svg.querySelectorAll('.ghost'))) {
            const label = g.querySelector('text.ghost-label');
            const body = g.querySelector('.ghost-body');
            expect(label).not.toBeNull();
            expect(body).not.toBeNull();
            if (!label || !body) continue;
            const size = Number(label.getAttribute('font-size'));
            expect(size * scale).toBeGreaterThanOrEqual(13);
            expect(size).toBe(NARROW_FONT);
            const lx = Number(label.getAttribute('x'));
            const ly = Number(label.getAttribute('y'));
            const ls = lines(label);
            const widest = Math.max(...ls.map((l) => l.length));
            const box: Box = {
              left: lx,
              right: lx + widest * charWidth(size),
              top: ly - size,
              bottom: ly + (ls.length - 1) * size * 1.25 + 3,
            };
            expect(box.right).toBeLessThanOrEqual(vw);
            expect(box.bottom).toBeLessThanOrEqual(vh);
            const t = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(body.getAttribute('transform') ?? '');
            const cx = Number(t?.[1]);
            expect(box.left).toBeGreaterThan(cx + 26); // beside the ghost, not on it
            boxes.push(box);
          }
          expect(boxes.length).toBe(fears.length);
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

  it('keeps the wide drawing for wide or unknown containers', () => {
    const r = reading(['a', 'b', 'c'], ['f']);
    const g = ghostsFromReading(r);
    expect(buildStaircase(r, g).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: 0 }).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: NARROW_MAX }).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: NARROW_MAX - 1 }).getAttribute('data-layout')).toBe('narrow');
  });

  it('draws the phone layout at 360 px width without going wider than the container', () => {
    const r = reading(['a', 'b', 'c', 'd', 'e'], ['f1', 'f2', 'f3', 'f4', 'f5']);
    const svg = buildStaircase(r, ghostsFromReading(r), { width: 336 });
    const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect(vb[2]).toBe(336);
  });

  it('says so when there are no ghosts, also on a phone', () => {
    const r = reading(['a', 'b', 'c'], []);
    const svg = buildStaircase(r, [], { width: PHONE });
    expect(svg.querySelectorAll('.ghost').length).toBe(0);
    expect(svg.textContent).toContain('No ghosts were found');
  });
});

describe('result layout and step icons', () => {
  it('lays out the result in two columns from 900 px, ghost steps first on a phone', () => {
    expect(css).toMatch(/@media \(min-width: 900px\)[\s\S]*?\.result\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.result > \.stage\s*\{[^}]*position:\s*sticky/);
    // Phone order: staircase, then ghost steps, then sound toggle, then the rest.
    const order = (sel: string): number => {
      const m = new RegExp(`${sel.replace(/[.>()]/g, '\\$&')}\\s*\\{\\s*order:\\s*(\\d+)`).exec(css);
      return Number(m?.[1]);
    };
    expect(order('.result > .stage')).toBeLessThan(order('.result .ghost-block'));
    expect(order('.result .ghost-block')).toBeLessThan(order('.result > .sound-row'));
    expect(order('.result > .sound-row')).toBeLessThan(order('.result > .reading > :not(.ghost-block)'));
  });

  it('puts the ghost steps before the insights and questions', () => {
    const r = reading(['a', 'b', 'c'], ['f1']);
    const el = buildReading(r, ghostsFromReading(r), { onStepsChange: () => {}, onSave: () => {} });
    const kids = Array.from(el.children);
    const block = kids.findIndex((k) => k.classList.contains('ghost-block'));
    const insights = kids.findIndex((k) => k.classList.contains('insights'));
    const questions = kids.findIndex((k) => k.classList.contains('questions'));
    expect(block).toBe(0);
    expect(insights).toBeGreaterThan(block);
    expect(questions).toBeGreaterThan(insights);
  });

  // Feature: haunted-ladder, Property 15: Readable on a phone (icon follows its ghost)
  it('Property 15: each field icon is 1 without a step and 0.15 with a step', () => {
    const typed = fc.array(fc.string({ maxLength: 20 }), { minLength: 1, maxLength: 5 });
    fc.assert(
      fc.property(typed, (steps) => {
        const fears = steps.map((_, i) => `fear ${i}`);
        const r = reading(['a', 'b', 'c'], fears);
        const seen: Ghost[][] = [];
        const el = buildReading(r, ghostsFromReading(r), {
          onStepsChange: (g) => seen.push(g),
          onSave: () => {},
        });
        document.body.append(el);
        const inputs = Array.from(el.querySelectorAll<HTMLInputElement>('.ghost-step input'));
        expect(inputs.length).toBe(steps.length);
        const icons = () =>
          Array.from(el.querySelectorAll('.ghost-step .step-ghost-icon')).map((i) =>
            i.getAttribute('opacity'),
          );
        expect(icons()).toEqual(steps.map(() => '1'));
        inputs.forEach((input, i) => {
          input.value = steps[i] ?? '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(seen.length).toBe(steps.length);
        expect(icons()).toEqual(steps.map((s) => (s.trim().length > 0 ? '0.15' : '1')));
        // Clearing brings the icon back.
        inputs.forEach((input) => {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(icons()).toEqual(steps.map(() => '1'));
        el.remove();
      }),
      RUNS,
    );
  });
});
