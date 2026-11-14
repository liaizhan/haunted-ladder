// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, updateGhosts, CARD_H, NOTE_FONT, PLATE_H, ROW } from '../../src/ui/staircase';
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

describe('Property 19: A side staircase that reads', () => {
  // Feature: haunted-ladder, Property 19: A side staircase that reads
  it('draws one plate per step, rising to the right, with cards to the right and nothing overlapping', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 300, max: 680 }),
        (blocks, fears, width) => {
          const r = readingWith(blocks, fears);
          const svg = buildStaircase(r, ghostsFromReading(r), { width });
          const vb = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
          const vw = vb[2] ?? 0;
          const vh = vb[3] ?? 0;
          expect(vw).toBe(width); // 1 unit = 1 CSS px
          expect(attr(svg.querySelector('.moon'), 'cx')).toBeGreaterThan(0);

          const parts = partsOf(svg);
          expect(parts.length).toBe(r.steps.length);

          const plates = parts.map((p) => rectBox(p.plate));
          const cards = parts.map((p) => rectBox(p.note));
          const maxPlateRight = Math.max(...plates.map((b) => b.right));

          parts.forEach((p, i) => {
            const step = r.steps[i];
            // Reading order, with the full words in the plate title.
            expect(p.stair.getAttribute('data-zone')).toBe(step?.zone);
            expect(p.stair.querySelector('title')?.textContent).toBe(step?.text);

            // One plate width right and one row up from the previous plate.
            const prev = plates[i - 1];
            const cur = plates[i];
            if (prev && cur) {
              expect(cur.left - prev.left).toBe(attr(p.plate, 'width'));
              expect(prev.top - cur.top).toBe(ROW);
            }

            // Inside the picture.
            for (const b of [plates[i], cards[i]]) {
              expect(b?.left).toBeGreaterThanOrEqual(0);
              expect(b?.top).toBeGreaterThanOrEqual(0);
              expect(b?.right).toBeLessThanOrEqual(vw);
              expect(b?.bottom).toBeLessThanOrEqual(vh);
            }

            // The card starts right of every plate; its leader joins plate edge and card edge.
            expect(cards[i]?.left).toBeGreaterThan(maxPlateRight);
            const leader = p.stair.querySelector('line.leader');
            expect(attr(leader, 'x1')).toBe(plates[i]?.right);
            expect(attr(leader, 'x2')).toBe(cards[i]?.left);
            expect(attr(leader, 'y1')).toBe(attr(leader, 'y2'));
            expect(attr(leader, 'y1')).toBe((plates[i]?.top ?? 0) + PLATE_H / 2);
            expect(attr(leader, 'y1')).toBe((cards[i]?.top ?? 0) + CARD_H / 2);
            expect(p.stair.querySelector('circle.leader-dot')).not.toBeNull();

            // Text: 13 px or more, every line inside the card.
            expect(attr(p.label, 'font-size')).toBeGreaterThanOrEqual(NOTE_FONT);
            expect(textFitsCard(p.label, p.note, p.zone)).toBe(true);

            // Contrast against the element's own fill.
            expect(contrast(p.note.getAttribute('fill') ?? '', p.label.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            const num = p.stair.querySelector('text.plate-num');
            if (num) {
              expect(num.textContent).toBe(String(step?.number));
              expect(contrast(p.plate.getAttribute('fill') ?? '', num.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            }
            const badge = p.stair.querySelector('rect.badge');
            const badgeText = p.stair.querySelector('text.badge-text');
            expect(badge !== null).toBe(step?.zone === 'current' || step?.zone === 'goal');
            if (badge && badgeText) {
              expect(contrast(badge.getAttribute('fill') ?? '', badgeText.getAttribute('fill') ?? '')).toBeGreaterThanOrEqual(4.5);
            }
          });

          // No card overlaps another card or any plate.
          for (let i = 0; i < cards.length; i++) {
            for (let j = 0; j < cards.length; j++) {
              const a = cards[i];
              const b = cards[j];
              if (a && b && i < j) expect(overlaps(a, b)).toBe(false);
              const pl = plates[j];
              if (a && pl) expect(overlaps(a, pl)).toBe(false);
            }
          }
          // A banister post on each plate, one floor line, one lantern over the goal.
          expect(svg.querySelectorAll('rect.post').length).toBe(r.steps.length);
          expect(svg.querySelectorAll('line.floor').length).toBe(1);
          expect(svg.querySelectorAll('.goal-light').length).toBe(1);
          // Cobwebs only on obstacles.
          expect(svg.querySelectorAll('.cobweb').length).toBe(blocks.length);
        },
      ),
      RUNS,
    );
  });

  it('fear plates are dashed while the ghost has no step and solid and moonlit once it has one', () => {
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
              const plate = svg.querySelector(`rect.plate[data-ghost="${i}"]`);
              const ghost = svg.querySelector(`.ghost[data-ghost="${i}"]`);
              const faded = g.step.trim().length > 0;
              expect(plate?.hasAttribute('stroke-dasharray')).toBe(!faded);
              expect(plate?.classList.contains('lit')).toBe(faded);
              expect(ghost).not.toBeNull();
              if (!ghost) return;
              const float = ghost.querySelector('.ghost-float');
              const label = ghost.querySelector('.ghost-label');
              expect(ghost.querySelector('.spirit-dark')?.getAttribute('opacity')).toBe(faded ? '0' : '1');
              expect(ghost.querySelector('.spirit-light')?.getAttribute('opacity')).toBe(faded ? '1' : '0');
              expect(float?.getAttribute('opacity')).toBeNull();
              expect(ghost.querySelector('.ghost-check')?.getAttribute('visibility')).toBe(faded ? 'visible' : 'hidden');
              // The words stay readable: the label is outside the faded group.
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

  it('puts a ghost inside its fear card and the "me" and "goal" badges in the cards', () => {
    const r = readingWith(['a', 'b', 'c'], ['f1', 'f2']);
    const svg = buildStaircase(r, ghostsFromReading(r));
    const parts = partsOf(svg);
    const me = parts[0]?.stair.querySelector('text.badge-text')?.textContent;
    const goal = parts[4]?.stair.querySelector('text.badge-text')?.textContent;
    expect(me).toBe(en.badgeMe);
    expect(goal).toBe(en.badgeGoal);
    expect(svg.querySelectorAll('.ghost').length).toBe(2);
    expect(svg.querySelectorAll('.nearest').length).toBe(1);
    expect(svg.querySelector('.nearest rect.plate')?.getAttribute('stroke')).toBe('#FF8A3D');
  });

  it('the long words stay whole in the plate title when the card text is cut', () => {
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
