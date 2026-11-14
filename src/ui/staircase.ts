import type { Reading, Step } from '../domain/server';
import { isFaded, type Ghost } from '../domain/ghosts';
import { t } from '../i18n';
import { svgArt, type ArtName } from './art';

const NS = 'http://www.w3.org/2000/svg';

// Colors are literal (not CSS variables) so the exported PNG looks the same.
const NIGHT = '#14112B';
const NIGHT_2 = '#221C45';
const MOON = '#F4EFE6';
const MIST = '#A9A3C7';
const PUMPKIN = '#FF8A3D';
const SHADOW = '#0B0919';

/** Height of the spirit pictures and size of the golden emblems, in SVG units. */
export const SPIRIT_H = 44;
export const EMBLEM_SIZE = 24;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Average glyph width (px at font-size 11) used for wrapping; tests use it to size text boxes. */
export const CHAR_W = 6.2;
/** Note text colors: MOON text on the solid NIGHT_2 card fill. */
export const STEP_FILL = NIGHT_2;
export const LABEL_COLOR = MOON;
/** Glyph width estimate at a given font size (CHAR_W is for size 11). */
export const charWidth = (size: number): number => (CHAR_W * size) / 11;

/** The picture is drawn at 1 unit = 1 CSS px for containers from VIEW_MIN to VIEW_MAX. */
export const VIEW_MIN = 300;
export const VIEW_MAX = 680;
/** Containers narrower than this (CSS px) are reported as the "narrow" layout. */
export const NARROW_MAX = 640;
export const NARROW_MIN = VIEW_MIN;

export const PAD = 12;
export const ROW = 60;
export const TOP = 64;
export const PLATE_H = ROW - 8;
export const FLOOR_ROOM = 28;
export const CARD_H = 54;
export const CARD_PAD = 8;
export const NOTE_GAP = 14;
export const NOTE_MIN_W = 160;
export const NOTE_FONT = 13;
export const NOTE_LINES = 3;
export const GHOST_ROOM = 34;
export const PLATE_MIN_W = 8;
export const PLATE_MAX_W = 56;

export type StaircaseOptions = {
  /** Container width in CSS px. Clamped to 300..680. 0 or missing means 680. */
  width?: number;
};

export type Layout = {
  /** Width of the picture in SVG units (= CSS px). */
  vw: number;
  /** Number of plates. */
  n: number;
  /** Plate width. */
  w: number;
  /** Left edge of the note cards. */
  noteX: number;
  cardW: number;
  height: number;
  narrow: boolean;
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** One geometry for every width. `count` is the number of steps, fears included. */
export function staircaseLayout(count: number, width?: number): Layout {
  const n = Math.max(1, count);
  const cw = width !== undefined && width > 0 ? width : VIEW_MAX;
  const vw = clamp(Math.round(cw), VIEW_MIN, VIEW_MAX);
  const stairW = Math.min(Math.round(vw * 0.42), vw - 2 * PAD - NOTE_GAP - NOTE_MIN_W);
  const w = clamp(Math.floor(stairW / n), PLATE_MIN_W, PLATE_MAX_W);
  const noteX = PAD + n * w + NOTE_GAP;
  return {
    vw,
    n,
    w,
    noteX,
    cardW: vw - PAD - noteX,
    height: TOP + n * ROW + FLOOR_ROOM,
    narrow: cw < NARROW_MAX,
  };
}

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
  const node = el('text', {
    x,
    y,
    'font-size': size,
    fill,
    'text-anchor': anchor,
    'font-family': FONT,
  });
  lines.forEach((line, i) => {
    const span = el('tspan', { x, dy: i === 0 ? 0 : size * 1.25 });
    span.textContent = line;
    node.appendChild(span);
  });
  return node;
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
  for (const f of [0.35, 0.7]) {
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

const stepX = (i: number, L: Layout): number => PAD + i * L.w;
const stepY = (i: number, L: Layout): number => TOP + (L.n - 1 - i) * ROW;

/** First text baseline so a block of `lines` lines sits in the middle of a card. */
function noteBaseline(cardY: number, lines: number): number {
  const total = NOTE_FONT + (lines - 1) * NOTE_FONT * 1.25;
  return cardY + CARD_H / 2 - total / 2 + NOTE_FONT * 0.77;
}

type PlateStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash: string | null;
  num: string;
};

function plateStyle(step: Step, nearest: boolean, lit: boolean): PlateStyle {
  switch (step.zone) {
    case 'current':
      return { fill: MOON, stroke: MOON, strokeWidth: 1, dash: null, num: NIGHT };
    case 'goal':
      return { fill: PUMPKIN, stroke: PUMPKIN, strokeWidth: 1, dash: null, num: NIGHT };
    case 'fear':
      return lit
        ? { fill: NIGHT_2, stroke: MOON, strokeWidth: 1.5, dash: null, num: MOON }
        : { fill: NIGHT, stroke: MIST, strokeWidth: 1.5, dash: '4 3', num: MOON };
    default:
      return {
        fill: NIGHT_2,
        stroke: nearest ? PUMPKIN : MIST,
        strokeWidth: nearest ? 2.5 : 1,
        dash: null,
        num: MOON,
      };
  }
}

function badgeLabel(step: Step): string | null {
  if (step.zone === 'current') return t('badgeMe');
  if (step.zone === 'goal') return t('badgeGoal');
  return null;
}

/** The golden emblem of a card that is not a fear. */
function emblemFor(step: Step, nearest: boolean): ArtName {
  if (step.zone === 'current') return 'shanyraq';
  if (step.zone === 'goal') return 'burkit';
  return nearest ? 'asyq' : 'tumar';
}

function stairGroup(
  step: Step,
  index: number,
  L: Layout,
  nearest: boolean,
  fearIndex: number | null,
): SVGGElement {
  const x = stepX(index, L);
  const y = stepY(index, L);
  const midY = y + PLATE_H / 2;
  const cardY = midY - CARD_H / 2;
  const cls = ['stair', `stair-${step.zone}`, nearest ? 'nearest' : ''].filter(Boolean).join(' ');

  const g = el('g', { class: cls, 'data-zone': step.zone });
  g.setAttribute('role', 'img');
  g.setAttribute('aria-label', `${step.zoneLabel}: ${step.text}`);
  const title = el('title');
  title.textContent = step.text; // the full words, even when the card text is cut
  g.appendChild(title);

  const style = plateStyle(step, nearest, false);
  g.appendChild(
    el('rect', {
      class: 'plate-shadow',
      x: x + 2,
      y: y + 2,
      width: L.w,
      height: PLATE_H,
      rx: 5,
      fill: SHADOW,
      'aria-hidden': 'true',
    }),
  );
  const plate = el('rect', {
    class: 'plate',
    x,
    y,
    width: L.w,
    height: PLATE_H,
    rx: 5,
    fill: style.fill,
    stroke: style.stroke,
    'stroke-width': style.strokeWidth,
  });
  if (style.dash) plate.setAttribute('stroke-dasharray', style.dash);
  if (fearIndex !== null) plate.setAttribute('data-ghost', String(fearIndex));
  g.appendChild(plate);

  if (step.zone === 'block') {
    g.appendChild(cobweb(x + 1, y + 1, Math.min(L.w - 2, 20), 20));
  }

  if (L.w >= 16) {
    const size = L.w >= 24 ? 13 : 11;
    const num = el('text', {
      class: 'plate-num',
      x: x + L.w / 2,
      y: midY + size * 0.36,
      'font-size': size,
      'font-weight': 700,
      fill: style.num,
      'text-anchor': 'middle',
      'font-family': FONT,
    });
    num.textContent = String(step.number);
    g.appendChild(num);
  }

  if (step.zone === 'goal') {
    g.appendChild(
      el('circle', { class: 'goal-ring', cx: x + L.w / 2, cy: y - 12, r: 8, fill: 'none', stroke: PUMPKIN, 'stroke-width': 1.5, opacity: 0.6 }),
    );
    g.appendChild(
      el('circle', { class: 'goal-light', cx: x + L.w / 2, cy: y - 12, r: 5, fill: PUMPKIN }),
    );
  }

  // Leader line from the plate to its card, with a dot at the plate end.
  const leader = el('line', {
    class: 'leader',
    x1: x + L.w,
    y1: midY,
    x2: L.noteX,
    y2: midY,
    stroke: MIST,
    'stroke-width': 1,
    'aria-hidden': 'true',
  });
  if (step.zone === 'goal') leader.setAttribute('stroke-dasharray', '3 3');
  g.appendChild(leader);
  g.appendChild(
    el('circle', { class: 'leader-dot', cx: x + L.w, cy: midY, r: 2.5, fill: MIST, 'aria-hidden': 'true' }),
  );

  g.appendChild(
    el('rect', {
      class: 'note',
      x: L.noteX,
      y: cardY,
      width: L.cardW,
      height: CARD_H,
      rx: 8,
      fill: NIGHT_2,
      stroke: MIST,
      'stroke-opacity': 0.35,
      'stroke-width': 1,
    }),
  );

  // The emblem sits in the room that a fear card gives to its ghost; the words start after it.
  if (step.zone !== 'fear') {
    g.appendChild(
      svgArt(emblemFor(step, nearest), 'emblem', {
        'data-emblem': emblemFor(step, nearest),
        x: L.noteX + CARD_PAD + (GHOST_ROOM - EMBLEM_SIZE) / 2,
        y: midY - EMBLEM_SIZE / 2,
        width: EMBLEM_SIZE,
        height: EMBLEM_SIZE,
      }),
    );
  }

  let left = GHOST_ROOM;
  const badge = badgeLabel(step);
  if (badge !== null) {
    const bw = Math.ceil(badge.length * charWidth(11) * 1.15) + 14;
    const bx = L.noteX + CARD_PAD + GHOST_ROOM;
    g.appendChild(
      el('rect', {
        class: 'badge',
        x: bx,
        y: midY - 8,
        width: bw,
        height: 16,
        rx: 8,
        fill: step.zone === 'goal' ? PUMPKIN : MOON,
      }),
    );
    const bt = el('text', {
      class: 'badge-text',
      x: bx + bw / 2,
      y: midY + 4,
      'font-size': 11,
      'font-weight': 700,
      fill: NIGHT,
      'text-anchor': 'middle',
      'font-family': FONT,
    });
    bt.textContent = badge;
    g.appendChild(bt);
    left = GHOST_ROOM + bw + 6;
  }

  // Fear words are drawn by the ghost, next to the ghost inside the same card.
  if (step.zone !== 'fear') {
    const avail = L.cardW - 2 * CARD_PAD - left;
    const chars = Math.max(1, Math.floor(avail / charWidth(NOTE_FONT)));
    const lines = wrapText(step.text, chars, NOTE_LINES);
    const label = textBlock(
      lines,
      L.noteX + CARD_PAD + left,
      noteBaseline(cardY, lines.length),
      NOTE_FONT,
      LABEL_COLOR,
      'start',
    );
    label.setAttribute('class', 'step-label');
    g.appendChild(label);
  }
  return g;
}

function ghostGroup(g: Ghost, index: number, stepIndex: number, L: Layout): SVGGElement {
  const midY = stepY(stepIndex, L) + PLATE_H / 2;
  const cardY = midY - CARD_H / 2;
  // The spirit stands in the ghost room at the left of its card, centered on the card.
  const cx = L.noteX + CARD_PAD + GHOST_ROOM / 2;
  const cy = midY;

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
  // `.ghost-body` keeps a plain translate(x y). The Zheztyrnaq and the Peri stand on top of
  // each other; applyGhostState decides which one is shown. The turning picture is a short
  // CSS-only flash between the two.
  const body = el('g', { class: 'ghost-body', transform: `translate(${cx} ${cy})` });
  const spirit = { x: -GHOST_ROOM / 2, y: -SPIRIT_H / 2, width: GHOST_ROOM, height: SPIRIT_H };
  body.appendChild(svgArt('zheztyrnaq', 'spirit-dark', { ...spirit, opacity: 1 }));
  body.appendChild(svgArt('peri', 'spirit-light', { ...spirit, opacity: 0 }));
  body.appendChild(svgArt('spirit-turning', 'spirit-turning', { ...spirit, opacity: 0 }));
  float.appendChild(body);
  root.appendChild(float);

  // The check sits outside the floating group so it stays still and crisp. A dark outline
  // under the pumpkin stroke keeps it visible on the golden Peri.
  const check = el('g', { class: 'ghost-check', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const d = `M${cx + 3} ${cy + 15} l3.5 4 l7 -8`;
  check.appendChild(el('path', { d, stroke: NIGHT, 'stroke-width': 5.5 }));
  check.appendChild(el('path', { d, stroke: PUMPKIN, 'stroke-width': 2.5 }));
  root.appendChild(check);

  const avail = L.cardW - 2 * CARD_PAD - GHOST_ROOM;
  const chars = Math.max(1, Math.floor(avail / charWidth(NOTE_FONT)));
  const lines = wrapText(g.fear, chars, NOTE_LINES);
  const label = textBlock(
    lines,
    L.noteX + CARD_PAD + GHOST_ROOM,
    noteBaseline(cardY, lines.length),
    NOTE_FONT,
    MOON,
    'start',
  );
  label.setAttribute('class', 'ghost-label');
  root.appendChild(label);
  return root;
}

function restartTurn(root: Element): void {
  // Remove and add the class again so the CSS turning animation plays from the start.
  root.classList.remove('turning');
  void root.getBoundingClientRect();
  root.classList.add('turning');
}

function applyGhostState(
  svg: Element,
  root: Element,
  ghost: Ghost,
  index: number,
  animate = false,
): void {
  const faded = isFaded(ghost);
  const changed = root.classList.contains('faded') !== faded;
  root.classList.toggle('faded', faded);
  root.setAttribute(
    'aria-label',
    faded ? t('ghostFadedAria', { fear: ghost.fear }) : t('ghostAria', { fear: ghost.fear }),
  );
  // The Zheztyrnaq turns into the Peri at full strength, and back when the step is cleared.
  root.querySelector('.spirit-dark')?.setAttribute('opacity', faded ? '0' : '1');
  root.querySelector('.spirit-light')?.setAttribute('opacity', faded ? '1' : '0');
  root.querySelector('.ghost-check')?.setAttribute('visibility', faded ? 'visible' : 'hidden');
  if (animate && changed) restartTurn(root);

  const plate = svg.querySelector(`rect.plate[data-ghost="${index}"]`);
  if (plate) {
    const style = plateStyle({ number: 0, zone: 'fear', zoneLabel: '', text: '' }, false, faded);
    plate.classList.toggle('lit', faded);
    plate.setAttribute('fill', style.fill);
    plate.setAttribute('stroke', style.stroke);
    plate.setAttribute('stroke-width', String(style.strokeWidth));
    if (style.dash) plate.setAttribute('stroke-dasharray', style.dash);
    else plate.removeAttribute('stroke-dasharray');
  }
}

/**
 * Builds the staircase seen from the side, like the Ladder on 108psy.com: one numbered plate per
 * step, each one step right of and one row above the one before, with the person's words in a
 * note card in a column to the right. Drawn at 1 SVG unit = 1 CSS px for containers from 300 to
 * 680 px wide. The person's phrases are written only as SVG text nodes.
 */
export function buildStaircase(
  reading: Reading,
  ghosts: Ghost[],
  opts: StaircaseOptions = {},
): SVGSVGElement {
  const steps = reading.steps;
  const L = staircaseLayout(steps.length, opts.width);

  const svg = el('svg', {
    class: 'staircase',
    viewBox: `0 0 ${L.vw} ${L.height}`,
    width: '100%',
    role: 'group',
    'aria-label': t('staircaseAria'),
    'data-layout': L.narrow ? 'narrow' : 'wide',
  });

  svg.appendChild(
    svgArt('steppe-night', 'backdrop', {
      x: 0,
      y: 0,
      width: L.vw,
      height: L.height,
      preserveAspectRatio: 'xMidYMid slice',
    }),
  );

  // The moon waits in the empty top left corner above the low plates.
  const moon = el('circle', { class: 'moon', cx: PAD + 28, cy: 34, r: 20, fill: MOON, opacity: 0.9 });
  moon.setAttribute('aria-hidden', 'true');
  svg.appendChild(moon);

  const floorY = TOP + L.n * ROW - 4;
  const back = el('g', { class: 'frame', 'aria-hidden': 'true' });
  steps.forEach((_, i) => {
    const top = stepY(i, L) + PLATE_H;
    if (floorY > top) {
      back.appendChild(
        el('rect', { class: 'riser', x: stepX(i, L), y: top, width: L.w, height: floorY - top, fill: NIGHT_2, opacity: 0.35 }),
      );
    }
  });
  back.appendChild(
    el('line', { class: 'floor', x1: PAD, y1: floorY, x2: PAD + L.n * L.w, y2: floorY, stroke: MIST, 'stroke-width': 2 }),
  );
  // Banister: one post on each plate and a rail through the post tops.
  const rail: string[] = [];
  steps.forEach((_, i) => {
    const px = stepX(i, L);
    const py = stepY(i, L) - 22;
    back.appendChild(el('rect', { class: 'post', x: px, y: py, width: 2, height: 22, fill: MIST, opacity: 0.7 }));
    rail.push(`${px + 1},${py}`);
  });
  back.appendChild(
    el('polyline', { class: 'rail', points: rail.join(' '), fill: 'none', stroke: MIST, 'stroke-width': 1.5, opacity: 0.7 }),
  );
  svg.appendChild(back);

  const fearSteps: number[] = [];
  let nearestUsed = false;
  steps.forEach((step, i) => {
    let nearest = false;
    if (!nearestUsed && step.zone === 'block' && reading.nearestBlock !== null && step.text === reading.nearestBlock) {
      nearest = true;
      nearestUsed = true;
    }
    const fearIndex = step.zone === 'fear' ? fearSteps.length : null;
    if (fearIndex !== null) fearSteps.push(i);
    svg.appendChild(stairGroup(step, i, L, nearest, fearIndex));
  });

  if (fearSteps.length === 0) {
    const lines = wrapText(t('noGhosts'), Math.floor(L.cardW / charWidth(NOTE_FONT)), 2);
    const none = textBlock(lines, L.noteX, 28, NOTE_FONT, MIST, 'start');
    none.setAttribute('class', 'no-ghosts');
    svg.appendChild(none);
  } else {
    fearSteps.forEach((stepIndex, gi) => {
      const fear = steps[stepIndex]?.text ?? '';
      const ghost: Ghost = ghosts[gi] ?? { fear, step: '' };
      const node = ghostGroup(ghost, gi, stepIndex, L);
      svg.appendChild(node);
      applyGhostState(svg, node, ghost, gi);
    });
  }
  return svg;
}

/** Updates fade, check marks and fear plates in place when a step is written or cleared. */
export function updateGhosts(svg: SVGSVGElement, ghosts: Ghost[]): void {
  ghosts.forEach((g, i) => {
    const root = svg.querySelector(`.ghost[data-ghost="${i}"]`);
    if (root) applyGhostState(svg, root, g, i, true);
  });
}
