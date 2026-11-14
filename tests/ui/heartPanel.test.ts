// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import fc from 'fast-check';
import css from '../../src/styles.css?raw';
import { buildHeart } from '../../src/ui/heart';
import { buildStaircase } from '../../src/ui/staircase';
import { beatsPerMinute, secondsPerBeat } from '../../src/domain/pulse';
import { isFaded, type Ghost } from '../../src/domain/ghosts';
import { t } from '../../src/i18n';
import { readingWith } from './staircaseHelpers';

const RUNS = { numRuns: 100 };

const stepText = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
);
const ghostList = fc.array(
  fc.record({ fear: fc.string({ minLength: 1, maxLength: 10 }), step: stepText }),
  { maxLength: 5 },
);

function setReduced(reduced: boolean): void {
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** The CSS between the pulse panel comment and the next section comment. */
function panelCss(): string {
  const start = css.indexOf('/* The pulse panel');
  const end = css.indexOf('/* Fog, moonlight', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return css.slice(start, end);
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>)['matchMedia'];
});

describe('Property 20: A clear heart apart from the text', () => {
  // Feature: haunted-ladder, Property 20: A clear heart apart from the text
  it('the panel comes before the staircase, is crisp, shows the beat rate and has one pulse line', () => {
    fc.assert(
      fc.property(ghostList, fc.boolean(), (ghosts: Ghost[], reduced) => {
        setReduced(reduced);
        const handle = buildHeart(ghosts);
        const stage = document.createElement('div');
        stage.className = 'stage';
        const fears = ghosts.map((g) => g.fear);
        const svg = buildStaircase(readingWith(['a', 'b', 'c'], fears), ghosts);
        stage.append(handle.element, svg);

        // In the flow before the staircase, never inside it and not laid over it.
        expect(handle.element.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(handle.element.contains(svg)).toBe(false);
        expect(svg.contains(handle.element)).toBe(false);
        const panel = panelCss();
        expect(panel).toMatch(/\.heart\s*\{[^}]*position:\s*relative/);
        expect(panel).not.toMatch(/position:\s*absolute/);
        expect(panel).not.toMatch(/blur\(|filter:|opacity:\s*0?\.\d/);

        // Crisp: no filter, no blur, nothing translucent.
        expect(handle.element.querySelector('filter, feGaussianBlur, [filter]')).toBeNull();
        for (const node of Array.from(handle.element.querySelectorAll('*'))) {
          for (const name of ['opacity', 'fill-opacity', 'stop-opacity']) {
            const v = node.getAttribute(name);
            if (v !== null) expect(Number(v)).toBeGreaterThanOrEqual(1);
          }
        }

        // The beat rate is always written, equal to the rate for the unfaded ghosts.
        const unfaded = ghosts.filter((g) => !isFaded(g)).length;
        const bpm = beatsPerMinute(unfaded);
        const rate = handle.element.querySelector('.heart-rate');
        expect(rate).not.toBeNull();
        expect(rate?.hasAttribute('hidden')).toBe(false);
        expect(rate?.textContent).toBe(t('heartRate', { bpm }));
        expect(handle.element.style.getPropertyValue('--beat')).toBe(`${secondsPerBeat(bpm)}s`);

        // One pulse line whose animation length follows --beat.
        expect(handle.element.querySelectorAll('.pulse-line').length).toBe(1);
        expect(handle.element.querySelectorAll('.pulse-track').length).toBe(1);
        expect(css).toMatch(/\.pulse-track\s*\{[^}]*animation:\s*pulse-scroll var\(--beat\)/);
        expect(css).toMatch(/\.heart-shape\s*\{[^}]*animation:\s*heart-beat var\(--beat\)/);
        expect(handle.element.classList.contains('still')).toBe(reduced);
        handle.destroy();
      }),
      RUNS,
    );
  });

  it('under reduced motion the rate text follows every change at once and nothing moves', () => {
    setReduced(true);
    fc.assert(
      fc.property(ghostList, ghostList, (first: Ghost[], second: Ghost[]) => {
        const handle = buildHeart(first);
        handle.update(second);
        const bpm = beatsPerMinute(second.filter((g) => !isFaded(g)).length);
        expect(handle.element.querySelector('.heart-rate')?.textContent).toBe(t('heartRate', { bpm }));
        expect(handle.element.dataset['bpm']).toBe(String(bpm));
        expect(handle.element.classList.contains('still')).toBe(true);
        handle.destroy();
      }),
      RUNS,
    );
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*\.heart \.heart-shape,\s*\.heart \.pulse-track\s*\{\s*animation:\s*none/);
  });
});
