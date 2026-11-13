import { allFaded, isFaded, type Ghost } from '../domain/ghosts';
import { beatsPerMinute, secondsPerBeat } from '../domain/pulse';

const NS = 'http://www.w3.org/2000/svg';
const EASE_MS = 3000;

export type HeartHandle = {
  /** The wrapper to place behind the staircase. */
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

function drawHeart(): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 200 200',
    width: '100%',
    'aria-hidden': 'true',
    focusable: 'false',
  }) as SVGSVGElement;
  const defs = svgEl('defs', {});
  const glow = svgEl('radialGradient', { id: 'heart-glow', cx: '50%', cy: '50%', r: '50%' });
  glow.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#FF5A36', 'stop-opacity': 0.95 }),
    svgEl('stop', { offset: '55%', 'stop-color': '#FF8A3D', 'stop-opacity': 0.35 }),
    svgEl('stop', { offset: '100%', 'stop-color': '#FF8A3D', 'stop-opacity': 0 }),
  );
  defs.append(glow);
  svg.append(defs);

  const body = svgEl('g', { class: 'heart-body' });
  body.append(
    svgEl('path', {
      d: 'M100 175 C40 130 20 95 30 65 C40 38 80 36 100 66 C120 36 160 38 170 65 C180 95 160 130 100 175 Z',
      fill: '#8FA3BF',
      'fill-opacity': 0.35,
      stroke: '#C9D6E8',
      'stroke-opacity': 0.7,
      'stroke-width': 1.2,
    }),
    // chambers and vessels, thin lines
    svgEl('path', { d: 'M100 66 C96 100 100 140 100 172', fill: 'none', stroke: '#C9D6E8', 'stroke-opacity': 0.5, 'stroke-width': 0.8 }),
    svgEl('path', { d: 'M62 70 C70 95 84 110 100 118', fill: 'none', stroke: '#C9D6E8', 'stroke-opacity': 0.5, 'stroke-width': 0.8 }),
    svgEl('path', { d: 'M138 70 C130 95 116 110 100 118', fill: 'none', stroke: '#C9D6E8', 'stroke-opacity': 0.5, 'stroke-width': 0.8 }),
    svgEl('path', { d: 'M88 50 C86 34 82 22 76 12 M112 50 C114 34 120 22 128 12', fill: 'none', stroke: '#C9D6E8', 'stroke-opacity': 0.55, 'stroke-width': 3, 'stroke-linecap': 'round' }),
  );
  svg.append(body, svgEl('circle', { class: 'heart-glow', cx: 100, cy: 100, r: 46, fill: 'url(#heart-glow)' }));
  return svg;
}

/**
 * Builds the x-ray heart. It sets `--beat` (seconds per beat) on the wrapper from the number
 * of ghosts without a step, and eases to 60 bpm when every ghost has a step.
 */
export function buildHeart(ghosts: Ghost[]): HeartHandle {
  const element = document.createElement('div');
  element.className = 'heart';
  element.setAttribute('aria-hidden', 'true');
  element.append(drawHeart());

  const rate = document.createElement('p');
  rate.className = 'heart-rate';
  rate.hidden = true;
  rate.textContent = '';
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
    if (reduced) rate.textContent = `Heart rate: ${Math.round(bpm)} beats per minute`;
  };

  if (reduced) {
    rate.hidden = false;
    element.classList.add('still');
  }

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
      const t = Math.min(1, (Date.now() - start) / EASE_MS);
      apply(from + (target - from) * t);
      if (t < 1) {
        if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick);
        else timer = setTimeout(tick, 100);
      }
    };
    tick();
  };

  update(ghosts);
  return { element, update, destroy: stop };
}
