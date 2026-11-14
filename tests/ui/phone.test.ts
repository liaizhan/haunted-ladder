// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, NARROW_MAX, NOTE_FONT } from '../../src/ui/staircase';
import { buildReading } from '../../src/ui/reading';
import { ghostsFromReading, type Ghost } from '../../src/domain/ghosts';
import css from '../../src/styles.css?raw';
import { overlaps, partsOf, readingWith, rectBox, textBox, textFitsCard, type Box } from './staircaseHelpers';

const RUNS = { numRuns: 100 };
const PHONE = 375;

const word = fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0);

describe('staircase on a phone', () => {
  // Feature: haunted-ladder, Property 15: Readable on a phone
  it('Property 15: at 375 px every label renders at 13 px or more, fits its card and never overlaps', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 1, maxLength: 5 }),
        (blocks, fears) => {
          const r = readingWith(blocks, fears);
          const svg = buildStaircase(r, ghostsFromReading(r), { width: PHONE });
          expect(svg.getAttribute('data-layout')).toBe('narrow');
          expect(svg.getAttribute('width')).toBe('100%');
          const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
          const vw = vb[2] ?? 0;
          const vh = vb[3] ?? 0;
          // 1 unit = 1 CSS px: the picture is exactly as wide as the container.
          expect(vw).toBe(PHONE);
          const scale = PHONE / vw;

          const parts = partsOf(svg);
          expect(parts.length).toBe(blocks.length + 2 + fears.length);
          const ghostBoxes: Box[] = [];
          for (const p of parts) {
            const size = Number(p.label.getAttribute('font-size'));
            expect(size * scale).toBeGreaterThanOrEqual(13);
            expect(size).toBe(NOTE_FONT);
            expect(textFitsCard(p.label, p.note, p.zone)).toBe(true);
            const card = rectBox(p.note);
            expect(card.right).toBeLessThanOrEqual(vw);
            expect(card.bottom).toBeLessThanOrEqual(vh);
            if (p.zone === 'fear') ghostBoxes.push(textBox(p.label));
          }
          expect(ghostBoxes.length).toBe(fears.length);
          for (let i = 0; i < ghostBoxes.length; i++) {
            for (let j = i + 1; j < ghostBoxes.length; j++) {
              const a = ghostBoxes[i];
              const b = ghostBoxes[j];
              if (a && b) expect(overlaps(a, b)).toBe(false);
            }
          }
        },
      ),
      RUNS,
    );
  });

  it('reports the wide layout for wide or unknown containers', () => {
    const r = readingWith(['a', 'b', 'c'], ['f']);
    const g = ghostsFromReading(r);
    expect(buildStaircase(r, g).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: 0 }).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: NARROW_MAX }).getAttribute('data-layout')).toBe('wide');
    expect(buildStaircase(r, g, { width: NARROW_MAX - 1 }).getAttribute('data-layout')).toBe('narrow');
  });

  it('draws at 1 unit = 1 px at 360 px width and keeps 680 for wide containers', () => {
    const r = readingWith(['a', 'b', 'c', 'd', 'e'], ['f1', 'f2', 'f3', 'f4', 'f5']);
    const vbWidth = (w?: number): number =>
      Number((buildStaircase(r, ghostsFromReading(r), { width: w }).getAttribute('viewBox') ?? '').split(' ')[2]);
    expect(vbWidth(336)).toBe(336);
    expect(vbWidth(1200)).toBe(680);
    expect(vbWidth()).toBe(680);
    expect(vbWidth(200)).toBe(300);
  });

  it('says so when there are no ghosts, also on a phone', () => {
    const r = readingWith(['a', 'b', 'c'], []);
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
    const r = readingWith(['a', 'b', 'c'], ['f1']);
    r.insights = ['one'];
    r.questions = ['q1', 'q2'];
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
        const r = readingWith(['a', 'b', 'c'], fears);
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
