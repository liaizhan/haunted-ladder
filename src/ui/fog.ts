const NS = 'http://www.w3.org/2000/svg';
const LIFT_MS = 1500;
const STEP_DELAY_MS = 150;
const DRIFT_RADIUS = 140;
const DRIFT_MAX = 12;

export type FogHandle = {
  /** The fog layer to place over the staircase. */
  element: HTMLElement;
  /** Fades the fog out and lights the steps of `staircase` one by one, bottom up. */
  lift: (staircase: Element) => void;
  /** Removes timers and the fog. */
  destroy: () => void;
};

export type DriftHandle = {
  /** Call with the index of the ghost whose step field has focus, or null on blur. */
  focusGhost: (index: number | null) => void;
  destroy: () => void;
};

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function svgEl(name: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function fogLayer(cls: string, opacity: number, blobs: Array<[number, number, number, number]>): SVGGElement {
  const g = svgEl('g', { class: `fog-layer ${cls}`, filter: 'url(#fog-blur)', opacity, fill: '#A9A3C7' }) as SVGGElement;
  for (const [cx, cy, rx, ry] of blobs) g.append(svgEl('ellipse', { cx, cy, rx, ry }));
  return g;
}

/** Builds the waiting fog. It has no sound and no text; it is hidden from screen readers. */
export function buildFog(): FogHandle {
  const element = document.createElement('div');
  element.className = 'fog';
  element.setAttribute('aria-hidden', 'true');

  const svg = svgEl('svg', { viewBox: '0 0 680 400', width: '100%', height: '100%', preserveAspectRatio: 'none', focusable: 'false' });
  const defs = svgEl('defs', {});
  const blur = svgEl('filter', { id: 'fog-blur', x: '-30%', y: '-30%', width: '160%', height: '160%' });
  blur.append(svgEl('feGaussianBlur', { stdDeviation: 22 }));
  defs.append(blur);
  svg.append(
    defs,
    fogLayer('fog-a', 0.3, [[120, 120, 180, 60], [420, 220, 220, 70], [600, 330, 160, 50]]),
    fogLayer('fog-b', 0.22, [[260, 80, 200, 55], [520, 140, 190, 60], [160, 300, 210, 65]]),
  );
  element.append(svg);

  const reduced = prefersReducedMotion();
  if (reduced) element.classList.add('still');
  let timer: ReturnType<typeof setTimeout> | undefined;

  const lift = (staircase: Element): void => {
    const stairs = Array.from(staircase.querySelectorAll<SVGElement>('.stair'));
    stairs.forEach((s, i) => {
      s.style.transitionDelay = reduced ? '0ms' : `${i * STEP_DELAY_MS}ms`;
      s.classList.add('lit');
    });
    staircase.classList.remove('waiting');
    if (reduced) {
      element.remove();
      return;
    }
    element.classList.add('lifting');
    timer = setTimeout(() => element.remove(), LIFT_MS);
  };

  const destroy = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    element.remove();
  };

  return { element, lift, destroy };
}

/** Marks the staircase as waiting: steps are dim until the fog lifts. */
export function dimForWaiting(staircase: Element): void {
  staircase.classList.add('waiting');
}

/**
 * How far (px) a ghost at `center` moves away from `from`. Zero beyond DRIFT_RADIUS,
 * never more than DRIFT_MAX, directed away from the point.
 */
export function driftOffset(
  center: { x: number; y: number },
  from: { x: number; y: number },
  radius: number = DRIFT_RADIUS,
  max: number = DRIFT_MAX,
): { x: number; y: number } {
  const dx = center.x - from.x;
  const dy = center.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (!(dist < radius)) return { x: 0, y: 0 };
  if (dist === 0) return { x: 0, y: -max };
  const strength = max * (1 - dist / radius);
  return { x: (dx / dist) * strength, y: (dy / dist) * strength };
}

function ghostsOf(staircase: Element): SVGElement[] {
  return Array.from(staircase.querySelectorAll<SVGElement>('.ghost'));
}

function centerOf(node: Element): { x: number; y: number } {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function setDrift(node: SVGElement, off: { x: number; y: number }): void {
  if (node.classList.contains('faded') || (off.x === 0 && off.y === 0)) {
    node.style.transform = '';
    return;
  }
  node.style.transform = `translate(${off.x.toFixed(1)}px, ${off.y.toFixed(1)}px)`;
}

/**
 * An unfaded ghost drifts up to 12 px away from the pointer, or away from the focused
 * step field. Does nothing under prefers-reduced-motion. Faded ghosts stay still.
 */
export function attachGhostDrift(staircase: Element): DriftHandle {
  if (prefersReducedMotion()) return { focusGhost: () => undefined, destroy: () => undefined };
  staircase.classList.add('drifty');

  const reset = (): void => ghostsOf(staircase).forEach((g) => setDrift(g, { x: 0, y: 0 }));

  const onMove = (e: Event): void => {
    const p = e as PointerEvent;
    const from = { x: p.clientX, y: p.clientY };
    for (const g of ghostsOf(staircase)) setDrift(g, driftOffset(centerOf(g), from));
  };
  const onLeave = (): void => reset();

  staircase.addEventListener('pointermove', onMove);
  staircase.addEventListener('pointerleave', onLeave);

  const focusGhost = (index: number | null): void => {
    reset();
    if (index === null) return;
    const ghosts = ghostsOf(staircase);
    const target = ghosts[index];
    if (!target || target.classList.contains('faded')) return;
    // Nudge the focused ghost straight up, away from the field below it.
    setDrift(target, { x: 0, y: -DRIFT_MAX });
  };

  const destroy = (): void => {
    staircase.removeEventListener('pointermove', onMove);
    staircase.removeEventListener('pointerleave', onLeave);
    staircase.classList.remove('drifty');
    reset();
  };

  return { focusGhost, destroy };
}
