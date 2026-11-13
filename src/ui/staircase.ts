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

  g.appendChild(
    el('rect', {
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
  const chars = Math.max(4, Math.floor((stepW - 14) / 6.2));
  g.appendChild(textBlock(wrapText(step.text, chars, 3), x + 7, y + 18, 11, MOON, 'start'));
  if (step.zone === 'block') g.appendChild(cobweb(x, y, stepW, Math.min(STEP_H, baseY - y)));
  return g;
}

function ghostBody(): SVGPathElement {
  return el('path', {
    d: 'M-26 0 C-26 -34 -14 -48 0 -48 C14 -48 26 -34 26 0 L26 30 L17 22 L9 30 L0 22 L-9 30 L-17 22 L-26 30 Z',
    fill: MOON,
    'fill-opacity': 0.85,
  });
}

function ghostGroup(g: Ghost, index: number, count: number): SVGGElement {
  const slot = STAIRS_W / count;
  const cx = X0 + slot * (index + 0.5);
  const cy = TOP + 50;
  const root = el('g', { class: 'ghost', 'data-ghost': index });
  root.setAttribute('role', 'img');
  const title = el('title');
  title.textContent = g.fear;
  root.appendChild(title);

  const float = el('g', { class: 'ghost-float' });
  const body = el('g', { transform: `translate(${cx} ${cy})` });
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

  const chars = Math.max(6, Math.floor((slot - 10) / 6.2));
  root.appendChild(textBlock(wrapText(g.fear, chars, 3), cx, cy + 50, 11, MOON, 'middle'));
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

/** Builds the staircase. The person's phrases are written only as SVG text nodes. */
export function buildStaircase(reading: Reading, ghosts: Ghost[]): SVGSVGElement {
  const stairs = reading.steps.filter((s) => s.zone !== 'fear');
  const n = Math.max(1, stairs.length);
  const height = TOP + GHOST_H + n * STEP_H + 30;

  const svg = el('svg', {
    class: 'staircase',
    viewBox: `0 0 ${WIDTH} ${height}`,
    width: '100%',
    role: 'group',
    'aria-label': 'Your ladder as a staircase at night',
  });

  const moon = el('circle', { class: 'moon', cx: 70, cy: 45, r: 26, fill: MOON, opacity: 0.9 });
  moon.setAttribute('aria-hidden', 'true');
  svg.appendChild(moon);

  stairs.forEach((step, i) => {
    const nearest =
      step.zone === 'block' && reading.nearestBlock !== null && step.text === reading.nearestBlock;
    svg.appendChild(stairGroup(step, i, n, nearest));
  });

  if (ghosts.length === 0) {
    const none = textBlock(
      ['No ghosts were found above your goal.'],
      WIDTH / 2,
      TOP + 70,
      14,
      MIST,
      'middle',
    );
    none.setAttribute('class', 'no-ghosts');
    svg.appendChild(none);
  } else {
    ghosts.forEach((g, i) => {
      const node = ghostGroup(g, i, ghosts.length);
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
