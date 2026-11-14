import { allFaded, isFaded, type Ghost } from '../domain/ghosts';
import { beatsPerMinute, secondsPerBeat } from '../domain/pulse';
import { t } from '../i18n';

const NS = 'http://www.w3.org/2000/svg';
const EASE_MS = 3000;

/** Width of the pulse line window in px. The track holds two periods and slides by one. */
export const PULSE_W = 120;
const PULSE_H = 40;

export type HeartHandle = {
  /** The pulse panel. Place it in the stage before the staircase, in normal flow. */
  element: HTMLElement;
  /** Call whenever a ghost fades or comes back. */
  update: (ghosts: Ghost[]) => void;
  /** Stops any running ease. */
  destroy: () => void;
};

function svgEl(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A crisp vector heart: solid red to pumpkin, a light outline, no blur, no transparency. */
function drawHeart(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'heart-icon',
    viewBox: '0 0 64 64',
    width: 56,
    height: 56,
    'aria-hidden': 'true',
    focusable: 'false',
  }) as SVGSVGElement;
  const defs = svgEl('defs', {});
  const grad = svgEl('linearGradient', { id: 'heart-fill', x1: '0', y1: '0', x2: '1', y2: '1' });
  grad.append(
    svgEl('stop', { offset: '0', 'stop-color': '#E23B4E' }),
    svgEl('stop', { offset: '1', 'stop-color': '#FF8A3D' }),
  );
  defs.append(grad);
  const shape = svgEl('g', { class: 'heart-shape' });
  shape.append(
    svgEl('path', {
      d: 'M32 57 C10 41 4 29 4 20 C4 11 11 5 18 5 C24 5 29 8 32 13 C35 8 40 5 46 5 C53 5 60 11 60 20 C60 29 54 41 32 57 Z',
      fill: 'url(#heart-fill)',
      stroke: '#F4EFE6',
      'stroke-width': 1.5,
      'stroke-linejoin': 'round',
    }),
    svgEl('path', {
      d: 'M14 17 C14 13 17 11 20 11',
      fill: 'none',
      stroke: '#F4EFE6',
      'stroke-width': 2,
      'stroke-linecap': 'round',
    }),
  );
  svg.append(defs, shape);
  return svg;
}

/** One period of the pulse line: flat, a small bump, flat, one tall beat spike, flat. */
function period(x0: number): string {
  const mid = PULSE_H / 2;
  return [
    `L${x0 + 36} ${mid}`,
    `L${x0 + 42} ${mid - 6}`,
    `L${x0 + 48} ${mid}`,
    `L${x0 + 54} ${mid}`,
    `L${x0 + 58} ${mid - 16}`,
    `L${x0 + 64} ${mid + 14}`,
    `L${x0 + 70} ${mid}`,
    `L${x0 + PULSE_W} ${mid}`,
  ].join(' ');
}

/** The moving pulse line: one beat spike per beat, in time with the heart. */
function drawPulse(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'pulse-line',
    viewBox: `0 0 ${PULSE_W} ${PULSE_H}`,
    width: PULSE_W,
    height: PULSE_H,
    'aria-hidden': 'true',
    focusable: 'false',
  }) as SVGSVGElement;
  const track = svgEl('g', { class: 'pulse-track' });
  track.append(
    svgEl('path', {
      d: `M0 ${PULSE_H / 2} ${period(0)} ${period(PULSE_W)}`,
      fill: 'none',
      stroke: '#FF8A3D',
      'stroke-width': 2,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }),
  );
  svg.append(track);
  return svg;
}

/**
 * Builds the pulse panel: a crisp heart, a pulse line and the beat rate written as text.
 * It sets `--beat` (seconds per beat) on the panel from the number of ghosts without a step,
 * and eases to 60 bpm when every ghost has a step.
 */
export function buildHeart(ghosts: Ghost[]): HeartHandle {
  const element = document.createElement('div');
  element.className = 'heart';
  element.append(drawHeart(), drawPulse());

  const rate = document.createElement('p');
  rate.className = 'heart-rate';
  element.append(rate);

  const reduced = prefersReducedMotion();
  let currentBpm = 60;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const stop = (): void => {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    if (timer !== undefined) clearTimeout(timer);
    raf = 0;
    timer = undefined;
  };

  const apply = (bpm: number): void => {
    currentBpm = bpm;
    element.style.setProperty('--beat', `${secondsPerBeat(bpm)}s`);
    element.dataset['bpm'] = String(Math.round(bpm));
    rate.textContent = t('heartRate', { bpm: Math.round(bpm) });
  };

  if (reduced) element.classList.add('still');

  const update = (list: Ghost[]): void => {
    stop();
    const unfaded = list.filter((g) => !isFaded(g)).length;
    const calm = allFaded(list);
    element.classList.toggle('soft', calm);
    const target = beatsPerMinute(unfaded);
    if (reduced || !calm || currentBpm <= target) {
      apply(target);
      return;
    }
    // Ease down to 60 bpm over about 3 seconds.
    const from = currentBpm;
    const start = Date.now();
    const tick = (): void => {
      const k = Math.min(1, (Date.now() - start) / EASE_MS);
      apply(from + (target - from) * k);
      if (k < 1) {
        if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick);
        else timer = setTimeout(tick, 100);
      }
    };
    tick();
  };

  update(ghosts);
  return { element, update, destroy: stop };
}
