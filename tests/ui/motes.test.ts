// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { dissolve, MOTE_MAX, MOTE_MIN, MOTE_MS_MAX, MOTE_MS_MIN } from '../../src/ui/motes';
import { buildStaircase } from '../../src/ui/staircase';
import { buildExportSvg } from '../../src/ui/exportImage';
import { CHIME_PEAK, createNightSound } from '../../src/ui/nightSound';
import type { Ghost } from '../../src/domain/ghosts';
import type { Reading } from '../../src/domain/server';
import { installFakeAudio, removeFakeAudio, type FakeLog } from './fakeAudio';

const RUNS = { numRuns: 100 };

type FakeAnim = { onfinish: (() => void) | null; oncancel: (() => void) | null; duration: number };
let anims: FakeAnim[] = [];

function readingFor(fears: string[]): Reading {
  return {
    kind: 'reading',
    steps: [
      { number: 1, zone: 'current', zoneLabel: 'I', text: 'start' },
      { number: 2, zone: 'block', zoneLabel: 'Block', text: 'b1' },
      { number: 3, zone: 'goal', zoneLabel: 'Goal', text: 'goal' },
      ...fears.map((f, i) => ({ number: 4 + i, zone: 'fear' as const, zoneLabel: 'Fear', text: f })),
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

function stairsFor(count: number): SVGSVGElement {
  const fears = Array.from({ length: count }, (_, i) => `fear ${i}`);
  const ghosts: Ghost[] = fears.map((fear) => ({ fear, step: '' }));
  const svg = buildStaircase(readingFor(fears), ghosts);
  document.body.replaceChildren(svg);
  return svg;
}

function finishAll(): void {
  const list = anims;
  anims = [];
  for (const a of list) a.onfinish?.();
}

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

beforeEach(() => {
  anims = [];
  setReduced(false);
  (Element.prototype as unknown as Record<string, unknown>)['animate'] = function (
    _frames: unknown,
    opts: { duration: number },
  ): FakeAnim {
    const a: FakeAnim = { onfinish: null, oncancel: null, duration: opts.duration };
    anims.push(a);
    return a;
  };
});
afterEach(() => {
  delete (Element.prototype as unknown as Record<string, unknown>)['animate'];
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe('Property 17: Motes leave no trace', () => {
  it('after any sequence of adds and clears and all animations finish, no mote is left', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.nat(4), { minLength: 1, maxLength: 20 }),
        fc.boolean(),
        (count, ops, atDawn) => {
          const svg = stairsFor(count);
          const faded: boolean[] = Array(count).fill(false);
          for (const op of ops) {
            const i = op % count;
            if (faded[i]) {
              faded[i] = false; // cleared: the ghost returns, no motes
            } else {
              faded[i] = true;
              const made = dissolve(svg, i, atDawn ? 'sun' : 'moon');
              expect(made).toBeGreaterThanOrEqual(MOTE_MIN);
              expect(made).toBeLessThanOrEqual(MOTE_MAX);
              expect(svg.querySelectorAll('.mote').length).toBeGreaterThan(0);
            }
          }
          finishAll();
          expect(svg.querySelectorAll('.mote').length).toBe(0);
          expect(svg.querySelector('.motes')).toBeNull();
        },
      ),
      RUNS,
    );
  });

  it('motes last 1.2 to 1.8 seconds', () => {
    const svg = stairsFor(2);
    dissolve(svg, 0);
    expect(anims.length).toBeGreaterThanOrEqual(MOTE_MIN);
    for (const a of anims) {
      expect(a.duration).toBeGreaterThanOrEqual(MOTE_MS_MIN);
      expect(a.duration).toBeLessThanOrEqual(MOTE_MS_MAX);
    }
  });

  it('removes motes by timer even if the animation never reports', () => {
    vi.useFakeTimers();
    const svg = stairsFor(1);
    dissolve(svg, 0);
    expect(svg.querySelectorAll('.mote').length).toBeGreaterThan(0);
    vi.advanceTimersByTime(MOTE_MS_MAX + 300);
    expect(svg.querySelectorAll('.mote').length).toBe(0);
  });

  it('under reduced motion no mote is ever created', () => {
    setReduced(true);
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.array(fc.nat(4), { maxLength: 20 }), (count, ops) => {
        const svg = stairsFor(count);
        for (const op of ops) {
          expect(dissolve(svg, op % count)).toBe(0);
          expect(svg.querySelector('.mote')).toBeNull();
        }
        expect(anims.length).toBe(0);
      }),
      RUNS,
    );
  });

  it('the saved picture never contains motes', () => {
    const svg = stairsFor(2);
    dissolve(svg, 0);
    const copy = buildExportSvg(svg, [{ fear: 'fear 0', step: 'x' }, { fear: 'fear 1', step: '' }]);
    expect(copy.querySelector('.mote')).toBeNull();
  });
});

describe('Chime (14.3)', () => {
  let log: FakeLog;
  beforeEach(() => {
    log = { created: 0, closed: 0, started: 0 };
    installFakeAudio(log);
  });
  afterEach(() => removeFakeAudio());

  it('plays nothing while the sound is off and makes no AudioContext', () => {
    const sound = createNightSound({ getBeatSeconds: () => 1 });
    sound.chime();
    expect(log.created).toBe(0);
    expect(log.started).toBe(0);
  });

  it('plays one soft chime while the sound is on, quieter than 0.15', () => {
    const sound = createNightSound({ getBeatSeconds: () => 1 });
    sound.start();
    const before = log.started;
    sound.chime();
    expect(log.started).toBeGreaterThan(before);
    expect(CHIME_PEAK).toBeLessThanOrEqual(0.15);
    sound.kill();
  });

  it('plays nothing after stop() or kill()', () => {
    const sound = createNightSound({ getBeatSeconds: () => 1 });
    sound.start();
    sound.kill();
    const before = log.started;
    sound.chime();
    expect(log.started).toBe(before);
  });
});
