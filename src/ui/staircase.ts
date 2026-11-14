import type { Reading, Step } from '../domain/server';
import { isFaded, type Ghost } from '../domain/ghosts';

const NS = 'http://www.w3.org/2000/svg';

// Colors are literal (not CSS variables) so the exported PNG looks the same.
const NIGHT_2 = '#221C45';
const MOON = '#F4EFE6';
const MIST = '#A9A3C7';
const PUMPKIN = '#FF8A3D';

const WIDTH = 680;
const X0 = 40;
const STAIRS_W = 600;
const STEP_H = 64;
const TOP = 90; // room for the moon
const GHOST_H = 170;
const FADED_OPACITY = 0.15;

/** Average glyph width (px at font-size 11) used for wrapping; tests use it to size label boxes. */
export const CHAR_W = 6.2;
/** Step label colors: MOON text on the solid NIGHT_2 step fill. */
export const STEP_FILL = NIGHT_2;
export const LABEL_COLOR = MOON;

/** Containers narrower than this (CSS px) get the phone layout. */
export const NARROW_MAX = 640;
/** Narrowest picture the phone layout draws; narrower containers scale it down slightly. */
export const NARROW_MIN = 300;
/** Label font size in the phone layout. The picture is drawn at 1 unit = 1 CSS px. */
export const NARROW_FONT = 13;
/** Glyph width estimate at a given font size (CHAR_W is for size 11). */
export const charWidth = (size: number): number => (CHAR_W * size) / 11;

const N_PAD = 10;
const N_INDENT = 8;
const N_ROW_H = 64;
const N_GHOST_ROW = 84;
const N_TOP = 70;
const N_GOAL_ROOM = 28;

export type StaircaseOptions = {
  /** Container width in CSS px. Narrow containers get the phone layout. 0 or missing means wide. */
  width?: number;
};

function el<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/** Word wrap by character count. Long words are cut. Extra lines end with an ellipsis. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const max = Math.max(1, maxChars);
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let w = word;
    while (w.length > max) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(w.slice(0, max));
      w = w.slice(max);
    }
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    const last = lines[maxLines - 1] ?? '';
    lines[maxLines - 1] = last.slice(0, Math.max(0, max - 1)) + '…';
  }
  return lines.length ? lines : [''];
}

/** SVG text with one tspan per line. User words only go in through textContent. */
function textBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  fill: string,
  anchor: 'start' | 'middle',
): SVGTextElement {
  const t = el('text', {
    x,
    y,
    'font-size': size,
    fill,
    'text-anchor': anchor,
    'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  });
  lines.forEach((line, i) => {
    const span = el('tspan', { x, dy: i === 0 ? 0 : size * 1.25 });
    span.textContent = line;
    t.appendChild(span);
  });
  return t;
}

function cobweb(x: number, y: number, w: number, h: number): SVGGElement {
  const g = el('g', {
    class: 'cobweb',
    fill: 'none',
    stroke: MIST,
    'stroke-width': 1,
    opacity: 0.7,
    'aria-hidden': 'true',
  });
  const mx = x + w / 2;
  const my = y + h / 2;
  g.appendChild(el('path', { d: `M${x} ${y} L${x + w} ${y + h}` }));
  g.appendChild(el('path', { d: `M${x + w} ${y} L${x} ${y + h}` }));
  g.appendChild(el('path', { d: `M${mx} ${y} L${mx} ${y + h}` }));
  g.appendChild(el('path', { d: `M${x} ${my} L${x + w} ${my}` }));
  for (const f of [0.25, 0.5, 0.8]) {
    const rx = (w / 2) * f;
    const ry = (h / 2) * f;
    g.appendChild(
      el('path', {
        d: `M${mx - rx} ${my} Q${mx} ${my - ry * 1.6} ${mx + rx} ${my} Q${mx} ${my + ry * 1.6} ${mx - rx} ${my}`,
      }),
    );
  }
  return g;
}

function stairGroup(step: Step, index: number, n: number, nearest: boolean): SVGGElement {
  const stepW = STAIRS_W / n;
  const baseY = TOP + GHOST_H + n * STEP_H;
  const x = X0 + index * stepW;
  const y = baseY - (index + 1) * STEP_H;
  const isGoal = step.zone === 'goal';
  const cls = ['stair', `stair-${step.zone}`, nearest ? 'nearest' : ''].filter(Boolean).join(' ');

  const g = el('g', { class: cls, 'data-zone': step.zone });
  g.setAttribute('role', 'img');
  g.setAttribute('aria-label', `${step.zoneLabel}: ${step.text}`);
  const title = el('title');
  title.textContent = step.text;
  g.appendChild(title);

  // Order matters: solid fill first, then the cobweb, then the label on top of both.
  g.appendChild(
    el('rect', {
      class: 'step-fill',
      x,
      y,
      width: stepW,
      height: baseY - y,
      rx: 6,
      fill: NIGHT_2,
      stroke: nearest || isGoal ? PUMPKIN : MIST,
      'stroke-width': nearest ? 3 : isGoal ? 2 : 1,
      'stroke-opacity': nearest || isGoal ? 1 : 0.5,
    }),
  );
  if (isGoal) {
    g.appendChild(
      el('circle', {
        class: 'goal-light',
        cx: x + stepW / 2,
        cy: y - 14,
        r: 8,
        fill: PUMPKIN,
        opacity: 0.95,
      }),
    );
  }
  if (step.zone === 'block') g.appendChild(cobweb(x, y, stepW, Math.min(STEP_H, baseY - y)));
  const chars = Math.max(4, Math.floor((stepW - 14) / CHAR_W));
  const label = textBlock(wrapText(step.text, chars, 3), x + 7, y + 18, 11, LABEL_COLOR, 'start');
  label.setAttribute('class', 'step-label');
  g.appendChild(label);
  return g;
}

function ghostBody(): SVGPathElement {
  return el('path', {
    d: 'M-26 0 C-26 -34 -14 -48 0 -48 C14 -48 26 -34 26 0 L26 30 L17 22 L9 30 L0 22 L-9 30 L-17 22 L-26 30 Z',
    fill: MOON,
    'fill-opacity': 0.85,
  });
}

type GhostPlace = {
  cx: number;
  cy: number;
  /** Label anchor point. */
  lx: number;
  ly: number;
  anchor: 'start' | 'middle';
  size: number;
  chars: number;
};

function wideGhostPlace(index: number, count: number): GhostPlace {
  const slot = STAIRS_W / count;
  const cx = X0 + slot * (index + 0.5);
  const cy = TOP + 50;
  // The label lives in its own slot (width slot - 10) below the body, so labels never overlap.
  const chars = Math.max(6, Math.floor((slot - 10) / CHAR_W));
  return { cx, cy, lx: cx, ly: cy + 50, anchor: 'middle', size: 11, chars };
}

/** Phone layout: ghosts in a column, label to the right of the body. */
function narrowGhostPlace(index: number, vw: number): GhostPlace {
  const cx = N_PAD + 34;
  const cy = N_TOP + index * N_GHOST_ROW + 52;
  const lx = cx + 44;
  const chars = Math.max(6, Math.floor((vw - N_PAD - lx) / charWidth(NARROW_FONT)));
  return { cx, cy, lx, ly: cy - 12, anchor: 'start', size: NARROW_FONT, chars };
}

function ghostGroup(g: Ghost, index: number, place: GhostPlace): SVGGElement {
  const { cx, cy } = place;
  const root = el('g', { class: 'ghost', 'data-ghost': index });
  root.setAttribute('role', 'img');
  const title = el('title');
  title.textContent = g.fear;
  root.appendChild(title);

  // Each ghost floats in its own loop of 3, 4 or 5 seconds, with its own phase.
  const duration = 3 + (index % 3);
  const float = el('g', {
    class: 'ghost-float',
    style: `animation-duration:${duration}s;animation-delay:-${(index * 1.3).toFixed(1)}s`,
  });
  const body = el('g', { class: 'ghost-body', transform: `translate(${cx} ${cy})` });
  body.appendChild(ghostBody());
  body.appendChild(el('circle', { cx: -9, cy: -22, r: 3.5, fill: NIGHT_2 }));
  body.appendChild(el('circle', { cx: 9, cy: -22, r: 3.5, fill: NIGHT_2 }));
  body.appendChild(el('ellipse', { cx: 0, cy: -10, rx: 4, ry: 5, fill: NIGHT_2, opacity: 0.8 }));
  float.appendChild(body);

  const check = el('path', {
    class: 'ghost-check',
    d: `M${cx - 9} ${cy - 2} l6 7 l12 -14`,
    fill: 'none',
    stroke: PUMPKIN,
    'stroke-width': 4,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  float.appendChild(check);
  root.appendChild(float);

  const label = textBlock(
    wrapText(g.fear, place.chars, 3),
    place.lx,
    place.ly,
    place.size,
    MOON,
    place.anchor,
  );
  label.setAttribute('class', 'ghost-label');
  root.appendChild(label);
  return root;
}

function applyGhostState(root: Element, ghost: Ghost): void {
  const faded = isFaded(ghost);
  root.classList.toggle('faded', faded);
  root.setAttribute('opacity', String(faded ? FADED_OPACITY : 1));
  root.setAttribute(
    'aria-label',
    faded ? `Ghost, faded, has a small step: ${ghost.fear}` : `Ghost: ${ghost.fear}`,
  );
  const check = root.querySelector('.ghost-check');
  if (check) check.setAttribute('visibility', faded ? 'visible' : 'hidden');
}

/** Phone layout: each step is a full-width row, indented a little more as it climbs. */
function narrowStairGroup(
  step: Step,
  index: number,
  n: number,
  nearest: boolean,
  vw: number,
  y0: number,
): SVGGElement {
  const x = N_PAD + index * N_INDENT;
  const w = vw - N_PAD - x;
  const y = y0 + (n - 1 - index) * N_ROW_H;
  const isGoal = step.zone === 'goal';
  const cls = ['stair', `stair-${step.zone}`, nearest ? 'nearest' : ''].filter(Boolean).join(' ');

  const g = el('g', { class: cls, 'data-zone': step.zone });
  g.setAttribute('role', 'img');
  g.setAttribute('aria-label', `${step.zoneLabel}: ${step.text}`);
  const title = el('title');
  title.textContent = step.text;
  g.appendChild(title);

  g.appendChild(
    el('rect', {
      class: 'step-fill',
      x,
      y,
      width: w,
      height: N_ROW_H - 4,
      rx: 6,
      fill: NIGHT_2,
      stroke: nearest || isGoal ? PUMPKIN : MIST,
      'stroke-width': nearest ? 3 : isGoal ? 2 : 1,
      'stroke-opacity': nearest || isGoal ? 1 : 0.5,
    }),
  );
  if (isGoal) {
    g.appendChild(
      el('circle', {
        class: 'goal-light',
        cx: x + w - 16,
        cy: y + 18,
        r: 7,
        fill: PUMPKIN,
        opacity: 0.95,
      }),
    );
  }
  if (step.zone === 'block') g.appendChild(cobweb(x, y, w, N_ROW_H - 4));
  const room = 14 + (isGoal ? N_GOAL_ROOM : 0);
  const chars = Math.max(4, Math.floor((w - room) / charWidth(NARROW_FONT)));
  const label = textBlock(
    wrapText(step.text, chars, 3),
    x + 7,
    y + 20,
    NARROW_FONT,
    LABEL_COLOR,
    'start',
  );
  label.setAttribute('class', 'step-label');
  g.appendChild(label);
  return g;
}

/**
 * Builds the staircase. The person's phrases are written only as SVG text nodes.
 * With a container narrower than NARROW_MAX the picture is drawn at 1 unit = 1 CSS px
 * with 13 px labels: ghosts in a column, steps as full-width rows.
 */
export function buildStaircase(
  reading: Reading,
  ghosts: Ghost[],
  opts: StaircaseOptions = {},
): SVGSVGElement {
  const stairs = reading.steps.filter((s) => s.zone !== 'fear');
  const n = Math.max(1, stairs.length);
  const cw = opts.width ?? 0;
  const narrow = cw > 0 && cw < NARROW_MAX;
  const vw = narrow ? Math.max(NARROW_MIN, Math.round(cw)) : WIDTH;

  const ghostBand = ghosts.length === 0 ? 60 : ghosts.length * N_GHOST_ROW;
  const y0 = N_TOP + ghostBand + 16;
  const height = narrow ? y0 + n * N_ROW_H + 20 : TOP + GHOST_H + n * STEP_H + 30;

  const svg = el('svg', {
    class: 'staircase',
    viewBox: `0 0 ${vw} ${height}`,
    width: '100%',
    role: 'group',
    'aria-label': 'Your ladder as a staircase at night',
    'data-layout': narrow ? 'narrow' : 'wide',
  });

  const moon = narrow
    ? el('circle', { class: 'moon', cx: vw - 34, cy: 34, r: 20, fill: MOON, opacity: 0.9 })
    : el('circle', { class: 'moon', cx: 70, cy: 45, r: 26, fill: MOON, opacity: 0.9 });
  moon.setAttribute('aria-hidden', 'true');
  svg.appendChild(moon);

  stairs.forEach((step, i) => {
    const nearest =
      step.zone === 'block' && reading.nearestBlock !== null && step.text === reading.nearestBlock;
    svg.appendChild(
      narrow ? narrowStairGroup(step, i, n, nearest, vw, y0) : stairGroup(step, i, n, nearest),
    );
  });

  if (ghosts.length === 0) {
    const text = 'No ghosts were found above your goal.';
    const none = narrow
      ? textBlock(
          wrapText(text, Math.floor((vw - 2 * N_PAD) / charWidth(14)), 2),
          vw / 2,
          N_TOP + 20,
          14,
          MIST,
          'middle',
        )
      : textBlock([text], WIDTH / 2, TOP + 70, 14, MIST, 'middle');
    none.setAttribute('class', 'no-ghosts');
    svg.appendChild(none);
  } else {
    ghosts.forEach((g, i) => {
      const place = narrow ? narrowGhostPlace(i, vw) : wideGhostPlace(i, ghosts.length);
      const node = ghostGroup(g, i, place);
      applyGhostState(node, g);
      svg.appendChild(node);
    });
  }
  return svg;
}

/** Updates fade and check marks in place when a step is written or cleared. */
export function updateGhosts(svg: SVGSVGElement, ghosts: Ghost[]): void {
  ghosts.forEach((g, i) => {
    const root = svg.querySelector(`.ghost[data-ghost="${i}"]`);
    if (root) applyGhostState(root, g);
  });
}
