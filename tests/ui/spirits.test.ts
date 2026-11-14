// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildStaircase, updateGhosts, EMBLEM_SIZE } from '../../src/ui/staircase';
import { buildReading, buildLegend, LEGEND_ITEMS } from '../../src/ui/reading';
import { buildExportSvg, inlineImages } from '../../src/ui/exportImage';
import { ART_BASE, artUrl } from '../../src/ui/art';
import { ghostsFromReading, type Ghost } from '../../src/domain/ghosts';
import { dictionaries } from '../../src/i18n';
import css from '../../src/styles.css?raw';
import { attr, partsOf, readingWith } from './staircaseHelpers';

const RUNS = { numRuns: 100 };

const word = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0);
const stepText = fc.oneof(fc.constant(''), fc.constant('   '), word);

const isHidden = (n: Element): boolean => n.getAttribute('aria-hidden') === 'true' || n.getAttribute('alt') === '';

function allArt(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('image, img'));
}

describe('Property 21: The Zheztyrnaq turns into a Peri', () => {
  // Feature: haunted-ladder, Property 21: The Zheztyrnaq turns into a Peri
  it('every ghost holds one Zheztyrnaq and one Peri; exactly one is shown, and the check goes with the Peri', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(stepText, { minLength: 1, maxLength: 5 }),
        (blocks, steps) => {
          const fears = steps.map((_, i) => `fear ${i}`);
          const r = readingWith(blocks, fears);
          const ghosts: Ghost[] = fears.map((fear, i) => ({ fear, step: steps[i] ?? '' }));
          const svg = buildStaircase(r, ghosts);

          const check = (gs: Ghost[]): void => {
            expect(svg.querySelectorAll('.ghost').length).toBe(gs.length);
            // Lower spirits are drawn in front, so the DOM order is not the fear order.
            const roots = gs.map((_, i) => svg.querySelector(`.ghost[data-ghost="${i}"]`) as Element);
            roots.forEach((root, i) => {
              const written = (gs[i]?.step ?? '').trim().length > 0;
              const dark = root.querySelectorAll('image.spirit-dark');
              const light = root.querySelectorAll('image.spirit-light');
              expect(dark.length).toBe(1);
              expect(light.length).toBe(1);
              // Each Zheztyrnaq has its own pose: rise, peek or crawl.
              expect(dark[0]?.getAttribute('href') ?? '').toMatch(/zheztyrnaq-(rise|peek|crawl)\.webp$/);
              expect(light[0]?.getAttribute('href')).toBe(artUrl('peri'));
              expect(dark[0]?.getAttribute('opacity')).toBe(written ? '0' : '1');
              expect(light[0]?.getAttribute('opacity')).toBe(written ? '1' : '0');
              expect(root.querySelector('.ghost-check')?.getAttribute('visibility')).toBe(
                written ? 'visible' : 'hidden',
              );
              // The ghost keeps its parts and its plain translate(x y).
              expect(root.querySelector('.ghost-float .ghost-body')?.getAttribute('transform')).toMatch(
                /^translate\([-\d.]+ [-\d.]+\)$/,
              );
              expect(root.querySelector('text.ghost-label')?.textContent?.length).toBeGreaterThan(0);
            });
          };
          check(ghosts);

          // Writing or clearing steps turns the spirits the other way.
          const flipped = ghosts.map((g) => ({ ...g, step: g.step.trim() ? '' : 'a step' }));
          updateGhosts(svg, flipped);
          check(flipped);
        },
      ),
      RUNS,
    );
  });

  it('every card that is not a fear holds exactly one emblem for its zone, and its text starts after it', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 0, maxLength: 5 }),
        fc.integer({ min: 300, max: 680 }),
        (blocks, fears, width) => {
          const r = readingWith(blocks, fears);
          const svg = buildStaircase(r, ghostsFromReading(r), { width });
          let nearestSeen = false;
          for (const p of partsOf(svg)) {
            const emblems = p.stair.querySelectorAll('image.emblem');
            if (p.zone === 'fear') {
              expect(emblems.length).toBe(0);
              continue;
            }
            expect(emblems.length).toBe(1);
            const emblem = emblems[0];
            const isNearest = p.stair.classList.contains('nearest');
            if (isNearest) nearestSeen = true;
            const expected =
              p.zone === 'current' ? 'shanyraq' : p.zone === 'goal' ? 'burkit' : isNearest ? 'asyq' : 'tumar';
            expect(emblem?.getAttribute('data-emblem')).toBe(expected);
            expect(emblem?.getAttribute('href')).toBe(artUrl(expected));
            expect(attr(emblem, 'width')).toBe(EMBLEM_SIZE);
            // Inside its card, and the words start to the right of it.
            const note = p.note;
            expect(attr(emblem, 'x')).toBeGreaterThanOrEqual(attr(note, 'x'));
            expect(attr(emblem, 'x') + attr(emblem, 'width')).toBeLessThanOrEqual(attr(p.label, 'x'));
            const badge = p.stair.querySelector('rect.badge');
            if (badge) {
              expect(attr(badge, 'x')).toBeGreaterThanOrEqual(attr(emblem, 'x') + attr(emblem, 'width'));
            }
          }
          expect(nearestSeen).toBe(true);
        },
      ),
      RUNS,
    );
  });

  it('every picture comes from BASE_URL + art/, is hidden from screen readers, and the backdrop is first', () => {
    fc.assert(
      fc.property(
        fc.array(word, { minLength: 1, maxLength: 5 }),
        fc.array(word, { minLength: 1, maxLength: 5 }),
        (blocks, fears) => {
          expect(ART_BASE).toBe(`${import.meta.env.BASE_URL}art/`);
          const r = readingWith(blocks, fears);
          const ghosts = ghostsFromReading(r);
          const svg = buildStaircase(r, ghosts);

          // The night sky fill comes first, then the mirrored steppe picture over the whole scene.
          expect(svg.firstElementChild?.classList.contains('night-sky')).toBe(true);
          const first = svg.querySelector('image.backdrop');
          expect(first).not.toBeNull();
          // Only the sky, the stars and the backdrop's clip path may come before it.
          expect(Array.from(svg.children).indexOf(first as Element)).toBeLessThanOrEqual(3);
          expect(first?.getAttribute('href')).toBe(artUrl('steppe-night'));
          expect(attr(first, 'width')).toBeGreaterThan(0);
          expect(attr(first, 'height')).toBeGreaterThan(0);

          const reading = buildReading(r, ghosts, { onStepsChange: () => {}, onSave: () => {} });
          const legend = buildLegend();
          const heading = reading.querySelector('.ghost-heading');
          expect(heading?.querySelectorAll('img.emblem-qobyz').length).toBe(1);
          expect(heading?.querySelector('img')?.getAttribute('src')).toBe(artUrl('qobyz'));

          const pictures = [...allArt(svg), ...allArt(reading), ...allArt(legend)];
          // backdrop + 3 per ghost; per step a carpet plate, a star and a card emblem or spirit;
          // the steps without a fear also carry an emblem on the carpet; + qobyz + 7 legend pictures;
          // + a medallion of two pictures (Zheztyrnaq and Peri) next to every step field
          const steps = blocks.length + 2 + fears.length;
          expect(pictures.length).toBe(
            1 + 3 * fears.length + 3 * steps + (blocks.length + 2) + 1 + 7 + 2 * fears.length,
          );
          for (const pic of pictures) {
            const href = pic.getAttribute('href') ?? pic.getAttribute('src') ?? '';
            expect(href.startsWith(ART_BASE)).toBe(true);
            expect(isHidden(pic)).toBe(true);
          }
          // The accessible names stay the person's words.
          for (const g of Array.from(svg.querySelectorAll('.ghost'))) {
            expect(g.getAttribute('aria-label')).toContain(g.querySelector('title')?.textContent ?? '?');
          }
        },
      ),
      RUNS,
    );
  });

  it('turning plays through the turning picture only when a step changes', () => {
    const r = readingWith(['a', 'b', 'c'], ['f1', 'f2']);
    const ghosts = ghostsFromReading(r);
    const svg = buildStaircase(r, ghosts);
    const turning = (i: number): boolean => svg.querySelector(`.ghost[data-ghost="${i}"]`)?.classList.contains('turning') ?? false;
    expect(svg.querySelectorAll('image.spirit-turning').length).toBe(2);
    expect(svg.querySelector('image.spirit-turning')?.getAttribute('href')).toBe(artUrl('spirit-turning'));
    expect(svg.querySelector('image.spirit-turning')?.getAttribute('opacity')).toBe('0');
    expect(turning(0)).toBe(false);
    const next = ghosts.map((g, i) => ({ ...g, step: i === 0 ? 'one step' : '' }));
    updateGhosts(svg, next);
    expect(turning(0)).toBe(true);
    expect(turning(1)).toBe(false);
  });

  it('the turn is a CSS animation that only plays when motion is welcome; dawn lets the sky through', () => {
    const blocks: string[] = [];
    const re = /@media \(prefers-reduced-motion: no-preference\)\s*\{/g;
    while (re.exec(css)) {
      let depth = 1;
      let i = re.lastIndex;
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') depth--;
        i++;
      }
      blocks.push(css.slice(re.lastIndex, i - 1));
    }
    const inside = blocks.join('\n');
    expect(inside).toMatch(/\.ghost\.turning \.spirit-turning\s*\{[^}]*animation:\s*spirit-turn/);
    let outside = css;
    for (const b of blocks) outside = outside.replace(b, '');
    expect(outside).not.toMatch(/animation:\s*spirit-turn/);
    expect(css).toMatch(/\.stage\.dawn \.staircase \.backdrop\s*\{[^}]*opacity:\s*0\.35/);
  });

  it('the legend shows the seven pictures with the texts of the chosen language', () => {
    const legend = buildLegend();
    const items = Array.from(legend.querySelectorAll('li'));
    expect(items.length).toBe(7);
    expect(LEGEND_ITEMS.map((i) => i.art)).toEqual([
      'zheztyrnaq',
      'peri',
      'shanyraq',
      'asyq',
      'tumar',
      'qobyz',
      'burkit',
    ]);
    items.forEach((li, i) => {
      expect(li.querySelector('img')?.getAttribute('width')).toBe('48');
      expect(li.querySelector('p')?.textContent).toBe(dictionaries.en[LEGEND_ITEMS[i]?.key ?? 'legendTitle']);
    });
    expect(dictionaries.en.legendQobyz).toBe(
      'A horsehair fiddle (Qobyz). In the legend, the bard Korkyt Ata played it to keep death away.',
    );
  });

  it('bugfix english-legend-clarity: in English the meaning comes first and the Kazakh name is in brackets', () => {
    for (const item of LEGEND_ITEMS) {
      const line = dictionaries.en[item.key];
      const name = /\(([^)]+)\)/.exec(line)?.[1] ?? '';
      expect(name.toLowerCase()).toBe(item.art);
      expect(line.startsWith(name)).toBe(false);
    }
  });

  it('in the saved picture every image is a data: URL; one that fails to load is left out', async () => {
    const r = readingWith(['a', 'b', 'c'], ['f1', 'f2']);
    const ghosts = ghostsFromReading(r);
    const first = ghosts[0];
    if (first) first.step = 'step';
    const copy = buildExportSvg(buildStaircase(r, ghosts), ghosts);
    expect(copy.querySelectorAll('image').length).toBeGreaterThan(0);

    const loaded: string[] = [];
    await inlineImages(copy, async (url) => {
      loaded.push(url);
      return `data:image/webp;base64,${btoa(url)}`;
    });
    for (const img of Array.from(copy.querySelectorAll('image'))) {
      expect(img.getAttribute('href')?.startsWith('data:')).toBe(true);
    }
    // Each distinct picture is loaded once.
    expect(new Set(loaded).size).toBe(loaded.length);

    const copy2 = buildExportSvg(buildStaircase(r, ghosts), ghosts);
    const before = copy2.querySelectorAll('image').length;
    await inlineImages(copy2, async (url) => {
      if (url === artUrl('steppe-night')) throw new Error('no');
      return 'data:image/webp;base64,AA==';
    });
    expect(copy2.querySelector('image.backdrop')).toBeNull();
    expect(copy2.querySelectorAll('image').length).toBe(before - 1);
    for (const img of Array.from(copy2.querySelectorAll('image'))) {
      expect(img.getAttribute('href')?.startsWith('data:')).toBe(true);
    }
  });
});
