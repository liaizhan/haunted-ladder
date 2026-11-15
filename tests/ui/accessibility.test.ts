// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import css from '../../src/styles.css?raw';
import html from '../../index.html?raw';
import { createForm } from '../../src/ui/form';
import { createIntro } from '../../src/ui/intro';
import { buildReading } from '../../src/ui/reading';
import { buildStaircase } from '../../src/ui/staircase';
import { buildCalm } from '../../src/ui/calm';
import { DAWN_BOTTOM, DAWN_TEXT, DAWN_TOP } from '../../src/ui/dawn';
import type { Reading } from '../../src/domain/server';
import type { Ghost } from '../../src/domain/ghosts';

const RUNS = { numRuns: 100 };

// ---- AA contrast of the palette (Requirement 8.4) ----

function variable(name: string): string {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m || !m[1]) throw new Error(`missing --${name}`);
  return m[1];
}

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
}

function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// [text color, background]
const PAIRS: [string, string][] = [
  ['moon', 'night'],
  ['moon', 'night-2'],
  ['mist', 'night'],
  ['mist', 'night-2'],
  ['pumpkin', 'night'],
  ['pumpkin', 'night-2'],
  ['night', 'pumpkin'],
  ['calm-text', 'calm-bg'],
  ['calm-bg', 'calm-text'],
];

describe('Accessibility: contrast (8.4)', () => {
  it('every text and background pair of the palette reaches WCAG AA 4.5:1', () => {
    fc.assert(
      fc.property(fc.constantFrom(...PAIRS), ([fg, bg]) => {
        expect(ratio(variable(fg), variable(bg))).toBeGreaterThanOrEqual(4.5);
      }),
      RUNS,
    );
  });
});

// ---- Keyboard and labels (8.2, 8.3) ----

const phrase = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s.trim().length > 0);

function reading(fears: string[]): Reading {
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
    insights: ['one'],
    questions: ['q1', 'q2'],
    fullDiagnostic: { text: 'Full', url: 'https://108psy.com/x?utm_source=chatgpt_plugin' },
    author: 'Aizhan Li',
    disclaimer: 'Not therapy.',
  };
}

function assertKeyboardReachable(root: Element): void {
  for (const node of Array.from(root.querySelectorAll('[tabindex]'))) {
    const t = Number(node.getAttribute('tabindex'));
    expect(t).toBeLessThanOrEqual(0); // no positive tabindex
  }
  for (const node of Array.from(root.querySelectorAll('[onclick], div[role=button]'))) {
    throw new Error(`not keyboard friendly: ${node.outerHTML}`);
  }
}

describe('Accessibility: keyboard and labels', () => {
  it('the page has a skip link, a language and a focusable main', () => {
    expect(html).toContain('lang="en"');
    expect(html).toContain('class="skip-link" href="#app"');
    expect(html).toContain('id="app" tabindex="-1"');
    expect(css).toContain(':focus-visible');
  });

  it('intro and form fields are native controls and every input has a label', () => {
    const intro = createIntro(() => undefined);
    assertKeyboardReachable(intro);
    expect(intro.querySelector('button')?.textContent).toBe('Start');

    fc.assert(
      fc.property(phrase, phrase, (goal, me) => {
        const form = createForm({
          draft: { goal, me, blocks: ['a', 'b', 'c'], fears: [] },
          onChange: () => undefined,
          onSubmit: () => undefined,
          onClear: () => undefined,
        });
        document.body.replaceChildren(form);
        assertKeyboardReachable(form);
        for (const input of Array.from(form.querySelectorAll('input'))) {
          expect(input.id).not.toBe('');
          expect(form.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
          expect(input.getAttribute('aria-describedby')).not.toBeNull();
        }
        // focus moves into the screen on render
        expect(document.activeElement).not.toBe(document.body);
      }),
      RUNS,
    );
  });

  it('every step field is labelled with its fear, every ghost and stair with its phrase', () => {
    fc.assert(
      fc.property(fc.array(phrase, { minLength: 1, maxLength: 5 }), (fears) => {
        const r = reading(fears);
        const ghosts: Ghost[] = fears.map((fear) => ({ fear, step: '' }));
        const view = buildReading(r, ghosts, { onStepsChange: () => undefined, onSave: () => undefined });
        assertKeyboardReachable(view);
        const inputs = Array.from(view.querySelectorAll('input'));
        expect(inputs).toHaveLength(fears.length);
        inputs.forEach((input, i) => {
          const label = view.querySelector(`label[for="${input.id}"]`);
          expect(label?.textContent).toContain(fears[i] ?? '');
        });

        const svg = buildStaircase(r, ghosts);
        expect(svg.querySelectorAll('.ghost')).toHaveLength(fears.length);
        fears.forEach((fear, i) => {
          expect(svg.querySelector(`.ghost[data-ghost="${i}"]`)?.getAttribute('aria-label')).toContain(fear);
        });
        for (const s of Array.from(svg.querySelectorAll('.stair'))) {
          expect(s.getAttribute('aria-label') ?? '').not.toBe('');
        }
      }),
      RUNS,
    );
  });

  it('calm screens use only buttons and links', () => {
    for (const answer of [
      { kind: 'crisis' as const, message: 'm', helpUrl: 'https://example.org/help' },
      { kind: 'health' as const, message: 'm' },
      { kind: 'error' as const, reason: 'network' as const },
    ]) {
      const node = buildCalm(answer, { onBack: () => undefined, onRetry: () => undefined });
      assertKeyboardReachable(node);
      expect(node.getAttribute('role')).toBe('alert');
      expect(node.querySelectorAll('button').length).toBeGreaterThan(0);
    }
  });
});

// ---- Task 18.4: new color pairs and the reduced-motion rule (11.3, 11.5, 11.6, 11.7) ----

/** The text inside every `@media (prefers-reduced-motion: no-preference) { ... }` block. */
function noPreferenceBlocks(source: string): string[] {
  const blocks: string[] = [];
  const re = /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{/g;
  while (re.exec(source) !== null) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }
    blocks.push(source.slice(re.lastIndex, i - 1));
  }
  return blocks;
}

describe('Accessibility: costume polish (task 18.4)', () => {
  it('the new color pairs reach AA: step label on step fill, intro text on its veil, link and button', () => {
    // The intro veil is night at 85 % over the darkest-to-lightest scene; worst case mixes in the moon.
    const night = variable('night');
    const moon = variable('moon');
    const mix = (a: string, b: string, t: number): string => {
      const ch = [1, 3, 5].map((i) => {
        const x = parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t);
        return Math.round(x).toString(16).padStart(2, '0');
      });
      return `#${ch.join('')}`;
    };
    const veilWorst = mix(night, moon, 0.85);
    expect(ratio(moon, veilWorst)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(variable('mist'), veilWorst)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(moon, variable('night-2'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(variable('night'), variable('pumpkin'))).toBeGreaterThanOrEqual(4.5);
  });

  it('flicker, float, approach and lightning run only under prefers-reduced-motion: no-preference', () => {
    const inside = noPreferenceBlocks(css);
    expect(inside.length).toBeGreaterThan(0);
    let outside = css;
    for (const b of inside) outside = outside.replace(b, '');
    for (const name of ['intro-flicker', 'intro-approach', 'intro-lightning', 'ghost-float']) {
      expect(inside.join('\n')).toMatch(new RegExp(`animation(-name)?:\\s*${name}`));
      expect(outside).not.toMatch(new RegExp(`animation(-name)?:\\s*${name}`));
    }
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*\{[^}]*flicker[^}]*animation: none/);
  });

  it('calm screens hide the intro scene and the page fits 360 px', () => {
    expect(css).toMatch(/body\.calm \.intro-scene\s*\{\s*display:\s*none/);
    expect(css).toContain('overflow-x: hidden');
    expect(css).toMatch(/\.intro\s*\{[^}]*overflow:\s*hidden/);
  });

  it('the intro has the scene, the flickering title and a link to ?demo=1', () => {
    const intro = createIntro(() => undefined);
    const scene = intro.querySelector('.intro-scene');
    expect(scene?.getAttribute('aria-hidden')).toBe('true');
    const imgs = [...intro.querySelectorAll('img')];
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('src')).not.toMatch(/^https?:/);
    }
    expect(intro.querySelector('h1.flicker')?.textContent).toBe('Haunted Ladder');
    const link = intro.querySelector('a');
    expect(link?.textContent).toBe('See a sample ladder');
    expect(link?.getAttribute('href')).toBe('?demo=1');
    expect(intro.querySelector('script, [href^="http"], [src^="http"]')).toBeNull();
    expect(intro.querySelector('.moon, .ghost, .fog, .heart, .stair, .cobweb')).toBeNull();
  });
});

// ---- Task 20.3: dawn colors and motion (13.4, 13.5) ----

describe('Accessibility: dawn (task 20)', () => {
  it('dawn text reaches AA on both ends of the dawn sky', () => {
    expect(ratio(variable('dawn-text'), variable('dawn-top'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(variable('dawn-text'), variable('dawn-bottom'))).toBeGreaterThanOrEqual(4.5);
    // Step labels sit on their own solid fill, so the sky does not change their contrast.
    expect(ratio(variable('moon'), variable('night-2'))).toBeGreaterThanOrEqual(4.5);
  });

  it('the colors in dawn.ts match the CSS variables used on screen', () => {
    expect(DAWN_TOP.toLowerCase()).toBe(variable('dawn-top').toLowerCase());
    expect(DAWN_BOTTOM.toLowerCase()).toBe(variable('dawn-bottom').toLowerCase());
    expect(DAWN_TEXT.toLowerCase()).toBe(variable('dawn-text').toLowerCase());
  });

  it('dawn transitions (4 s in, 2 s out) exist only under prefers-reduced-motion: no-preference', () => {
    const inside = noPreferenceBlocks(css).join('\n');
    expect(inside).toMatch(/\.stage\.dawn[^{]*\{[^}]*transition:[^;}]*4s/);
    expect(inside).toMatch(/transition:[^;}]*2s/);
    let outside = css;
    for (const b of noPreferenceBlocks(css)) outside = outside.replace(b, '');
    const dawnRules = outside.slice(outside.indexOf('/* Dawn:'));
    expect(dawnRules).not.toMatch(/transition:\s*opacity/);
  });
});
