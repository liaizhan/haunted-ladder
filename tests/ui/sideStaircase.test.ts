// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, updateGhosts, staircaseLayout, NOTE_FONT } from '../../src/ui/staircase';
import { ghostsFromReading, type Ghost } from '../../src/domain/ghosts';
import { en } from '../../src/locales/en';
import {
  attr,
  contrast,
  overlaps,
  partsOf,
  readingWith,
  rectBox,
  textFitsCard,
  type Box,
} from './staircaseHelpers';

const RUNS = { numRuns: 100 };

const word = fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0);

describe('Property 19: A night staircase that reads', () => {
  // Feature: haunted-ladder, Property 19: A night staircase that reads
  it('draws one carpet step per step, rising to the right, with a word card for each under the scene', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 300, max: 680 }),
        (blocks, fears, width) => {
          const r = readingWith(blocks, fears);
          const svg = buildStaircase(r, ghostsFromReading(r), { width });
          const L = staircaseLayout(r.steps.length, width);
          const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
          const vw = vb[2] ?? 0;
          const vh = vb[3] ?? 0;
          expect(vw).toBe(width); // 1 unit = 1 CSS px
          expect(attr(svg.querySelector('.moon'), 'cx')).toBeGreaterThan(0);

          const parts = partsOf(svg);
          expect(parts.length).toBe(r.steps.length);

          const plates = parts.map((p) => rectBox(p.plate));
          const cards = parts.map((p) => rectBox(p.note));

          parts.forEach((p, i) => {
            const step = r.steps[i];
            // Reading order, with the full words in the step title.
            expect(p.stair.getAttribute('data-zone')).toBe(step?.zone);
            expect(p.stair.querySelector('title')?.textContent).toBe(step?.text);

            // Each step stands right of and one rise above the previous one.
            const prev = plates[i - 1];
            const cur = plates[i];
            if (prev && cur) {
              expect(cur.left).toBeGreaterThan(prev.left);
              expect(prev.top - cur.top).toBeCloseTo(L.rise, 0);
            }

            // Steps inside the night scene, cards under it, all inside the picture.
            expect(cur?.left).toBeGreaterThanOrEqual(0);
            expect(cur?.right).toBeLessThanOrEqual(vw);
            expect(cur?.top).toBeGreaterThanOrEqual(L.bandH);
            expect(cur?.bottom).toBeLessThanOrEqual(L.sceneH);
            const card = cards[i];
            expect(card?.left).toBeGreaterThanOrEqual(0);
            expect(card?.right).toBeLessThanOrEqual(vw + 0.001);
            expect(card?.top).toBeGreaterThan(L.sceneH);
            expect(card?.bottom).toBeLessThanOrEqual(vh);

            // Text: 13 px or more, every line inside the card after the number and emblem.
            expect(attr(p.label, 'font-size')).toBeGreaterThanOrEqual(NOTE_FONT);
            expect(textFitsCard(p.label, p.note)).toBe(true);

            // Contrast against the element's own fill.
            expect(contrast(p.note.getAttribute('fill') ?? '', p.label.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            const num = p.stair.querySelector('text.plate-num');
            expect(num?.textContent).toBe(String(step?.number));
            expect(contrast(num?.getAttribute('stroke') ?? '', num?.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            const disc = p.stair.querySelector('circle.num-disc');
            const cardNum = p.stair.querySelector('text.card-num');
            expect(cardNum?.textContent).toBe(String(step?.number));
            expect(contrast(disc?.getAttribute('fill') ?? '', cardNum?.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            const badge = p.stair.querySelector('rect.badge');
            const badgeText = p.stair.querySelector('text.badge-text');
            expect(badge !== null).toBe(step?.zone === 'current' || step?.zone === 'goal');
            if (badge && badgeText) {
              expect(contrast(badge.getAttribute('fill') ?? '', badgeText.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            }
          });

          // No card overlaps another card.
          for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
              const a = cards[i];
              const b = cards[j];
              if (a && b) expect(overlaps(a, b)).toBe(false);
            }
          }
          // One warm light over the goal, cobwebs only on obstacles.
          expect(svg.querySelectorAll('.goal-light').length).toBe(1);
          expect(svg.querySelectorAll('.cobweb').length).toBe(blocks.length);
        },
      ),
      RUNS,
    );
  });

  it('fear steps are cold and dim while the ghost has no step and warm with a star once it has one', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }),
        (done) => {
          const fears = done.map((_, i) => `fear ${i}`);
          const r = readingWith(['a', 'b', 'c'], fears);
          const ghosts: Ghost[] = fears.map((fear, i) => ({ fear, step: done[i] ? 'step' : '' }));
          const svg = buildStaircase(r, ghosts);
          const check = (): void => {
            ghosts.forEach((g, i) => {
              const plate = svg.querySelector(`.plate[data-ghost="${i}"]`);
              const stair = svg.querySelector(`.stair[data-fear="${i}"]`);
              const ghost = svg.querySelector(`.ghost[data-ghost="${i}"]`);
              const faded = g.step.trim().length > 0;
              expect(plate?.classList.contains('lit')).toBe(faded);
              expect(plate?.classList.contains('dim')).toBe(!faded);
              expect(stair?.querySelector('.step-star')?.getAttribute('visibility')).toBe(faded ? 'visible' : 'hidden');
              expect(stair?.querySelector('.card-spirit')?.getAttribute('href')).toContain(faded ? 'peri' : 'zheztyrnaq');
              expect(ghost).not.toBeNull();
              if (!ghost) return;
              const float = ghost.querySelector('.ghost-float');
              const label = ghost.querySelector('.ghost-label');
              expect(ghost.querySelector('.spirit-dark')?.getAttribute('opacity')).toBe(faded ? '0' : '1');
              expect(ghost.querySelector('.spirit-light')?.getAttribute('opacity')).toBe(faded ? '1' : '0');
              expect(float?.getAttribute('opacity')).toBeNull();
              expect(ghost.querySelector('.ghost-check')?.getAttribute('visibility')).toBe(faded ? 'visible' : 'hidden');
              // The step number under the spirit stays still: it is outside the floating group.
              expect(label).not.toBeNull();
              expect(label ? float?.contains(label) : true).toBe(false);
            });
          };
          check();
          for (const g of ghosts) g.step = g.step ? '' : 'again';
          updateGhosts(svg, ghosts);
          check();
        },
      ),
      RUNS,
    );
  });

  it('puts a spirit in each fear card and the "me" and "goal" badges in the cards', () => {
    const r = readingWith(['a', 'b', 'c'], ['f1', 'f2']);
    const svg = buildStaircase(r, ghostsFromReading(r));
    const parts = partsOf(svg);
    const me = parts[0]?.stair.querySelector('text.badge-text')?.textContent;
    const goal = parts[4]?.stair.querySelector('text.badge-text')?.textContent;
    expect(me).toBe(en.badgeMe);
    expect(goal).toBe(en.badgeGoal);
    expect(svg.querySelectorAll('.ghost').length).toBe(2);
    expect(svg.querySelectorAll('.nearest').length).toBe(1);
    expect(svg.querySelector('.nearest rect.note')?.getAttribute('stroke')).toBe('#FF8A3D');
    for (const p of parts.filter((x) => x.zone === 'fear')) {
      const spirit = rectBox(p.stair.querySelector('.card-spirit'));
      const card = rectBox(p.note);
      expect(overlaps(spirit, card)).toBe(true);
      expect(spirit.left).toBeGreaterThanOrEqual(card.left);
      expect(spirit.right).toBeLessThanOrEqual(card.right);
    }
  });

  it('the long words stay whole in the step title when the card text is cut', () => {
    const long = 'word '.repeat(60).trim();
    const r = readingWith([long, 'b', 'c'], [long]);
    const svg = buildStaircase(r, ghostsFromReading(r), { width: 300 });
    const parts = partsOf(svg);
    expect(parts[1]?.stair.querySelector('title')?.textContent).toBe(long);
    expect(parts[1]?.label.textContent).toContain('…');
    const boxes: Box[] = parts.map((p) => rectBox(p.note));
    expect(boxes.length).toBe(r.steps.length);
  });
});
