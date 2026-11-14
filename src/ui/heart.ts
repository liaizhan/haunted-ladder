import { allFaded, isFaded, type Ghost } from '../domain/ghosts';
import { beatsPerMinute, secondsPerBeat } from '../domain/pulse';
import { t } from '../i18n';
import { htmlArt } from './art';

const NS = 'http://www.w3.org/2000/svg';
const EASE_MS = 3000;

/** Width of the pulse line window in px. The track holds two periods and slides by one. */
export const PULSE_W = 120;
const PULSE_H = 40;
/** How many beat periods the pulse line window shows at once. */
const PULSE_VISIBLE = 3;

export type HeartHandle = {
  /** The pulse panel. Place it in the stage before the staircase, in normal flow. */
  element: HTMLElement;
  /**
   * Call whenever a ghost fades or comes back. Pass the ghost that just got a step to send
   * a spark from it to the heart first.
   */
  update: (ghosts: Ghost[], sparkFrom?: Element | null) => void;
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

/** HEART_ART_SIZE: the painted heart picture, in px. */
const HEART_ART_SIZE = 112;

/**
 * The painted heart: the dark spirit's claws squeeze a cracked red heart, and the light
 * spirit holds a calm golden one. The calm picture shows through as the pulse slows.
 */
function drawHeart(): HTMLDivElement {
  const frame = document.createElement('div');
  frame.className = 'heart-art';
  frame.setAttribute('aria-hidden', 'true');
  const shape = document.createElement('div');
  shape.className = 'heart-shape';
  shape.append(
    htmlArt('heart-fear', 'heart-fear', HEART_ART_SIZE),
    htmlArt('heart-calm', 'heart-calm', HEART_ART_SIZE),
  );
  frame.append(shape);
  return frame;
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
    viewBox: `0 0 ${PULSE_W * PULSE_VISIBLE} ${PULSE_H}`,
    width: PULSE_W * PULSE_VISIBLE,
    height: PULSE_H,
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
    focusable: 'false',
  }) as SVGSVGElement;
  const track = svgEl('g', { class: 'pulse-track' });
  track.append(
    svgEl('path', {
      d: `M0 ${PULSE_H / 2} ${Array.from({ length: PULSE_VISIBLE + 1 }, (_, i) => period(i * PULSE_W)).join(' ')}`,
      fill: 'none',
      stroke: '#FF8A3D',
      'stroke-width': 2,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      'vector-effect': 'non-scaling-stroke',
    }),
  );
  svg.append(track);
  return svg;
}

const SPARK_MS = 900;
const COUNT_MS = 700;
const PETALS = 12;

/** Center of an element on the page, in viewport px. */
function centerOf(node: Element): { x: number; y: number } {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Golden sparks fly along an arc from a ghost that just got a step to the heart.
 * Returns false when the browser cannot animate them, so the caller updates at once.
 */
function flySpark(from: Element, to: Element): boolean {
  const probe = document.createElement('div');
  if (typeof probe.animate !== 'function') return false;
  const a = centerOf(from);
  const b = centerOf(to);
  // The arc bends to the right of the straight line, so it never leaves the screen.
  const midX = Math.min(window.innerWidth - 24, (a.x + b.x) / 2 + Math.abs(a.y - b.y) * 0.3 + 40);
  const midY = (a.y + b.y) / 2;
  [0, 45, 90, 135, 180].forEach((delay, k) => {
    const dot = document.createElement('div');
    dot.className = k === 0 ? 'heart-spark' : 'heart-spark heart-spark-tail';
    dot.setAttribute('aria-hidden', 'true');
    const size = Math.max(6, 24 - k * 4);
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    document.body.append(dot);
    const at = (x: number, y: number, scale: number): Keyframe => ({
      transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${scale})`,
    });
    const anim = dot.animate(
      [
        { ...at(a.x, a.y, 0.4), opacity: 0 },
        { ...at(a.x, a.y, 1.2), opacity: 1, offset: 0.12 },
        { ...at(midX, midY, 1), opacity: 1, offset: 0.55 },
        { ...at(b.x, b.y, 0.7), opacity: 0.9 },
      ],
      { duration: SPARK_MS - delay, delay, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' },
    );
    anim.onfinish = () => dot.remove();
  });
  return true;
}

/** The last ghost has a step: the heart breathes out once and golden petals fly from it. */
function exhale(panel: HTMLElement, art: HTMLElement): void {
  if (typeof art.animate !== 'function') return;
  art.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.09)', offset: 0.4 }, { transform: 'scale(1)' }],
    { duration: 2600, easing: 'ease-in-out' },
  );
  const pr = panel.getBoundingClientRect();
  const c = centerOf(art);
  const x0 = c.x - pr.left;
  const y0 = c.y - pr.top;
  for (let k = 0; k < PETALS; k++) {
    const petal = document.createElement('span');
    petal.className = 'heart-petal';
    petal.setAttribute('aria-hidden', 'true');
    panel.append(petal);
    const angle = -Math.PI / 2 + ((k - (PETALS - 1) / 2) / PETALS) * Math.PI * 1.6;
    const dist = 95 + (k % 3) * 30;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const turn = (k % 2 ? 1 : -1) * (90 + k * 20);
    const anim = petal.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) rotate(0deg) scale(.4)`, opacity: 0 },
        { transform: `translate(${x0 + dx * 0.3}px, ${y0 + dy * 0.3}px) rotate(${turn / 3}deg) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${x0 + dx}px, ${y0 + dy + 30}px) rotate(${turn}deg) scale(.8)`, opacity: 0 },
      ],
      { duration: 2200 + k * 90, delay: 500 + k * 40, easing: 'ease-out', fill: 'both' },
    );
    anim.onfinish = () => petal.remove();
  }
}

/**
 * Builds the pulse panel: a painted heart, a big beat number, a line that says how the heart
 * feels and a pulse line. It sets `--beat` (seconds per beat) and `--calm` (0 fear, 1 calm)
 * from the number of ghosts without a step. When the pulse slows it counts down, and when
 * every ghost has a step it eases to 60 bpm and breathes out once.
 */
export function buildHeart(ghosts: Ghost[]): HeartHandle {
  const element = document.createElement('div');
  element.className = 'heart';
  const side = document.createElement('div');
  side.className = 'heart-side';
  // The big number is for the eye; screen readers get the full sentence in .heart-rate.
  const bpmBox = document.createElement('div');
  bpmBox.className = 'heart-bpm';
  bpmBox.setAttribute('aria-hidden', 'true');
  const bpmNum = document.createElement('span');
  bpmNum.className = 'heart-bpm-num';
  const bpmUnit = document.createElement('span');
  bpmUnit.className = 'heart-bpm-unit';
  bpmUnit.textContent = t('heartUnit');
  bpmBox.append(bpmNum, bpmUnit);
  const stage = document.createElement('p');
  stage.className = 'heart-stage';
  const rate = document.createElement('p');
  rate.className = 'heart-rate sr-only';
  side.append(bpmBox, stage, rate);
  const art = drawHeart();
  element.append(art, side, drawPulse());

  const reduced = prefersReducedMotion();
  let currentBpm = 60;
  // The pulse with no steps yet: this is where the picture is all fear.
  let peakBpm = beatsPerMinute(ghosts.length);
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sparkTimer: ReturnType<typeof setTimeout> | undefined;
  let exhaled = allFaded(ghosts);

  const stop = (): void => {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    if (timer !== undefined) clearTimeout(timer);
    if (sparkTimer !== undefined) clearTimeout(sparkTimer);
    raf = 0;
    timer = undefined;
    sparkTimer = undefined;
  };

  const apply = (bpm: number): void => {
    currentBpm = bpm;
    element.style.setProperty('--beat', `${secondsPerBeat(bpm)}s`);
    // The starting pulse is all fear, 60 bpm is all calm.
    const span = peakBpm - 60;
    const calmShare = span > 0 ? (peakBpm - bpm) / span : 1;
    const calm = Math.max(0, Math.min(1, calmShare));
    element.style.setProperty('--calm', String(calm));
    element.dataset['bpm'] = String(Math.round(bpm));
    bpmNum.textContent = String(Math.round(bpm));
    rate.textContent = t('heartRate', { bpm: Math.round(bpm) });
    const stageKey = calm >= 1 ? 'heartStageCalm' : calm >= 0.3 ? 'heartStageEasing' : 'heartStageFear';
    element.dataset['stage'] = stageKey;
    stage.textContent = t(stageKey);
  };

  if (reduced) element.classList.add('still');

  const settle = (list: Ghost[]): void => {
    const unfaded = list.filter((g) => !isFaded(g)).length;
    peakBpm = beatsPerMinute(list.length);
    const calm = allFaded(list);
    element.classList.toggle('soft', calm);
    if (!calm) exhaled = false;
    const target = beatsPerMinute(unfaded);
    if (reduced || currentBpm <= target) {
      apply(target);
      return;
    }
    // Count down: a short slide for one step, about 3 seconds to 60 bpm at the end.
    const from = currentBpm;
    const ms = calm ? EASE_MS : COUNT_MS;
    const start = Date.now();
    const tick = (): void => {
      const k = Math.min(1, (Date.now() - start) / ms);
      const eased = 1 - (1 - k) * (1 - k);
      apply(from + (target - from) * eased);
      if (k < 1) {
        if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(tick);
        else timer = setTimeout(tick, 100);
      } else if (calm && !exhaled) {
        exhaled = true;
        exhale(element, art);
      }
    };
    tick();
  };

  const update = (list: Ghost[], sparkFrom?: Element | null): void => {
    stop();
    // A ghost just got a step: let the spark reach the heart before the pulse drops.
    if (sparkFrom && !reduced && element.isConnected && flySpark(sparkFrom, art)) {
      sparkTimer = setTimeout(() => {
        sparkTimer = undefined;
        element.classList.remove('hit');
        void element.offsetWidth;
        element.classList.add('hit');
        settle(list);
      }, SPARK_MS - 60);
      return;
    }
    settle(list);
  };

  update(ghosts);
  return { element, update, destroy: stop };
}
