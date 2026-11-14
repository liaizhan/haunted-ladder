const NS = 'http://www.w3.org/2000/svg';

export const MOTE_MIN = 8;
export const MOTE_MAX = 14;
export const MOTE_MS_MIN = 1200;
export const MOTE_MS_MAX = 1800;

const MOTE_COLOR = '#F4EFE6';

export type MoteTarget = 'moon' | 'sun';

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function num(node: Element | null, name: string): number | null {
  const n = node ? parseFloat(node.getAttribute(name) ?? '') : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Centre of the ghost body in SVG units, read from its translate(x y) transform. */
function ghostCenter(svg: SVGSVGElement, index: number): { x: number; y: number } | null {
  const body = svg.querySelector(`.ghost[data-ghost="${index}"] .ghost-body`);
  const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(body?.getAttribute('transform') ?? '');
  if (!m) return null;
  return { x: parseFloat(m[1] ?? '0'), y: parseFloat(m[2] ?? '0') - 20 };
}

/** Where the motes drift to: the moon, or the sun at dawn (the lit goal at the top of the ladder). */
function targetPoint(svg: SVGSVGElement, target: MoteTarget): { x: number; y: number } {
  const node = target === 'sun' ? svg.querySelector('.goal-light') : svg.querySelector('.moon');
  const fallback = svg.querySelector('.moon') ?? svg.querySelector('.goal-light');
  const x = num(node, 'cx') ?? num(fallback, 'cx') ?? 40;
  const y = num(node, 'cy') ?? num(fallback, 'cy') ?? 40;
  return { x, y };
}

/**
 * Breaks one ghost into 8 to 14 small light motes that drift up toward the moon (or the sun at
 * dawn) and fade out in 1.2 to 1.8 seconds. Every mote removes itself when it finishes.
 * Draws nothing under `prefers-reduced-motion: reduce`. Returns the number of motes made.
 */
export function dissolve(svg: SVGSVGElement, ghostIndex: number, target: MoteTarget = 'moon'): number {
  if (prefersReducedMotion()) return 0;
  const from = ghostCenter(svg, ghostIndex);
  if (!from) return 0;
  const to = targetPoint(svg, target);

  const count = MOTE_MIN + Math.floor(Math.random() * (MOTE_MAX - MOTE_MIN + 1));
  const layer = document.createElementNS(NS, 'g');
  layer.setAttribute('class', 'motes');
  layer.setAttribute('aria-hidden', 'true');
  svg.appendChild(layer);

  let left = count;
  const finishOne = (mote: Element): void => {
    if (!mote.parentNode) return;
    mote.remove();
    left--;
    if (left <= 0) layer.remove();
  };

  for (let i = 0; i < count; i++) {
    const mote = document.createElementNS(NS, 'circle');
    mote.setAttribute('class', 'mote');
    mote.setAttribute('cx', String(from.x + (Math.random() - 0.5) * 40));
    mote.setAttribute('cy', String(from.y + (Math.random() - 0.5) * 40));
    mote.setAttribute('r', String(1.5 + Math.random() * 2));
    mote.setAttribute('fill', MOTE_COLOR);
    layer.appendChild(mote);

    const ms = MOTE_MS_MIN + Math.random() * (MOTE_MS_MAX - MOTE_MS_MIN);
    const dx = (to.x - from.x) * (0.5 + Math.random() * 0.4) + (Math.random() - 0.5) * 30;
    const dy = (to.y - from.y) * (0.5 + Math.random() * 0.4);
    const animate = (mote as unknown as { animate?: Element['animate'] }).animate;
    if (typeof animate === 'function') {
      const anim = animate.call(
        mote,
        [
          { transform: 'translate(0px, 0px)', opacity: 0.9 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
        ],
        { duration: ms, easing: 'ease-out', fill: 'forwards' },
      );
      anim.onfinish = () => finishOne(mote);
      anim.oncancel = () => finishOne(mote);
    }
    // Safety net: a mote never outlives its animation, even if the animation never reports.
    setTimeout(() => finishOne(mote), ms + 200);
  }
  return count;
}
